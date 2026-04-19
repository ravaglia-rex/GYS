import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { LoadingSpinner as Spinner } from "../ui/spinner";
import { useToast } from "../ui/use-toast";
import { checkActionCode, confirmPasswordReset, signInWithEmailAndPassword, signOut, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import * as Sentry from "@sentry/react";
import { useNavigate } from "react-router-dom";
import { checkSchoolEmail, verifySchoolEmail } from "../../db/schoolAdminCollection";
import authTokenHandler from "../../functions/auth_token/auth_token_handler";
import {
  clearPasswordResetInProgress,
  setPasswordResetInProgress,
} from "../../pages/authentication_pages/authActionSession";

const passwordSetupSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

interface SchoolAdminPasswordSetupFromLinkProps {
  actionCode: string;
}

const SchoolAdminPasswordSetupFromLink: React.FC<SchoolAdminPasswordSetupFromLinkProps> = ({ actionCode }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!actionCode) return;
    let cancelled = false;
    verifyPasswordResetCode(auth, actionCode)
      .then((email) => {
        if (!cancelled) setResolvedEmail(email);
      })
      .catch(() => {
        if (!cancelled) setResolvedEmail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [actionCode]);

  const form = useForm({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof passwordSetupSchema>) => {
    try {
      setPasswordResetInProgress();
      setIsSubmitted(true);

      const actionCodeInfo = await checkActionCode(auth, actionCode);
      const email = actionCodeInfo.data?.email;
      if (!email) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not determine email from link. Please use the link from your email again.",
        });
        setIsSubmitted(false);
        clearPasswordResetInProgress();
        return;
      }

      await confirmPasswordReset(auth, actionCode, data.password);

      const { user } = await signInWithEmailAndPassword(auth, email, data.password);
      try {
        const schoolInfo = await checkSchoolEmail(user.email!);
        if (schoolInfo && !schoolInfo.verified) {
          const authToken = await user.getIdToken();
          authTokenHandler.setAuthToken(authToken);
          await verifySchoolEmail(user.email!);
        }
      } catch (error: any) {
        console.error("Error verifying school email:", error);
        const msg = error.response?.data?.error ?? error.message ?? "Could not mark school as verified.";
        toast({
          variant: "destructive",
          title: "Verification update failed",
          description: msg,
        });
      }

      toast({
        variant: "default",
        title: "Password saved",
        description: "Taking you to the login page…",
      });

      await signOut(auth);
      clearPasswordResetInProgress();
      navigate("/", { replace: true });
    } catch (error: any) {
      clearPasswordResetInProgress();
      console.error("Error setting password:", error);

      Sentry.withScope((scope) => {
        scope.setTag("location", "SchoolAdminPasswordSetupFromLink.onSubmit");
        scope.setExtra("error", error);
        scope.setExtra("errorCode", error.code);
        scope.setExtra("errorMessage", error.message);
        Sentry.captureException(error);
      });

      let errorMessage = "An error occurred. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      setIsSubmitted(false);
    }
  };

  const cardClass =
    "w-full rounded-2xl border border-white/15 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-md sm:p-10";

  return (
    <div className={cardClass}>
      {resolvedEmail && (
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">School account email</p>
          <p className="mt-1 break-all text-sm font-semibold text-white">{resolvedEmail}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-200">Password</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 border-white/15 bg-slate-950/50 text-base text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create your password"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">Minimum of 6 characters</FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-200">Confirm password</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 border-white/15 bg-slate-950/50 text-base text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isSubmitted}
            className="h-12 w-full text-base font-semibold shadow-lg transition-all bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
          >
            {isSubmitted ? <Spinner /> : "Save password"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SchoolAdminPasswordSetupFromLink;

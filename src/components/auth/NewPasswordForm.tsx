import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkActionCode,
  confirmPasswordReset,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useToast } from "../ui/use-toast";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

import * as Sentry from "@sentry/react";
import {
  clearPasswordResetInProgress,
  setPasswordResetInProgress,
} from "../../pages/authentication_pages/authActionSession";

interface PasswordResetProps {
  actionCode: string;
}

const passwordResetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

const NewPasswordForm: React.FC<PasswordResetProps> = ({ actionCode }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitted, setSubmitted] = useState<boolean>(false);
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
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: { password: string; confirm_password: string }) => {
    try {
      setPasswordResetInProgress();
      setSubmitted(true);

      const actionCodeInfo = await checkActionCode(auth, actionCode);
      const email = actionCodeInfo.data?.email;
      if (!email) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not determine email from link. Please use the link from your email again.",
        });
        setSubmitted(false);
        clearPasswordResetInProgress();
        return;
      }

      const { checkSchoolEmail } = await import("../../db/schoolAdminCollection");
      const schoolProbe = await checkSchoolEmail(email);
      if (schoolProbe && schoolProbe.registrationPaymentComplete !== true) {
        toast({
          variant: "destructive",
          title: "Payment required",
          description:
            "Complete your school’s subscription using the secure payment link in your registration confirmation email before setting a password.",
        });
        setSubmitted(false);
        clearPasswordResetInProgress();
        return;
      }

      await confirmPasswordReset(auth, actionCode, data.password);

      const { user } = await signInWithEmailAndPassword(auth, email, data.password);
      try {
        const { verifySchoolEmail } = await import("../../db/schoolAdminCollection");
        const schoolInfo = await checkSchoolEmail(user.email!);
        if (schoolInfo && !schoolInfo.verified) {
          const authToken = await user.getIdToken();
          const { default: authTokenHandler } = await import("../../functions/auth_token/auth_token_handler");
          authTokenHandler.setAuthToken(authToken);
          await verifySchoolEmail(user.email!);
        }
      } catch (err: any) {
        console.error("Error verifying school email:", err);
        toast({
          variant: "destructive",
          title: "Verification update failed",
          description: err.response?.data?.error ?? err.message ?? "Could not mark school as verified.",
        });
      }

      await signOut(auth);
      clearPasswordResetInProgress();
      toast({
        variant: "default",
        title: "Password saved",
        description: "Taking you to the login page…",
      });
      navigate("/", { replace: true });
    } catch (error: any) {
      clearPasswordResetInProgress();
      Sentry.withScope((scope) => {
        scope.setTag("location", "PasswordResetForm.confirmPasswordReset");
        Sentry.captureException(error);
      });
      toast({
        variant: "destructive",
        title: "Password Reset Error",
        description: error.message,
      });
      setSubmitted(false);
    }
  };

  const cardClass =
    "w-full rounded-2xl border border-white/15 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-md sm:p-10";

  return (
    <div className={cardClass}>
      {resolvedEmail && (
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Account</p>
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
                <FormLabel className="text-sm font-medium text-slate-200">New password</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 border-white/15 bg-slate-950/50 text-base text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter a new password"
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">
                  At least 6 characters. Use a mix of letters, numbers, and symbols if you can.
                </FormDescription>
                <FormMessage className="text-red-400">{form.formState.errors.password?.message}</FormMessage>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-200">Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    className="h-11 border-white/15 bg-slate-950/50 text-base text-white placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                  />
                </FormControl>
                <FormMessage className="text-red-400">{form.formState.errors.confirm_password?.message}</FormMessage>
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

export default NewPasswordForm;

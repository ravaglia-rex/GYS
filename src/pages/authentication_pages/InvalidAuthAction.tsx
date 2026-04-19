import React from "react";
import PasswordActionLayout from "../../components/auth/PasswordActionLayout";

const InvalidAuthAction: React.FC = () => {
  return (
    <PasswordActionLayout
      title="This link isn’t valid anymore"
      description="The link may have expired, already been used, or was copied incorrectly. Request a new password reset or verification email from the login page."
    >
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/40 p-8 text-center shadow-xl backdrop-blur-md sm:p-10">
        <p className="text-sm leading-relaxed text-amber-100/90">
          If you already set a new password on the Firebase-branded page and then opened this address with no link
          parameters, go to the portal home, enter your school email with &quot;I am a school official&quot;, and use
          &quot;Sign in&quot; (or request a new link if you still need one).
        </p>
        <p className="mt-4 text-sm leading-relaxed text-amber-100/90">
          For school officials: open the portal, enter your school email, check &quot;I am a school official&quot;, and send yourself a new setup link if needed.
        </p>
        <p className="mt-6 text-xs text-slate-500">
          Need help?{" "}
          <a href="mailto:talentsearch@argus.ai" className="font-medium text-indigo-300 hover:underline">
            talentsearch@argus.ai
          </a>
        </p>
      </div>
    </PasswordActionLayout>
  );
};

export default InvalidAuthAction;

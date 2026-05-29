import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Background visual glowing gradients */}
      <div className="absolute top-[-20%] left-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-20%] h-[500px] w-[500px] rounded-full bg-violet-600/5 blur-[100px]" />

      <div className="relative p-6 rounded-3xl bg-white/[0.02] backdrop-blur-md shadow-2xl border border-white/5 max-w-sm w-full flex justify-center animate-fade-in">
        <SignUp
          routing="path"
          path="/sign-up"
          fallbackRedirectUrl="/dashboard"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              card: "bg-transparent shadow-none border-none w-full",
              headerTitle: "text-slate-100 font-extrabold",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-slate-100 transition-all font-semibold",
              socialButtonsBlockButtonText: "text-slate-200",
              formButtonPrimary: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold transition-all duration-300",
              formFieldLabel: "text-slate-300 font-semibold text-xs",
              formFieldInput: "bg-white/5 border border-white/10 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-xl py-2.5",
              footerActionLink: "text-blue-400 hover:text-blue-300 transition-all font-semibold",
              identityPreviewText: "text-slate-200",
              identityPreviewEditButtonIcon: "text-blue-400",
              formResendCodeLink: "text-blue-400 hover:text-blue-300 transition-all",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500 text-[10px]",
            },
          }}
        />
      </div>
    </div>
  );
}

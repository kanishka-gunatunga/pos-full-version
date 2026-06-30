import { Suspense } from "react";
import LoginForm from "@/components/login/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="login-bg absolute inset-0" aria-hidden />
      <div className="absolute inset-0 bg-zinc-900/50" aria-hidden />

      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-8 p-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <footer className="flex flex-col items-center gap-1 text-center font-[Arial] text-[10px] font-normal leading-[15px] tracking-[2px] uppercase text-[#FFFFFF66]">
          <span>Powered by SLTMobitel</span>
          <span>• Secure Connection Enabled</span>
        </footer>
      </div>
    </div>
  );
}

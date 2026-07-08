import { Suspense } from "react";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">加载中…</div>}>
      <RegisterForm />
    </Suspense>
  );
}

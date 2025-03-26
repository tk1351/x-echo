import { LoginFormWrapper } from "@/components/auth/login-form-wrapper";

export default function Login() {
  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>
      <LoginFormWrapper />
    </div>
  );
}

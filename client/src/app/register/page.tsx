import { RegisterFormWrapper } from "@/components/auth/register-form-wrapper";

export default function Register() {
  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">アカウント登録</h1>
      <RegisterFormWrapper />
    </div>
  );
}

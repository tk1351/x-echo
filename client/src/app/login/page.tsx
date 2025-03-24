import { LoginForm } from "@/components/auth/login-form";
import type { LoginFormData } from "@/validations/auth";

export default function Login() {
  // This is a Server Component, so we can't handle form submission here
  // The actual form submission will be handled in the Client Component
  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>
      <LoginForm
        onSubmit={(data) => {
          // This is just a placeholder for now
          // In the future, this will be connected to the API
          console.log("Form submitted:", data);
        }}
      />
    </div>
  );
}

"use client";

import { registerUser } from "@/lib/api-client";
import type { RegisterFormData } from "@/validations/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RegisterForm } from "./register-form";

export function RegisterFormWrapper() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Call the API to register the user
      await registerUser({
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        password: data.password,
      });

      // Log for debugging purposes
      console.log("Form submitted:", data);

      // Redirect to login page after successful registration
      router.push("/login");
    } catch (err) {
      // Display specific error message from API if available
      setError(
        err instanceof Error
          ? err.message
          : "登録に失敗しました。後でもう一度お試しください。",
      );
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div
          className="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
}

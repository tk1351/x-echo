'use client'

import { LoginForm } from "./login-form";
import type { LoginFormData } from "@/validations/auth";
import { useState } from "react";

export function LoginFormWrapper() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // In the future, this will be connected to the API
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });

      console.log("Form submitted:", data);

      // Success handling (e.g., redirect)
      // if (response.ok) {
      //   router.push('/dashboard');
      // } else {
      //   const errorData = await response.json();
      //   setError(errorData.message || 'Authentication failed');
      // }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-error-100 border border-error-300 text-error-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}
      <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
}

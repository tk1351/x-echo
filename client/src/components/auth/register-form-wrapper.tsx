'use client'

import { RegisterForm } from "./register-form";
import type { RegisterFormData } from "@/validations/auth";
import { useState } from "react";

export function RegisterFormWrapper() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // In the future, this will be connected to the API
      // const response = await fetch('/api/users/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });

      console.log("Form submitted:", data);

      // Success handling (e.g., redirect)
      // if (response.ok) {
      //   router.push('/login');
      // } else {
      //   const errorData = await response.json();
      //   setError(errorData.message || 'Registration failed');
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
      <RegisterForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </>
  );
}

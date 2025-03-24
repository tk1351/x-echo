"use client";
import { loginSchema } from "@/validations/auth";
import type { LoginFormData } from "@/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  isSubmitting?: boolean;
}

export function LoginForm({ onSubmit, isSubmitting: externalIsSubmitting }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Combine external and form isSubmitting states
  const isSubmitting = externalIsSubmitting || formIsSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="ログイン"
      className="space-y-4"
    >
      <div className="space-y-2">
        <label htmlFor="identifier" className="block text-sm font-medium">
          ユーザー名またはメールアドレス
        </label>
        <input
          id="identifier"
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          {...register("identifier")}
          aria-invalid={errors.identifier ? "true" : "false"}
        />
        {errors.identifier && (
          <p className="text-error-500 text-sm" role="alert">
            {errors.identifier.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 border rounded-md"
          {...register("password")}
          aria-invalid={errors.password ? "true" : "false"}
        />
        {errors.password && (
          <p className="text-error-500 text-sm" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? "Processing..." : "ログイン"}
      </button>
    </form>
  );
}

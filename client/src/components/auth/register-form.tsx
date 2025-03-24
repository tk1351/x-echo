"use client";
import { registerSchema } from "@/validations/auth";
import type { RegisterFormData } from "@/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => void;
  isSubmitting?: boolean;
}

export function RegisterForm({ onSubmit, isSubmitting: externalIsSubmitting }: RegisterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
    },
  });

  // Combine external and form isSubmitting states
  const isSubmitting = externalIsSubmitting || formIsSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="登録"
      className="space-y-4"
    >
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium">
          ユーザー名
        </label>
        <input
          id="username"
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          {...register("username")}
          aria-invalid={errors.username ? "true" : "false"}
        />
        {errors.username && (
          <p className="text-error-500 text-sm" role="alert">
            {errors.username.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="displayName" className="block text-sm font-medium">
          表示名
        </label>
        <input
          id="displayName"
          type="text"
          className="w-full px-3 py-2 border rounded-md"
          {...register("displayName")}
          aria-invalid={errors.displayName ? "true" : "false"}
        />
        {errors.displayName && (
          <p className="text-error-500 text-sm" role="alert">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          className="w-full px-3 py-2 border rounded-md"
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
        />
        {errors.email && (
          <p className="text-error-500 text-sm" role="alert">
            {errors.email.message}
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
        {isSubmitting ? "Processing..." : "登録"}
      </button>
    </form>
  );
}

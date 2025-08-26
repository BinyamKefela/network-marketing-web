"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserInput } from "@/schemas/user-schema";

type Props = {
  defaultValues?: Partial<UserInput>;
  onSubmit: (data: UserInput) => void;
  submitLabel?: string;
  loading?: boolean;
};

export default function UserForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  loading,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: defaultValues?.email ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          {...register("email")}
          type="email"
          className="w-full mt-1 p-2 border rounded-lg focus:ring focus:ring-blue-400"
          placeholder="jane@example.com"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

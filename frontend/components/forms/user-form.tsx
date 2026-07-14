"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  editUserSchema,
  resetPasswordSchema,
  type CreateUserFormData,
  type EditUserFormData,
  type ResetPasswordFormData,
} from "@/utils/validation";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/common/modal";

interface CreateUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateUserFormData) => void;
  isLoading?: boolean;
}

export function CreateUserForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "user", full_name: "", is_active: true },
  });

  const handleFormSubmit = (data: CreateUserFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add User"
      description="Create a new user account"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" {...register("full_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            defaultValue="user"
            onValueChange={(v) => setValue("role", v as "admin" | "user")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (data: EditUserFormData) => void;
  isLoading?: boolean;
}

export function EditUserForm({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
}: EditUserFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    values: user
      ? {
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        }
      : undefined,
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit User"
      description={`Update account for ${user?.full_name || user?.email || ""}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-full_name">Full Name</Label>
          <Input id="edit-full_name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-sm text-destructive">{errors.full_name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input id="edit-email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={user?.role}
            onValueChange={(v) => setValue("role", v as "admin" | "user")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface ResetPasswordFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSubmit: (data: ResetPasswordFormData) => void;
  isLoading?: boolean;
}

export function ResetPasswordForm({
  open,
  onOpenChange,
  user,
  onSubmit,
  isLoading,
}: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const submit = (data: ResetPasswordFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Reset Password"
      description={`Set a new password for ${user?.full_name || user?.email || ""}`}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <Input id="new_password" type="password" {...register("new_password")} />
          {errors.new_password && (
            <p className="text-sm text-destructive">
              {errors.new_password.message}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

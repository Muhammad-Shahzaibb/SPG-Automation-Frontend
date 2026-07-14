"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { userService } from "@/services";
import { extractErrorMessage } from "@/services/api-client";
import type { User } from "@/types";
import type {
  CreateUserFormData,
  EditUserFormData,
  ResetPasswordFormData,
} from "@/utils/validation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, SortableHeader } from "@/components/tables/data-table";
import { SearchBar } from "@/components/common/search-bar";
import { FilterControls } from "@/components/common/filter-controls";
import { StatusBadge } from "@/components/common/status-badge";
import { ActionMenu } from "@/components/common/action-menu";
import { ConfirmationDialog } from "@/components/common/confirmation-dialog";
import {
  CreateUserForm,
  EditUserForm,
  ResetPasswordForm,
} from "@/components/forms/user-form";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format";
import { toast } from "sonner";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);

  const query = useQuery({
    queryKey: ["users"],
    queryFn: userService.getUsers,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
      toast.success("User created");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditUserFormData }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      invalidate();
      setEditUser(null);
      toast.success("User updated");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      invalidate();
      setDeleteUser(null);
      toast.success("User deleted");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const activateMutation = useMutation({
    mutationFn: userService.activate,
    onSuccess: () => {
      invalidate();
      toast.success("User activated");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const deactivateMutation = useMutation({
    mutationFn: userService.deactivate,
    onSuccess: () => {
      invalidate();
      toast.success("User deactivated");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const resetMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ResetPasswordFormData;
    }) => userService.resetPassword(id, data),
    onSuccess: (res) => {
      setResetUser(null);
      toast.success(res.detail || "Password reset");
    },
    onError: (e) => toast.error(extractErrorMessage(e)),
  });

  const filtered = useMemo(() => {
    let items = query.data ?? [];
    const q = search.toLowerCase();
    if (q) {
      items = items.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.full_name.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") {
      items = items.filter((u) => u.role === roleFilter);
    }
    if (statusFilter === "active") {
      items = items.filter((u) => u.is_active);
    } else if (statusFilter === "inactive") {
      items = items.filter((u) => !u.is_active);
    }
    return items;
  }, [query.data, search, roleFilter, statusFilter]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "full_name",
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      cell: ({ row }) => row.original.full_name || "—",
    },
    {
      accessorKey: "email",
      header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => <StatusBadge active={row.original.is_active} />,
    },
    {
      accessorKey: "last_login_at",
      header: "Last Login",
      cell: ({ row }) =>
        row.original.last_login_at
          ? formatDate(row.original.last_login_at)
          : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <ActionMenu
            items={[
              { label: "Edit", onClick: () => setEditUser(user) },
              {
                label: user.is_active ? "Deactivate" : "Activate",
                onClick: () =>
                  user.is_active
                    ? deactivateMutation.mutate(user.id)
                    : activateMutation.mutate(user.id),
              },
              {
                label: "Reset Password",
                onClick: () => setResetUser(user),
              },
              {
                label: "Delete",
                onClick: () => setDeleteUser(user),
                variant: "destructive",
                separator: true,
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage user accounts, roles, and access."
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email..."
          className="sm:max-w-xs"
        />
        <FilterControls
          filters={[
            {
              key: "role",
              label: "Role",
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
              ],
            },
            {
              key: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
          ]}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState
          description={extractErrorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : (
        <DataTable columns={columns} data={filtered} pageSize={10} />
      )}

      <CreateUserForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(data: CreateUserFormData) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <EditUserForm
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser}
        onSubmit={(data) =>
          editUser && updateMutation.mutate({ id: editUser.id, data })
        }
        isLoading={updateMutation.isPending}
      />

      <ResetPasswordForm
        open={!!resetUser}
        onOpenChange={(open) => !open && setResetUser(null)}
        user={resetUser}
        onSubmit={(data) =>
          resetUser && resetMutation.mutate({ id: resetUser.id, data })
        }
        isLoading={resetMutation.isPending}
      />

      <ConfirmationDialog
        open={!!deleteUser}
        onOpenChange={(open) => !open && setDeleteUser(null)}
        title="Delete User"
        description={`Delete ${deleteUser?.full_name || deleteUser?.email}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

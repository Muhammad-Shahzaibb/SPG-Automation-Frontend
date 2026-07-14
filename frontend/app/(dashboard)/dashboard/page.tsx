"use client";

import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Users,
  UserCheck,
  Layers,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/hooks/use-auth";
import { dashboardService } from "@/services";
import { extractErrorMessage } from "@/services/api-client";
import type { AdminUserActivity } from "@/types";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { DataTable, SortableHeader } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { PageSkeleton, TableSkeleton } from "@/components/common/loading-skeleton";
import { ErrorState } from "@/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/utils/format";

const adminUserColumns: ColumnDef<AdminUserActivity>[] = [
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
      <span className="capitalize">{row.original.role}</span>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge active={row.original.is_active} />
    ),
  },
  {
    accessorKey: "total_runs",
    header: ({ column }) => <SortableHeader column={column}>Runs</SortableHeader>,
  },
  {
    accessorKey: "files_processed",
    header: ({ column }) => (
      <SortableHeader column={column}>Files</SortableHeader>
    ),
  },
  {
    accessorKey: "excel_downloads",
    header: ({ column }) => (
      <SortableHeader column={column}>Excel</SortableHeader>
    ),
  },
  {
    accessorKey: "last_run_at",
    header: "Last Run",
    cell: ({ row }) =>
      row.original.last_run_at ? formatDate(row.original.last_run_at) : "—",
  },
];

export default function DashboardPage() {
  const { isAdmin } = useAuth();

  const userQuery = useQuery({
    queryKey: ["dashboard-user"],
    queryFn: dashboardService.getUserStats,
    enabled: !isAdmin,
  });

  const adminQuery = useQuery({
    queryKey: ["dashboard-admin"],
    queryFn: dashboardService.getAdminStats,
    enabled: isAdmin,
  });

  const query = isAdmin ? adminQuery : userQuery;

  if (query.isLoading) return <PageSkeleton />;

  if (query.isError) {
    return (
      <ErrorState
        description={extractErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (isAdmin && adminQuery.data) {
    const stats = adminQuery.data;
    return (
      <div className="space-y-6">
        <PageHeader
          title="Admin Dashboard"
          description="System-wide extraction activity and user breakdown."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <MetricCard title="Total Users" value={stats.total_users} icon={Users} />
          <MetricCard title="Active Users" value={stats.active_users} icon={UserCheck} />
          <MetricCard title="Total Runs" value={stats.total_runs} icon={Layers} />
          <MetricCard title="Files Processed" value={stats.files_processed} icon={FileText} />
          <MetricCard title="Successful Runs" value={stats.successful_runs} icon={CheckCircle} />
          <MetricCard title="Unsuccessful Runs" value={stats.unsuccessful_runs} icon={XCircle} />
          <MetricCard title="Excel Downloads" value={stats.excel_runs} icon={Download} />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Per-user activity</CardTitle>
          </CardHeader>
          <CardContent>
            {adminQuery.isLoading ? (
              <TableSkeleton />
            ) : (
              <DataTable columns={adminUserColumns} data={stats.users} pageSize={10} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = userQuery.data!;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your document extraction activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MetricCard title="Total Runs" value={stats.total_runs} icon={Layers} />
        <MetricCard title="Files Processed" value={stats.files_processed} icon={FileText} />
        <MetricCard title="Files OK" value={stats.files_ok} icon={CheckCircle} />
        <MetricCard title="Files Failed" value={stats.files_failed} icon={XCircle} />
        <MetricCard title="Successful Runs" value={stats.successful_runs} icon={CheckCircle} />
        <MetricCard title="Unsuccessful Runs" value={stats.unsuccessful_runs} icon={XCircle} />
        <MetricCard title="Excel Downloads" value={stats.excel_downloads} icon={Download} />
        <MetricCard
          title="Last Run"
          value={stats.last_run ? formatDate(stats.last_run) : "—"}
          icon={Clock}
        />
      </div>
    </div>
  );
}

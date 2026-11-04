"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { AdminSideMenu, type AdminSection } from "@/components/dashboard/AdminSideMenu";
import { ApplicationsSection } from "@/components/dashboard/admin/ApplicationsSection";
import { BookingsSection } from "@/components/dashboard/admin/BookingsSection";
import { CustomersSection } from "@/components/dashboard/admin/CustomersSection";
import { OverviewSection } from "@/components/dashboard/admin/OverviewSection";
import { useRequireRole } from "@/lib/useRequireRole";

function isAdminSection(value: string | null): value is AdminSection {
  return value === "overview" || value === "applications" || value === "customers" || value === "bookings";
}

/** `useSearchParams` needs a Suspense boundary — see AGENTS.md. */
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminContent />
    </Suspense>
  );
}

function AdminContent() {
  const { loading } = useRequireRole("admin");
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get("section");
  const section: AdminSection = isAdminSection(sectionParam) ? sectionParam : "overview";

  if (loading) return <DashboardLoading />;

  return (
    <DashboardShell sidebar={<AdminSideMenu activeSection={section} />}>
      {section === "overview" ? <OverviewSection /> : null}
      {section === "applications" ? <ApplicationsSection /> : null}
      {section === "customers" ? <CustomersSection /> : null}
      {section === "bookings" ? <BookingsSection /> : null}
    </DashboardShell>
  );
}

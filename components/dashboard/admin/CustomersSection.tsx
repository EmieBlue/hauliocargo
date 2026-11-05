"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/dashboard/BackButton";
import { Panel, Row, SectionLabel } from "@/components/dashboard/admin/ApplicationsSection";
import { BOOKING_STATUS_COPY } from "@/components/dashboard/admin/BookingsSection";
import { Badge } from "@/components/ui/Badge";
import { fetchCustomer, fetchCustomers, type CustomerDetail, type CustomerRow } from "@/lib/admin";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/site";

type Selected = { id: string; data: CustomerDetail | null };

/** Every customer account — name, phone, location, join date — with a
 * detail view showing their full profile and booking history. View-only:
 * nothing here is editable this round, and no password is ever exposed
 * (Supabase never returns it over the API in the first place). */
export function CustomersSection() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id");

  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCustomers().then((result) => {
      if (!cancelled && result.ok) setCustomers(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    fetchCustomer(customerId).then((result) => {
      if (cancelled) return;
      setSelected({ id: customerId, data: result.ok ? result.data : null });
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const current = customerId && selected && selected.id === customerId ? selected : null;
  const detailOpen = Boolean(customerId);

  return (
    <div className={cn("flex w-full flex-col gap-5", !detailOpen && "max-w-3xl")}>
      {detailOpen ? <BackButton /> : null}

      {!detailOpen ? (
        <>
          <Panel>
            <h1 className="text-[1.5rem] font-extrabold tracking-[-0.02em] text-fg">Customers</h1>
            <p className="mt-1.5 text-[0.88rem] text-muted">Every registered customer account.</p>
          </Panel>

          <Panel>
            {customers === null ? (
              <p className="text-[0.85rem] text-muted">Loading…</p>
            ) : customers.length === 0 ? (
              <p className="text-[0.85rem] text-muted">Nothing here.</p>
            ) : (
              <div className="divide-y divide-edge/10">
                {customers.map((customer) => (
                  <CustomerRowItem key={customer.id} customer={customer} />
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : current?.data ? (
        <DetailPanel detail={current.data} />
      ) : (
        <Panel>
          <p className="text-[0.85rem] text-muted">{current ? "Customer not found." : "Loading…"}</p>
        </Panel>
      )}
    </div>
  );
}

function CustomerRowItem({ customer }: { customer: CustomerRow }) {
  return (
    <a
      href={`${ROUTES.dashboardAdmin}?section=customers&id=${customer.id}`}
      className="-mx-5 flex items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-200 first:pt-0 hover:bg-edge/[0.03]"
    >
      <div className="min-w-0">
        <p className="truncate text-[0.9rem] font-semibold text-fg">
          {customer.first_name} {customer.last_name}
        </p>
        <p className="mt-0.5 truncate text-[0.8rem] text-muted">{customer.phone}</p>
      </div>
      <p className="shrink-0 text-[0.78rem] text-muted">
        {customer.city || customer.area ? [customer.city, customer.area].filter(Boolean).join(", ") : "—"}
      </p>
    </a>
  );
}

function DetailPanel({ detail }: { detail: CustomerDetail }) {
  const { profile, bookings } = detail;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 lg:w-2/3">
      <Panel>
        <h1 className="text-[1.4rem] font-extrabold tracking-[-0.02em] text-fg">
          {profile.first_name} {profile.last_name}
        </h1>
        <p className="mt-1 text-[0.85rem] text-muted">
          Joined {new Date(profile.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
        </p>
      </Panel>

      <Panel>
        <SectionLabel>Contact</SectionLabel>
        <dl className="mt-3 grid gap-3.5 sm:grid-cols-2">
          <Row label="Phone" value={profile.phone} />
          <Row label="City" value={profile.city ?? "Not provided"} />
          <Row label="Area" value={profile.area ?? "Not provided"} />
        </dl>
      </Panel>

      <Panel>
        <SectionLabel>Booking History</SectionLabel>
        {bookings.length === 0 ? (
          <p className="mt-3 text-[0.85rem] text-muted">No bookings yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-edge/10">
            {bookings.map((booking) => {
              const copy = BOOKING_STATUS_COPY[booking.status];
              const Icon = copy.icon;
              return (
                <div key={booking.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate text-[0.85rem] font-medium text-fg">
                      {booking.pickup_location} → {booking.dropoff_location}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-muted">
                      {new Date(booking.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                      {booking.estimated_price != null ? ` · ${formatPrice(booking.estimated_price)}` : ""}
                    </p>
                  </div>
                  <Badge pulse={booking.status === "pending"} className="shrink-0">
                    <Icon className="size-3" aria-hidden />
                    {copy.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

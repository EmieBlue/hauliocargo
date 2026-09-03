"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionProfile, redirectPathFor, type Role, type SessionProfile } from "./auth";
import { ROUTES } from "./site";

/**
 * Gates a placeholder dashboard to one role, client-side.
 *
 * This is the client-side gate the plan flagged as a deliberate, temporary
 * trade-off: real for a placeholder page with nothing sensitive behind it,
 * not a substitute for server-enforced protection once real dashboards
 * exist. A signed-out visitor goes to sign-in; a signed-in visitor whose
 * role doesn't match this page is sent to the one that does — a customer
 * cannot land on `/dashboard/driver` by typing the URL, even though nothing
 * here is a server-side guarantee yet.
 */
export function useRequireRole(role: Role): {
  loading: boolean;
  profile: SessionProfile | null;
} {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SessionProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSessionProfile().then((result) => {
      if (cancelled) return;

      if (!result) {
        router.replace(ROUTES.signin);
        return;
      }
      if (result.role !== role) {
        router.replace(redirectPathFor(result));
        return;
      }
      setProfile(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [role, router]);

  return { loading, profile };
}

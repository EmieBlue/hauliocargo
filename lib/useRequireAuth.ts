"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSessionProfile, type SessionProfile } from "./auth";
import { ROUTES } from "./site";

/**
 * Role-agnostic sibling of `useRequireRole` — gates a page to "signed in as
 * anyone" rather than one specific role. For destinations any authenticated
 * user should reach from their own dashboard (profile, bookings), where
 * redirecting a driver or admin away because they aren't a "customer" would
 * be wrong.
 */
export function useRequireAuth(): {
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
      setProfile(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { loading, profile };
}

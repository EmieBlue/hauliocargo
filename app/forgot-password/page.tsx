"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { TextField } from "@/components/auth/TextField";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/lib/auth";
import { ROUTES } from "@/lib/site";
import { isValidEmail } from "@/lib/validation";

/**
 * Step 1 only — requesting the code. Steps 2 (enter code) and 3 (new
 * password) are the same screens a new-signup verification uses, just with
 * `purpose=recovery`: one OTP experience, not two built in parallel.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (!isValidEmail(identifier)) {
      setError("Please sign in with your email address for now.");
      return;
    }

    setSubmitting(true);
    const result = await requestPasswordReset(identifier);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`${ROUTES.verify}?email=${encodeURIComponent(identifier)}&purpose=recovery`);
  }

  return (
    <AuthShell
      eyebrow="Forgot Password"
      title="Forgot your password?"
      subtitle="Enter the email address associated with your account and we'll help you reset your password."
      backHref={ROUTES.signin}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField
          label="Email or Phone Number"
          placeholder="Enter your email or phone number"
          autoComplete="username"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />

        {error ? (
          <p role="alert" className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

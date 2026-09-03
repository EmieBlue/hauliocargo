"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { OtpInput } from "@/components/auth/OtpInput";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/Button";
import { resendOtp, updatePassword, verifyOtp, type OtpPurpose } from "@/lib/auth";
import { ROUTES } from "@/lib/site";
import { passwordMeetsRequirements } from "@/lib/validation";

const RESEND_COOLDOWN = 30;

/** `useSearchParams` needs a Suspense boundary — see AGENTS.md, verified against this Next version's docs. */
export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}

type Stage = "code" | "driver-submitted" | "new-password" | "password-updated";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const purpose = (searchParams.get("purpose") as OtpPurpose | null) ?? "signup";
  const role = searchParams.get("role");

  const [stage, setStage] = useState<Stage>("code");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleVerify() {
    if (submitting || code.length < 6) return;
    setSubmitting(true);
    setError(null);

    const result = await verifyOtp(email, code, purpose);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (purpose === "recovery") {
      setStage("new-password");
      return;
    }
    if (role === "driver") {
      setStage("driver-submitted");
      return;
    }
    router.push(ROUTES.dashboardCustomer);
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    const result = await resendOtp(email, purpose);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setCooldown(RESEND_COOLDOWN);
  }

  async function handleNewPassword() {
    if (submitting) return;
    setError(null);

    if (!passwordMeetsRequirements(newPassword)) {
      setError("Password must meet all the requirements listed below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(newPassword);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setStage("password-updated");
  }

  if (stage === "driver-submitted") {
    return (
      <AuthShell title="Application Submitted">
        <ConfirmationPanel
          message="Thank you for registering with HaulioCargo. Your driver application is being reviewed. We'll notify you when verification is complete."
          ctaLabel="Go to Dashboard"
          onCta={() => router.push(ROUTES.dashboardDriver)}
        />
      </AuthShell>
    );
  }

  if (stage === "password-updated") {
    return (
      <AuthShell title="Password Updated">
        <ConfirmationPanel
          message="Your password has been successfully changed."
          ctaLabel="Sign In"
          onCta={() => router.push(ROUTES.signin)}
        />
      </AuthShell>
    );
  }

  if (stage === "new-password") {
    return (
      <AuthShell
        eyebrow="Reset Password"
        title="Create a New Password"
        subtitle="Choose a strong password you haven't used before."
        backHref={ROUTES.signin}
      >
        <div className="flex flex-col gap-5">
          <PasswordField
            label="New Password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordRequirements value={newPassword} />
          <PasswordField
            label="Confirm New Password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error ? <ErrorBanner message={error} /> : null}

          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={submitting}
            onClick={handleNewPassword}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Saving
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Verification"
      title="Verify Your Account"
      subtitle={
        email
          ? `We've sent a verification code to ${email}.`
          : "We've sent a verification code to your email."
      }
      backHref={ROUTES.signin}
    >
      <div className="flex flex-col gap-6">
        <OtpInput value={code} onChange={setCode} error={error ?? undefined} disabled={submitting} />

        <Button
          type="button"
          variant="primary"
          className="w-full"
          disabled={submitting || code.length < 6}
          onClick={handleVerify}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Verifying
            </>
          ) : (
            "Verify"
          )}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="self-center text-[0.85rem] font-medium text-muted transition-colors duration-200 hover:text-brand disabled:cursor-not-allowed disabled:hover:text-muted"
        >
          {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Code"}
        </button>
      </div>
    </AuthShell>
  );
}

function ConfirmationPanel({
  message,
  ctaLabel,
  onCta,
}: {
  message: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[0.95rem] leading-relaxed text-muted">{message}</p>
      <Button type="button" variant="primary" className="w-full" onClick={onCta}>
        {ctaLabel}
      </Button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand">
      {message}
    </p>
  );
}

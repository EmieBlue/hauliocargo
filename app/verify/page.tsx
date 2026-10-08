"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FileUploadField } from "@/components/auth/FileUploadField";
import { OtpInput, OTP_LENGTH } from "@/components/auth/OtpInput";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/Button";
import {
  completeCustomerProfile,
  completeDriverProfile,
  PENDING_CUSTOMER_PROFILE_KEY,
  PENDING_DRIVER_PROFILE_KEY,
  resendOtp,
  updatePassword,
  uploadDriverDocument,
  verifyOtp,
  type OtpPurpose,
} from "@/lib/auth";
import { ROUTES } from "@/lib/site";
import { passwordMeetsRequirements } from "@/lib/validation";

const RESEND_COOLDOWN = 30;

type DocumentKind = "license" | "vehicle-registration" | "insurance" | "vehicle-photo";

/** `useSearchParams` needs a Suspense boundary — see AGENTS.md, verified against this Next version's docs. */
export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}

type Stage = "code" | "driver-documents" | "driver-submitted" | "new-password" | "password-updated" | "profile-error";

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

  // Driver-only: the newly-created user's id (needed to upload documents to
  // their own prefix) and the documents themselves, picked on the
  // driver-documents stage below since there's no session to upload with
  // any earlier than this.
  const [userId, setUserId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Partial<Record<DocumentKind, File>>>({});
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleVerify() {
    if (submitting || code.length < OTP_LENGTH) return;
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
      await finishDriverSignup();
      return;
    }
    await finishCustomerSignup();
  }

  /**
   * `profiles` can only be created now — verification just granted the
   * session `completeCustomerProfile`'s insert policy requires. Reads the
   * fields `CustomerRegisterForm` stashed before redirecting here, since
   * they couldn't be written at registration time. Also the retry target
   * from the `profile-error` stage, so a transient failure isn't a dead end.
   */
  async function finishCustomerSignup() {
    const raw = sessionStorage.getItem(PENDING_CUSTOMER_PROFILE_KEY);
    if (!raw) {
      // Nothing to complete (e.g. a stale reload) — best effort, fall back
      // to the pre-fix behavior rather than stranding the visitor here.
      router.push(ROUTES.dashboardCustomer);
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await completeCustomerProfile(JSON.parse(raw));
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      setStage("profile-error");
      return;
    }

    sessionStorage.removeItem(PENDING_CUSTOMER_PROFILE_KEY);
    router.push(ROUTES.dashboardCustomer);
  }

  /**
   * Same reasoning as `finishCustomerSignup`, for the driver path: the
   * `profiles`/`driver_applications` writes `DriverRegisterForm` couldn't
   * make can only happen now that verification has granted a session. Moves
   * on to the driver-documents stage rather than the confirmation screen
   * directly — uploads need a session too, so they couldn't happen any
   * earlier either.
   */
  async function finishDriverSignup() {
    const raw = sessionStorage.getItem(PENDING_DRIVER_PROFILE_KEY);
    if (!raw) {
      router.push(ROUTES.dashboardDriver);
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await completeDriverProfile(JSON.parse(raw));
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      setStage("profile-error");
      return;
    }

    sessionStorage.removeItem(PENDING_DRIVER_PROFILE_KEY);
    setUserId(result.data.userId);
    setStage("driver-documents");
  }

  function setDocument(kind: DocumentKind, file: File | null) {
    setDocuments((prev) => ({ ...prev, [kind]: file ?? undefined }));
  }

  async function handleDocumentsSubmit() {
    if (docSubmitting || !userId) return;
    setDocError(null);

    if (!documents.license) {
      setDocError("Please upload a photo of your driver's licence.");
      return;
    }
    if (!documents["vehicle-registration"]) {
      setDocError("Please upload your vehicle registration document.");
      return;
    }

    setDocSubmitting(true);
    // An upload failing here shouldn't strand the applicant believing
    // nothing happened — the account and application already exist.
    let warning = false;
    for (const [kind, file] of Object.entries(documents) as [DocumentKind, File][]) {
      const uploadResult = await uploadDriverDocument(userId, kind, file);
      if (!uploadResult.ok) warning = true;
    }
    setDocSubmitting(false);
    setUploadWarning(warning);
    setStage("driver-submitted");
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

  if (stage === "profile-error") {
    return (
      <AuthShell eyebrow="Verification" title="Almost There" backHref={ROUTES.signin}>
        <div className="flex flex-col gap-6">
          <p className="text-[0.95rem] leading-relaxed text-muted">
            Your code was verified, but we couldn&rsquo;t finish setting up your account.
          </p>
          {error ? <ErrorBanner message={error} /> : null}
          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={submitting}
            onClick={role === "driver" ? finishDriverSignup : finishCustomerSignup}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Trying Again
              </>
            ) : (
              "Try Again"
            )}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (stage === "driver-documents") {
    return (
      <AuthShell
        eyebrow="Driver Registration"
        title="Upload Your Documents"
        subtitle="Last step before your application goes to review."
      >
        <div className="flex flex-col gap-5">
          <FileUploadField label="Driver's Licence" required onFileSelected={(file) => setDocument("license", file)} />
          <FileUploadField
            label="Vehicle Registration Document"
            required
            onFileSelected={(file) => setDocument("vehicle-registration", file)}
          />
          <FileUploadField
            label="Insurance Documentation"
            onFileSelected={(file) => setDocument("insurance", file)}
          />
          <FileUploadField
            label="Vehicle Photos"
            onFileSelected={(file) => setDocument("vehicle-photo", file)}
          />

          {docError ? <ErrorBanner message={docError} /> : null}

          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={docSubmitting}
            onClick={handleDocumentsSubmit}
          >
            {docSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Uploading
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (stage === "driver-submitted") {
    return (
      <AuthShell title="Application Submitted">
        <ConfirmationPanel
          message={
            uploadWarning
              ? "Thank you for registering with HaulioCargo. Your application is being reviewed, but one or more documents didn't upload — please contact support so we can get them another way."
              : "Thank you for registering with HaulioCargo. Your driver application is being reviewed. We'll notify you when verification is complete."
          }
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
          disabled={submitting || code.length < OTP_LENGTH}
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

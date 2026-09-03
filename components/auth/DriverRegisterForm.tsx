"use client";

import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Checkbox } from "@/components/auth/Checkbox";
import { FileUploadField } from "@/components/auth/FileUploadField";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { TextField } from "@/components/auth/TextField";
import { Button } from "@/components/ui/Button";
import { signUpDriver, uploadDriverDocument } from "@/lib/auth";
import { ROUTES } from "@/lib/site";
import { isValidEmail, passwordMeetsRequirements } from "@/lib/validation";

type Fields = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleRegistrationNo: string;
  vehicleCapacity: string;
};

const EMPTY: Fields = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  password: "",
  confirmPassword: "",
  licenseNumber: "",
  vehicleType: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleRegistrationNo: "",
  vehicleCapacity: "",
};

type DocumentKind = "license" | "vehicle-registration" | "insurance" | "vehicle-photo";

export function DriverRegisterForm({
  onSubmitted,
}: {
  onSubmitted: (email: string, uploadWarning: boolean) => void;
}) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [documents, setDocuments] = useState<Partial<Record<DocumentKind, File>>>({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);

    if (!isValidEmail(fields.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!passwordMeetsRequirements(fields.password)) {
      setError("Password must meet all the requirements listed below.");
      return;
    }
    if (fields.password !== fields.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!documents.license) {
      setError("Please upload a photo of your driver's licence.");
      return;
    }
    if (!documents["vehicle-registration"]) {
      setError("Please upload your vehicle registration document.");
      return;
    }

    setSubmitting(true);
    const result = await signUpDriver(fields);

    if (!result.ok) {
      setSubmitting(false);
      setError(result.message);
      return;
    }

    // The account and application already exist at this point — an upload
    // failure here is not the same kind of failure as the checks above, and
    // shouldn't strand the applicant believing nothing happened.
    const { userId } = result.data;
    let uploadWarning = false;
    for (const [kind, file] of Object.entries(documents) as [DocumentKind, File][]) {
      const uploadResult = await uploadDriverDocument(userId, kind, file);
      if (!uploadResult.ok) uploadWarning = true;
    }

    setSubmitting(false);
    onSubmitted(fields.email, uploadWarning);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <FormSection title="Personal Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First Name"
            required
            autoComplete="given-name"
            value={fields.firstName}
            onChange={(e) => set("firstName", e.target.value)}
          />
          <TextField
            label="Last Name"
            required
            autoComplete="family-name"
            value={fields.lastName}
            onChange={(e) => set("lastName", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Phone Number"
            type="tel"
            required
            autoComplete="tel"
            value={fields.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <TextField
            label="Date of Birth"
            type="date"
            autoComplete="bday"
            hint="Where required for verification"
            value={fields.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
          />
        </div>
        <TextField
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          value={fields.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </FormSection>

      <FormSection title="Account Security">
        <PasswordField
          label="Password"
          required
          autoComplete="new-password"
          value={fields.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <PasswordRequirements value={fields.password} />
        <PasswordField
          label="Confirm Password"
          required
          autoComplete="new-password"
          value={fields.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
        />
      </FormSection>

      <FormSection title="Driver Information">
        <TextField
          label="Driver's Licence Number"
          required
          value={fields.licenseNumber}
          onChange={(e) => set("licenseNumber", e.target.value)}
        />
        <FileUploadField
          label="Driver's Licence"
          required
          onFileSelected={(file) =>
            setDocuments((prev) => ({ ...prev, license: file ?? undefined }))
          }
        />
      </FormSection>

      <FormSection title="Vehicle Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Vehicle Type"
            required
            placeholder="e.g. Pickup, Small Truck"
            value={fields.vehicleType}
            onChange={(e) => set("vehicleType", e.target.value)}
          />
          <TextField
            label="Vehicle Make"
            required
            value={fields.vehicleMake}
            onChange={(e) => set("vehicleMake", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Vehicle Model"
            required
            value={fields.vehicleModel}
            onChange={(e) => set("vehicleModel", e.target.value)}
          />
          <TextField
            label="Vehicle Year"
            type="number"
            required
            inputMode="numeric"
            value={fields.vehicleYear}
            onChange={(e) => set("vehicleYear", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Vehicle Registration Number"
            required
            value={fields.vehicleRegistrationNo}
            onChange={(e) => set("vehicleRegistrationNo", e.target.value)}
          />
          <TextField
            label="Vehicle Capacity"
            required
            placeholder="e.g. 1.5 tonnes"
            value={fields.vehicleCapacity}
            onChange={(e) => set("vehicleCapacity", e.target.value)}
          />
        </div>
        <FileUploadField
          label="Vehicle Photos"
          onFileSelected={(file) =>
            setDocuments((prev) => ({ ...prev, "vehicle-photo": file ?? undefined }))
          }
        />
      </FormSection>

      <FormSection title="Verification Documents">
        <FileUploadField
          label="Vehicle Registration Document"
          required
          onFileSelected={(file) =>
            setDocuments((prev) => ({ ...prev, "vehicle-registration": file ?? undefined }))
          }
        />
        <FileUploadField
          label="Insurance Documentation"
          onFileSelected={(file) =>
            setDocuments((prev) => ({ ...prev, insurance: file ?? undefined }))
          }
        />
      </FormSection>

      <Checkbox checked={agreed} onChange={setAgreed} required>
        I agree to the{" "}
        <a href={ROUTES.terms} className="text-brand hover:underline">
          Driver Terms &amp; Conditions
        </a>{" "}
        and{" "}
        <a href={ROUTES.privacy} className="text-brand hover:underline">
          Privacy Policy
        </a>
      </Checkbox>

      {error ? (
        <p role="alert" className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" className="w-full" disabled={submitting || !agreed}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Submitting
          </>
        ) : (
          "Submit for Verification"
        )}
      </Button>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-[0.78rem] font-bold tracking-[0.1em] text-brand uppercase">
        {title}
      </h2>
      {children}
    </div>
  );
}

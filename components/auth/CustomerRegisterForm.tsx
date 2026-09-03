"use client";

import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Checkbox } from "@/components/auth/Checkbox";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { TextField } from "@/components/auth/TextField";
import { Button } from "@/components/ui/Button";
import { signUpCustomer } from "@/lib/auth";
import { ROUTES } from "@/lib/site";
import { isValidEmail, passwordMeetsRequirements } from "@/lib/validation";

type Fields = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  city: string;
  area: string;
};

const EMPTY: Fields = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  city: "",
  area: "",
};

export function CustomerRegisterForm({ onSubmitted }: { onSubmitted: (email: string) => void }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
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

    setSubmitting(true);
    const result = await signUpCustomer(fields);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSubmitted(fields.email);
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
        <TextField
          label="Phone Number"
          type="tel"
          required
          autoComplete="tel"
          value={fields.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
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

      <FormSection title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="City"
            required
            autoComplete="address-level2"
            value={fields.city}
            onChange={(e) => set("city", e.target.value)}
          />
          <TextField
            label="Area / Location"
            required
            value={fields.area}
            onChange={(e) => set("area", e.target.value)}
          />
        </div>
      </FormSection>

      <Checkbox checked={agreed} onChange={setAgreed} required>
        I agree to the{" "}
        <a href={ROUTES.terms} className="text-brand hover:underline">
          Terms &amp; Conditions
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
            Creating Account
          </>
        ) : (
          "Create Customer Account"
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

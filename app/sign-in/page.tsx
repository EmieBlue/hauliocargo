"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { TextField } from "@/components/auth/TextField";
import { Button } from "@/components/ui/Button";
import { getSessionProfile, redirectPathFor, signIn } from "@/lib/auth";
import { riseIn } from "@/lib/motion";
import { ROUTES } from "@/lib/site";

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    const result = await signIn(identifier, password);
    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
      return;
    }

    const profile = await getSessionProfile();
    router.push(profile ? redirectPathFor(profile) : ROUTES.dashboardCustomer);
  }

  return (
    <AuthShell
      eyebrow="Sign In"
      title="Welcome Back"
      subtitle="Move what matters. Pick up where you left off."
      backHref={ROUTES.home}
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

        <div className="flex flex-col gap-2">
          <PasswordField
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <a
            href={ROUTES.forgotPassword}
            className="self-end text-[0.82rem] font-medium text-muted transition-colors duration-200 hover:text-brand"
          >
            Forgot Password?
          </a>
        </div>

        {error ? (
          <motion.p
            variants={riseIn}
            initial="hidden"
            animate="show"
            role="alert"
            className="rounded-xl border border-brand/25 bg-brand/[0.06] px-4 py-3 text-[0.85rem] text-brand"
          >
            {error}
          </motion.p>
        ) : null}

        <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Signing In
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-[0.88rem] text-muted">
        Don&rsquo;t have a HaulioCargo account?{" "}
        <a href={ROUTES.register} className="font-semibold text-brand hover:underline">
          Create an account
        </a>
      </p>
    </AuthShell>
  );
}

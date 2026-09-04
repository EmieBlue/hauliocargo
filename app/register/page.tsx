"use client";

import { motion } from "framer-motion";
import { Truck, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { CustomerRegisterForm } from "@/components/auth/CustomerRegisterForm";
import { DriverRegisterForm } from "@/components/auth/DriverRegisterForm";
import { RoleCard } from "@/components/auth/RoleCard";
import { riseIn, staggerParent } from "@/lib/motion";
import { ROUTES } from "@/lib/site";

type Role = "customer" | "driver";

const COPY: Record<Role, { eyebrow: string; title: string; subtitle: string }> = {
  customer: {
    eyebrow: "Register",
    title: "Join HaulioCargo",
    subtitle: "Move smarter. Book with confidence.",
  },
  driver: {
    eyebrow: "Driver Registration",
    title: "Become a HaulioCargo Driver",
    subtitle: "Turn your vehicle into an opportunity.",
  },
};

/** `useSearchParams` needs a Suspense boundary — see AGENTS.md, verified against this Next version's docs. */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role lives in the URL, not local state — so "back" and the browser's own
  // Back button are both real navigation rather than a bet on component state
  // surviving whatever the page is doing.
  const roleParam = searchParams.get("role");
  const role: Role | null = roleParam === "customer" || roleParam === "driver" ? roleParam : null;

  function afterCustomerSignup(email: string) {
    router.push(
      `${ROUTES.verify}?email=${encodeURIComponent(email)}&purpose=signup&role=customer`,
    );
  }

  function afterDriverSignup(email: string, uploadWarning: boolean) {
    const warningParam = uploadWarning ? "&uploadWarning=1" : "";
    router.push(
      `${ROUTES.verify}?email=${encodeURIComponent(email)}&purpose=signup&role=driver${warningParam}`,
    );
  }

  const copy = role ? COPY[role] : COPY.customer;

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      title={copy.title}
      subtitle={copy.subtitle}
      backHref={role ? undefined : ROUTES.home}
      wide={role !== null}
    >
      {!role ? (
        <div className="flex flex-col gap-5">
          <p className="font-display text-[0.72rem] font-semibold tracking-[0.1em] text-mist uppercase">
            How will you use HaulioCargo?
          </p>
          <motion.div
            variants={staggerParent(0.1)}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2"
          >
            <motion.div variants={riseIn}>
              <RoleCard
                icon={User}
                title="Customer"
                body="I want to move my cargo"
                selected={false}
                onSelect={() => router.push(`${ROUTES.register}?role=customer`)}
                testId="role-customer"
              />
            </motion.div>
            <motion.div variants={riseIn}>
              <RoleCard
                icon={Truck}
                title="Driver"
                body="I want to provide cargo transportation"
                selected={false}
                onSelect={() => router.push(`${ROUTES.register}?role=driver`)}
                testId="role-driver"
              />
            </motion.div>
          </motion.div>

          <p className="text-center text-[0.88rem] text-muted">
            Already have a HaulioCargo account?{" "}
            <a href={ROUTES.signin} className="font-semibold text-brand hover:underline">
              Sign in
            </a>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <a
            href={ROUTES.register}
            className="self-start text-[0.8rem] font-medium text-muted transition-colors duration-200 hover:text-brand"
          >
            ← Choose a different account type
          </a>

          {role === "customer" ? (
            <CustomerRegisterForm onSubmitted={afterCustomerSignup} />
          ) : (
            <DriverRegisterForm onSubmitted={afterDriverSignup} />
          )}
        </div>
      )}
    </AuthShell>
  );
}

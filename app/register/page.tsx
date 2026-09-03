"use client";

import { motion } from "framer-motion";
import { Truck, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

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
                onSelect={() => setRole("customer")}
                testId="role-customer"
              />
            </motion.div>
            <motion.div variants={riseIn}>
              <RoleCard
                icon={Truck}
                title="Driver"
                body="I want to provide cargo transportation"
                selected={false}
                onSelect={() => setRole("driver")}
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
          <button
            type="button"
            onClick={() => setRole(null)}
            className="self-start text-[0.8rem] font-medium text-muted transition-colors duration-200 hover:text-brand"
          >
            ← Choose a different account type
          </button>

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

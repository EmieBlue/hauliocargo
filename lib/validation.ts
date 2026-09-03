/**
 * Password rules, shared by registration and reset-password.
 *
 * This is the client-side half only — real enforcement is the minimum
 * password policy set in the Supabase dashboard (Auth → Policies), which
 * must be configured to match these same four rules. A checklist the server
 * doesn't also enforce is a UI suggestion, not a requirement.
 */

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "One number", test: (v) => /[0-9]/.test(v) },
];

export function passwordMeetsRequirements(value: string): boolean {
  return PASSWORD_REQUIREMENTS.every((rule) => rule.test(value));
}

export type PasswordStrength = "weak" | "fair" | "strong";

/**
 * Coarse strength read, for the meter only — not a substitute for the
 * requirement checklist, which is what actually gates form submission.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value) return "weak";
  const metCount = PASSWORD_REQUIREMENTS.filter((rule) => rule.test(value)).length;
  const long = value.length >= 12;

  if (metCount === PASSWORD_REQUIREMENTS.length && long) return "strong";
  if (metCount >= 3) return "fair";
  return "weak";
}

/** Loose on purpose: real validation is Supabase rejecting a bad address. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Accepts a range of real-world formats; digits, spaces, +, -, () only. */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  return /^[+0-9][0-9\s-()]{6,}$/.test(trimmed);
}

/** The sign-in field accepts either — this is how it decides which. */
export function isEmailOrPhone(value: string): boolean {
  return isValidEmail(value) || isValidPhone(value);
}

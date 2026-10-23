"use client";

import { CheckCircle2, Clock, Loader2, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DashboardLoading, DashboardShell } from "@/components/auth/DashboardShell";
import { PasswordField } from "@/components/auth/PasswordField";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { TextField } from "@/components/auth/TextField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  redirectPathFor,
  updateAvatarPath,
  updateDriverApplication,
  updateOwnProfile,
  updatePassword,
  uploadAvatar,
  type DriverStatus,
} from "@/lib/auth";
import { getClient } from "@/lib/supabase";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { passwordMeetsRequirements } from "@/lib/validation";

type ProfileRow = {
  first_name: string;
  last_name: string;
  phone: string;
  city: string | null;
  area: string | null;
  avatar_path: string | null;
};

type ApplicationRow = {
  date_of_birth: string | null;
  license_number: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_registration_no: string;
  vehicle_capacity: string;
  vehicle_color: string | null;
  status: DriverStatus;
};

const STATUS_LABEL: Record<DriverStatus, { label: string; icon: typeof Clock }> = {
  pending: { label: "Pending Verification", icon: Clock },
  verified: { label: "Verified", icon: CheckCircle2 },
  rejected: { label: "Application Not Approved", icon: XCircle },
};

/** The same shared page every signed-in account reaches from the account menu (and, for a driver, the sidebar too). */
export default function ProfilePage() {
  const { loading, profile } = useRequireAuth();
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [application, setApplication] = useState<ApplicationRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getClient();
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      setEmail(data.user?.email ?? null);
      setUserId(uid);

      supabase
        .from("profiles")
        .select("first_name, last_name, phone, city, area, avatar_path")
        .eq("id", uid)
        .single()
        .then(({ data: profileRow }) => {
          if (cancelled) return;
          const typed = (profileRow as ProfileRow | null) ?? null;
          setRow(typed);
          if (typed?.avatar_path) {
            supabase.storage
              .from("avatars")
              .createSignedUrl(typed.avatar_path, 3600)
              .then(({ data: signed }) => {
                if (!cancelled && signed?.signedUrl) setAvatarUrl(signed.signedUrl);
              });
          }
        });

      if (profile?.role === "driver") {
        supabase
          .from("driver_applications")
          .select(
            "date_of_birth, license_number, vehicle_type, vehicle_make, vehicle_model, vehicle_year, vehicle_registration_no, vehicle_capacity, vehicle_color, status",
          )
          .eq("profile_id", uid)
          .single()
          .then(({ data: appRow }) => {
            if (!cancelled) setApplication((appRow as ApplicationRow | null) ?? null);
          });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile?.role]);

  async function handleAvatarSelected(file: File | null) {
    if (!file || !userId) return;
    const supabase = getClient();
    if (!supabase) return;

    setAvatarUploading(true);
    setAvatarError(null);
    const uploadResult = await uploadAvatar(userId, file);
    if (!uploadResult.ok) {
      setAvatarUploading(false);
      setAvatarError(uploadResult.message);
      return;
    }
    const pathResult = await updateAvatarPath(uploadResult.data);
    if (!pathResult.ok) {
      setAvatarUploading(false);
      setAvatarError(pathResult.message);
      return;
    }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(uploadResult.data, 3600);
    setAvatarUploading(false);
    if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
  }

  if (loading || !profile) return <DashboardLoading />;

  return (
    <DashboardShell>
      <div className="flex w-full max-w-lg flex-col gap-5">
        <Link
          href={redirectPathFor(profile)}
          className="self-start text-[0.8rem] font-medium text-muted transition-colors duration-200 hover:text-brand"
        >
          ← Back to dashboard
        </Link>

        <div>
          <h1 className="text-[clamp(1.6rem,3.2vw,2rem)] font-extrabold tracking-[-0.02em] text-fg">My Profile</h1>
          {email ? <p className="mt-1.5 text-[0.88rem] text-muted">{email}</p> : null}
        </div>

        <AvatarCard
          avatarUrl={avatarUrl}
          uploading={avatarUploading}
          error={avatarError}
          onPhotoSelected={handleAvatarSelected}
        />

        {row ? <PersonalInfoCard initial={row} isCustomer={profile.role === "customer"} /> : <LoadingCard />}

        {profile.role === "driver" ? (
          application ? (
            <VehicleInfoCard initial={application} />
          ) : (
            <LoadingCard title="Vehicle Information" />
          )
        ) : null}

        <PasswordCard />
      </div>
    </DashboardShell>
  );
}

function AvatarCard({
  avatarUrl,
  uploading,
  error,
  onPhotoSelected,
}: {
  avatarUrl: string | null;
  uploading: boolean;
  error: string | null;
  onPhotoSelected: (file: File | null) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <Card title="Profile Photo">
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full border border-edge/12 bg-ink-900">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a signed storage URL, next/image gains nothing here
            <img src={avatarUrl} alt="Your profile photo" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center">
              <User className="size-8 text-muted" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onPhotoSelected(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="self-start"
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Uploading
              </>
            ) : avatarUrl ? (
              "Replace Photo"
            ) : (
              "Add Photo"
            )}
          </Button>
          {error ? (
            <p role="alert" className="text-[0.78rem] text-brand">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function PersonalInfoCard({ initial, isCustomer }: { initial: ProfileRow; isCustomer: boolean }) {
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [phone, setPhone] = useState(initial.phone);
  const [city, setCity] = useState(initial.city ?? "");
  const [area, setArea] = useState(initial.area ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await updateOwnProfile({
      firstName,
      lastName,
      phone,
      ...(isCustomer ? { city, area } : {}),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSaved(true);
  }

  return (
    <Card title="Personal Information">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <TextField label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {isCustomer ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            <TextField label="Area" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        ) : null}

        <SaveRow saving={saving} saved={saved} error={error} onSave={handleSave} />
      </div>
    </Card>
  );
}

function VehicleInfoCard({ initial }: { initial: ApplicationRow }) {
  const [licenseNumber, setLicenseNumber] = useState(initial.license_number);
  const [vehicleType, setVehicleType] = useState(initial.vehicle_type);
  const [vehicleMake, setVehicleMake] = useState(initial.vehicle_make);
  const [vehicleModel, setVehicleModel] = useState(initial.vehicle_model);
  const [vehicleYear, setVehicleYear] = useState(String(initial.vehicle_year));
  const [vehicleRegistrationNo, setVehicleRegistrationNo] = useState(initial.vehicle_registration_no);
  const [vehicleCapacity, setVehicleCapacity] = useState(initial.vehicle_capacity);
  const [vehicleColor, setVehicleColor] = useState(initial.vehicle_color ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initial.date_of_birth ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusCopy = STATUS_LABEL[initial.status];
  const StatusIcon = statusCopy.icon;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await updateDriverApplication({
      dateOfBirth: dateOfBirth || null,
      licenseNumber,
      vehicleType,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleRegistrationNo,
      vehicleCapacity,
      vehicleColor,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSaved(true);
  }

  return (
    <Card title="Vehicle Information">
      <div className="flex flex-col gap-4">
        {/* Status is shown, never editable here — changing it is an admin
         * action, same reasoning supabase/003_driver_applications.sql's own
         * comment gives, now enforced by a trigger (see migration 019)
         * rather than just the absence of an update policy. */}
        <Badge pulse={initial.status === "pending"} className="self-start">
          <StatusIcon className="size-3" aria-hidden />
          {statusCopy.label}
        </Badge>

        <TextField label="Driver's Licence Number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
        <TextField
          label="Date of Birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Vehicle Type" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
          <TextField label="Vehicle Make" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Vehicle Model" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
          <TextField
            label="Vehicle Year"
            type="number"
            inputMode="numeric"
            value={vehicleYear}
            onChange={(e) => setVehicleYear(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Registration Number"
            value={vehicleRegistrationNo}
            onChange={(e) => setVehicleRegistrationNo(e.target.value)}
          />
          <TextField label="Capacity" value={vehicleCapacity} onChange={(e) => setVehicleCapacity(e.target.value)} />
        </div>
        <TextField label="Vehicle Color" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} />

        <SaveRow saving={saving} saved={saved} error={error} onSave={handleSave} />
      </div>
    </Card>
  );
}

function PasswordCard() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!passwordMeetsRequirements(newPassword)) {
      setError("Password must meet all the requirements listed below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    setSaved(false);
    const result = await updatePassword(newPassword);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setSaved(true);
  }

  return (
    <Card title="Change Password">
      <div className="flex flex-col gap-4">
        <PasswordField label="New Password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <PasswordRequirements value={newPassword} />
        <PasswordField
          label="Confirm New Password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <SaveRow saving={saving} saved={saved} error={error} onSave={handleSave} saveLabel="Update Password" />
      </div>
    </Card>
  );
}

function SaveRow({
  saving,
  saved,
  error,
  onSave,
  saveLabel = "Save Changes",
}: {
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="primary" size="sm" disabled={saving} onClick={onSave}>
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Saving
          </>
        ) : (
          saveLabel
        )}
      </Button>
      {saved ? <span className="text-[0.82rem] text-brand">Saved</span> : null}
      {error ? (
        <span role="alert" className="text-[0.82rem] text-brand">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-edge/12 bg-ink-950 p-5">
      <h2 className="font-display text-[0.68rem] font-semibold tracking-[0.18em] text-mist uppercase">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LoadingCard({ title = "Personal Information" }: { title?: string }) {
  return (
    <Card title={title}>
      <p className="text-[0.85rem] text-muted">Loading…</p>
    </Card>
  );
}

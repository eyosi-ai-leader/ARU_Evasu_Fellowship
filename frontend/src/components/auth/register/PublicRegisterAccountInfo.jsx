"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

import PasswordRequirements from "@/components/shared/Password/PasswordRequirements";

import { SectionCard, TextInput } from "./RegisterFields";

function EyeButton({ shown, onToggle, label }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? `Hide ${label}` : `Show ${label}`}
      className="rounded-full p-1.5 text-body transition hover:bg-primary/10 hover:text-primary"
    >
      {shown ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

export default function PublicRegisterAccountInfo({
  formData,
  errors,
  onChange,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <SectionCard
      icon={Lock}
      title="Password"
      description="Create a secure password for your account."
    >
      <div className="space-y-5">
        <div>
          <TextInput
            label="Password"
            required
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Create a strong password"
            autoComplete="new-password"
            error={errors.password}
            trailing={
              <EyeButton
                shown={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
                label="password"
              />
            }
          />

          <PasswordRequirements
            password={formData.password}
            id="register-password-requirements"
          />
        </div>

        <TextInput
          label="Confirm password"
          required
          type={showConfirm ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onChange}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          trailing={
            <EyeButton
              shown={showConfirm}
              onToggle={() => setShowConfirm((value) => !value)}
              label="confirm password"
            />
          }
        />
      </div>
    </SectionCard>
  );
}
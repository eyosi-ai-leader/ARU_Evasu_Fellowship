"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete = "new-password",
  describedBy,
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block px-1 text-sm font-medium text-ink"
      >
        {label}
      </label>

      <div className="relative">
        <Lock
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-body"
          aria-hidden="true"
        />

        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          required
          className="w-full rounded-full border border-line bg-white py-3.5 pl-11 pr-12 text-sm text-ink outline-none transition placeholder:text-body/60 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />

        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-body transition hover:bg-primary/10 hover:text-primary"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
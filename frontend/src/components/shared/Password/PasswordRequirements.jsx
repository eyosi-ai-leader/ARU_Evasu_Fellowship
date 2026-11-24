import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/passwordPolicy";

export default function PasswordRequirements({
  password = "",
  id = "password-requirements",
}) {
  return (
    <ul
      id={id}
      aria-label="Password requirements"
      className="mt-3 grid gap-1.5 px-1 sm:grid-cols-2"
    >
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);

        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-xs transition-colors ${
              met ? "font-medium text-success" : "text-body"
            }`}
          >
            {met ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Circle size={14} aria-hidden="true" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{met ? " (met)" : " (not met yet)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
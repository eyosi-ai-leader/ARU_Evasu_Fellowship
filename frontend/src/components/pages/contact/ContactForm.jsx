"use client";

import { useState } from "react";

import Button from "@/components/shared/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const MAX_MESSAGE = 2000;

const inputClass =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink placeholder:text-body/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-danger";

function Field({ id, label, required, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true"> *</span>
        ) : (
          <span className="font-normal text-body"> (optional)</span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ContactForm() {
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [length, setLength] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("submitting");
    setErrors({});
    setServerError("");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_URL}/prayer-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        /* non-JSON response */
      }

      if (response.ok && result.success) {
        form.reset();
        setLength(0);
        setStatus("success");
        return;
      }

      if (response.status === 400 && result.errors) {
        setErrors(result.errors);
        setServerError(result.message || "Please correct the highlighted fields.");
      } else if (response.status === 429) {
        setServerError("Too many requests. Please try again later.");
      } else {
        setServerError(
          result.message || "Something went wrong on our side. Please try again shortly."
        );
      }
      setStatus("error");
    } catch (error) {
      setServerError(
        error.name === "AbortError"
          ? "The request took too long. Please try again."
          : "We couldn't reach the server. Check your connection and try again."
      );
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-3xl bg-white p-8 text-center ring-1 ring-line md:p-10"
      >
        <h3 className="font-display text-3xl font-semibold text-ink">
          Thank you
        </h3>
        <p className="mt-3 leading-7 text-body">
          Your prayer request has been received. Our fellowship leaders will pray
          with you.
        </p>

        <figure className="mt-6 border-t border-line pt-5">
          <blockquote className="text-base italic leading-relaxed text-ink">
            “Casting all your care upon him; for he careth for you.”
          </blockquote>
          <figcaption className="mt-2 text-sm font-medium text-primary">
            1 Peter 5:7 (KJV)
          </figcaption>
        </figure>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStatus("idle")}
          className="mt-6"
        >
          Send another request
        </Button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative space-y-5 rounded-3xl bg-white p-6 ring-1 ring-line md:p-8"
    >
      {/* Spam trap: hidden from people, visible to bots */}
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor="contact_extra">Leave this field empty</label>
        <input
          id="contact_extra"
          name="contact_extra"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
        />
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </p>
      )}

      <Field id="name" label="Your name" required error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={100}
          autoComplete="name"
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={inputClass}
        />
      </Field>

      <Field id="email" label="Your email" required error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          maxLength={150}
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={inputClass}
        />
      </Field>

      <Field id="phone" label="Phone" error={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          className={inputClass}
        />
      </Field>

      <Field id="message" label="Your prayer request" required error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={5}
          maxLength={MAX_MESSAGE}
          required
          onChange={(e) => setLength(e.target.value.length)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          className={inputClass}
        />
        <p className="mt-1 text-right text-xs text-body">
          {length} / {MAX_MESSAGE}
        </p>
      </Field>

      <p className="text-xs leading-relaxed text-body">
        Your request is sent to our fellowship leaders and saved so it isn't
        lost. We use your email only to respond to you.
      </p>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full"
      >
        {submitting ? "Sending…" : "Submit prayer request"}
      </Button>
    </form>
  );
}
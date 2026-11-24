"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Lock,
  MapPin,
  UserRound,
} from "lucide-react";

import AuthBrand from "@/components/shared/Auth/AuthBrand";

import {
  PASSWORD_RULES_MESSAGE,
  isStrongPassword,
} from "@/lib/passwordPolicy";

import { registerUser } from "@/lib/authApi";
import { getFellowships, getDepartments } from "@/lib/fellowshipApi";
import { OTHER_OPTION } from "@/lib/ethiopiaLocations";
import {
  ecDateProblem,
  ecGraduationToGregorian,
  ecValueToIso,
} from "@/lib/ethiopianCalendar";

import { CheckboxCard } from "./RegisterFields";
import PublicRegisterProfileImage from "./PublicRegisterProfileImage";
import PublicRegisterPersonalInfo from "./PublicRegisterPersonalInfo";
import PublicRegisterContactInfo from "./PublicRegisterContactInfo";
import PublicRegisterCampusInfo from "./PublicRegisterCampusInfo";
import PublicRegisterBackgroundInfo from "./PublicRegisterBackgroundInfo";
import PublicRegisterAccountInfo from "./PublicRegisterAccountInfo";
import TermsDialog from "@/components/shared/Terms/TermsDialog";
import { TERMS_VERSION } from "@/lib/fellowshipTerms";

// CHANGE THE LEFT-SIDE PHOTO HERE.
// The file lives in the "public/images" folder of your project.
const SIDE_IMAGE = "/images/events/Family_4.jpg";

const STEP_META = [
  {
    label: "Campus",
    short: "Fellowship & studies",
    icon: Building2,
    title: "Choose your campus fellowship",
    text: "Tell us where you study and when you graduate.",
  },
  {
    label: "About you",
    short: "Name & contact",
    icon: UserRound,
    title: "Tell us about you",
    text: "Your name and how we can reach you.",
  },
  {
    label: "Background",
    short: "Home & faith",
    icon: MapPin,
    title: "A little background",
    text: "Everything here is optional. Share only what you are comfortable with.",
  },
  {
    label: "Account",
    short: "Photo & password",
    icon: Lock,
    title: "Secure your account",
    text: "Add a photo and choose a password.",
  },
];

const LAST_STEP = STEP_META.length - 1;

const MINISTRY_PREFIXES = ["highSchoolMinistry", "churchMinistry"];

const initialFormData = {
  // Campus
  fellowshipId: "",
  departmentId: "",
  academicStatus: "Student",
  entryYear: "",
  studentId: "",
  alumniContactConsent: false,

  // About you
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  email: "",
  phone: "",
  telegramUsername: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",

  // Background: where they are from
  homeRegion: "",
  homeCity: "",
  homeTownOther: "",
  address: "",

  // Background: spiritual
  previousChurch: "",
  baptismDate: "",
  newChristian: "no",
  highSchoolMinistryName: "",
  highSchoolMinistryOther: "",
  highSchoolMinistryRole: "",
  churchMinistryName: "",
  churchMinistryOther: "",
  churchMinistryRole: "",
  spiritualJourney: "",

  // Account
  password: "",
  confirmPassword: "",
};

// Plain text fields that are sent exactly as typed (when not empty).
const TEXT_FIELDS = [
  "fellowshipId",
  "departmentId",
  "academicStatus",
  "studentId",
  "firstName",
  "middleName",
  "lastName",
  "gender",
  "email",
  "phone",
  "telegramUsername",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelation",
  "homeRegion",
  "address",
  "previousChurch",
  "spiritualJourney",
];

export default function RegisterForm() {
  const router = useRouter();
  const scrollRef = useRef(null);

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [profileImage, setProfileImage] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fellowships, setFellowships] = useState([]);
  const [fellowshipsLoading, setFellowshipsLoading] = useState(true);
  const [fellowshipsError, setFellowshipsError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  const meta = STEP_META[step];

  // Phones scroll the page; on desktop the form column scrolls.
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Load the campus list.
   */
  useEffect(() => {
    let active = true;

    setFellowshipsLoading(true);
    setFellowshipsError("");

    getFellowships()
      .then((list) => {
        if (active) setFellowships(list);
      })
      .catch(() => {
        if (active) {
          setFellowshipsError(
            "We couldn't load the campus list. Please check your connection and try again."
          );
        }
      })
      .finally(() => {
        if (active) setFellowshipsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  /**
   * Load the departments of the chosen campus only.
   */
  useEffect(() => {
    if (!formData.fellowshipId) {
      setDepartments([]);
      return;
    }

    let active = true;

    setDepartmentsLoading(true);

    getDepartments(formData.fellowshipId)
      .then((list) => {
        if (active) setDepartments(list);
      })
      .catch(() => {
        if (active) setDepartments([]);
      })
      .finally(() => {
        if (active) setDepartmentsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [formData.fellowshipId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    setFormData((current) => {
      const next = { ...current, [name]: nextValue };

      // A new campus means a new department list.
      if (name === "fellowshipId") next.departmentId = "";

      // Student and graduate have different year lists.
      if (name === "academicStatus") next.entryYear = "";

      // A new region means a new city list.
      if (name === "homeRegion") {
        next.homeCity = "";
        next.homeTownOther = "";
      }

      // Changing a ministry clears its typed name and (if cleared) its role.
      if (name.endsWith("MinistryName")) {
        const base = name.slice(0, -4);

        next[`${base}Other`] = "";

        if (!nextValue) next[`${base}Role`] = "";
      }

      return next;
    });

    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  };

  const validateStep = (stepIndex) => {
    const newErrors = {};

    if (stepIndex === 0) {
      if (!formData.fellowshipId) {
        newErrors.fellowshipId = "Please select your campus fellowship.";
      }

      if (
        formData.academicStatus === "Student" &&
        departments.length > 0 &&
        !formData.departmentId
      ) {
        newErrors.departmentId = "Please select your department.";
      }

      if (!formData.entryYear) {
        newErrors.entryYear = "Please select your entry year.";
      }
    }

    if (stepIndex === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required.";
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required.";
      }

      if (!formData.gender) {
        newErrors.gender = "Please select your gender.";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email.";
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required.";
      } else if (formData.phone.replace(/\D/g, "").length < 9) {
        newErrors.phone = "Please enter a valid phone number.";
      }

      const birthProblem = ecDateProblem(
        formData.dateOfBirth,
        "Date of birth"
      );

      if (birthProblem) newErrors.dateOfBirth = birthProblem;
    }

    if (stepIndex === 2) {
      const baptismProblem = ecDateProblem(
        formData.baptismDate,
        "Baptism date"
      );

      if (baptismProblem) newErrors.baptismDate = baptismProblem;

      if (
        formData.homeCity === OTHER_OPTION &&

        !formData.homeTownOther.trim()
      ) {
        newErrors.homeTownOther = "Please write your city or town.";
      }

      MINISTRY_PREFIXES.forEach((prefix) => {
        const ministry = formData[`${prefix}Name`];

        if (ministry === OTHER_OPTION && !formData[`${prefix}Other`].trim()) {
          newErrors[`${prefix}Other`] = "Please write the ministry name.";
        }

        if (ministry && !formData[`${prefix}Role`]) {
          newErrors[`${prefix}Role`] = "Please choose your role.";
        }
      });
    }

    if (stepIndex === LAST_STEP) {
      if (!isStrongPassword(formData.password)) {
        newErrors.password = PASSWORD_RULES_MESSAGE;
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }

      if (profileImage && profileImage.size > 10 * 1024 * 1024) {
        newErrors.profileImage = "Profile image must not exceed 10MB.";
      } else if (
        profileImage &&
        !["image/jpeg", "image/png", "image/webp"].includes(
          profileImage.type
        )
      ) {
        newErrors.profileImage =
          "Only JPG, PNG and WEBP images are allowed.";
      }

      if (!agreed) {
        newErrors.terms = "Please accept the terms to continue.";
      }
    }

    return newErrors;
  };

  const goNext = () => {
    const stepErrors = validateStep(step);

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      scrollToTop();
      return;
    }

    setErrors({});
    setStep((current) => current + 1);
    scrollToTop();
  };

  const goBack = () => {
    setErrors({});
    setStep((current) => current - 1);
    scrollToTop();
  };

  const goToStep = (index) => {
    if (index >= step || isSubmitting) return;

    setErrors({});
    setStep(index);
    scrollToTop();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Pressing Enter on an earlier step just moves to the next step.
    if (step < LAST_STEP) {
      goNext();
      return;
    }

    setSubmitError("");

    // Check every step again, and jump back to the first one with a problem.
    const allErrors = {};
    let firstBadStep = -1;

    for (let index = 0; index < STEP_META.length; index += 1) {
      const stepErrors = validateStep(index);

      if (Object.keys(stepErrors).length > 0) {
        Object.assign(allErrors, stepErrors);

        if (firstBadStep === -1) firstBadStep = index;
      }
    }

    if (firstBadStep !== -1) {
      setErrors(allErrors);
      setStep(firstBadStep);
      scrollToTop();
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();

      TEXT_FIELDS.forEach((key) => {
        const text = String(formData[key] ?? "").trim();

        if (text) data.append(key, text);
      });

      // Dates are typed in the Ethiopian calendar (E.C.) and sent as
      // Gregorian (G.C.), which is what the database and reports use.
      const birthDate = ecValueToIso(formData.dateOfBirth);

      if (birthDate) data.append("dateOfBirth", birthDate);

      const baptismDate = ecValueToIso(formData.baptismDate);

      if (baptismDate) data.append("baptismDate", baptismDate);

      // Entry year: the E.C. year + 8 is the G.C. year.
      data.append(
        "entryYear",
        String((formData.entryYear))
      );

      // City or town: the chosen one, or the one they typed.
      const homeTown =
        formData.homeCity === OTHER_OPTION
          ? formData.homeTownOther.trim()
          : formData.homeCity;

      if (homeTown) data.append("homeTown", homeTown);

      // Ministries: the chosen one, or the one they typed.
      const ministryValue = (prefix) =>
        formData[`${prefix}Name`] === OTHER_OPTION
          ? formData[`${prefix}Other`].trim()
          : formData[`${prefix}Name`];

      const highSchoolMinistry = ministryValue("highSchoolMinistry");
      const churchMinistry = ministryValue("churchMinistry");

      if (highSchoolMinistry) {
        data.append("highSchoolMinistry", highSchoolMinistry);
        data.append(
          "highSchoolMinistryRole",
          formData.highSchoolMinistryRole
        );
      }

      if (churchMinistry) {
        data.append("churchMinistry", churchMinistry);
        data.append("churchMinistryRole", formData.churchMinistryRole);
      }

      data.append("newChristian", String(formData.newChristian === "yes"));
      data.append(
        "alumniContactConsent",
        String(formData.alumniContactConsent)
      );

      data.append("termsAccepted", "true");
      data.append("termsVersion", TERMS_VERSION);

      data.append("password", formData.password);
      data.append("confirmPassword", formData.confirmPassword);

      if (profileImage) {
        data.append("profileImage", profileImage);
      }

      const result = await registerUser(data);

      const memberNumber =
        result?.data?.memberNumber || result?.memberNumber;

      if (memberNumber) {
        sessionStorage.setItem("registrationMemberNumber", memberNumber);
      }

      // Send the new member to enter the 6-digit code.
      // "sent=1" starts the 60-second resend timer, because the
      // code was only just emailed. If the code email failed,
      // leave it out so they can resend straight away.
      const codeEmailFailed = (result?.message || "")
        .toLowerCase()
        .includes("could not be sent");

      const verifyEmail = formData.email.trim().toLowerCase();

      router.push(
        `/verify-email?email=${encodeURIComponent(verifyEmail)}${
          codeEmailFailed ? "" : "&sent=1"
        }`
      );
    } catch (error) {
      setSubmitError(
        error.message || "Unable to create your account."
      );

      scrollToTop();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /*
     * Desktop: a full-screen layout that does not depend on any wrapper
     * around this page. Left = fixed brand panel, right = scrolling form.
     * Phones: the normal page layout.
     */
    <div className="min-h-screen bg-surface-muted lg:fixed lg:inset-0 lg:z-[100] lg:flex lg:min-h-0">
      {/* Brand panel (desktop only) */}
      <aside className="relative hidden w-[400px] shrink-0 overflow-y-auto bg-primary-dark text-white [scrollbar-width:none] lg:block xl:w-[440px] [&::-webkit-scrollbar]:hidden">
        <div className="relative flex min-h-full flex-col justify-between gap-8 overflow-hidden p-10 xl:p-12">
          {/* LEFT-SIDE PHOTO (change the file name at the top of this file) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${SIDE_IMAGE})` }}
          />
          {/* Maroon layer so the white text is easy to read.
              Make the numbers smaller (for example /70) to show more photo. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary-dark/85 via-primary-dark/75 to-primary-dark/95"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse at top, black 30%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at top, black 30%, transparent 75%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-ember/20 blur-3xl"
          />

          <div className="relative">
            <AuthBrand light showHome />
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              <span className="h-0.5 w-5 rounded-full bg-accent" />
              Join us
            </span>

            <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
              Your campus family, all in one place.
            </h2>

            <p className="mt-4 text-sm leading-6 text-white/70">
              Join the Arsi University Evasu Fellowship and stay connected
              with announcements, your ministries and your community.
            </p>

            <ol className="mt-8">
              {STEP_META.map((item, index) => {
                const Icon = item.icon;
                const done = index < step;
                const current = index === step;

                return (
                  <li key={item.label} className="relative">
                    {index < STEP_META.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[31px] top-[52px] h-6 w-px ${
                          done ? "bg-accent/60" : "bg-white/10"
                        }`}
                      />
                    )}

                    <button
                      type="button"
                      disabled={!done || isSubmitting}
                      onClick={() => goToStep(index)}
                      aria-current={current ? "step" : undefined}
                      className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition ${
                        current
                          ? "bg-white/10 ring-1 ring-white/10"
                          : done
                            ? "hover:bg-white/5"
                            : "opacity-60"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          done
                            ? "bg-accent text-ink"
                            : current
                              ? "bg-white text-primary"
                              : "bg-white/10 text-white/70"
                        }`}
                      >
                        {done ? (
                          <Check size={18} aria-hidden="true" />
                        ) : (
                          <Icon size={18} aria-hidden="true" />
                        )}
                      </span>

                      <span>
                        <span className="block text-sm font-semibold">
                          {item.label}
                        </span>

                        <span className="block text-xs text-white/60">
                          {item.short}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Hidden on short screens so the panel never needs a scrollbar */}
          <figure className="relative border-l-2 border-accent/60 pl-5 [@media(max-height:780px)]:hidden">
            <blockquote className="text-sm italic leading-6 text-white/70">
              &ldquo;Behold, how good and how pleasant it is for brethren to
              dwell together in unity!&rdquo;
            </blockquote>

            <figcaption className="mt-2 text-xs font-medium text-white/60">
              Psalm 133:1 (KJV)
            </figcaption>
          </figure>
        </div>
      </aside>

      {/* Form panel (this is the part that scrolls on desktop) */}
      <div
        ref={scrollRef}
        className="flex min-h-screen min-w-0 flex-1 flex-col lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
      >
        {/* Top bar (small screens) */}
        <header className="border-b border-line bg-white/80 px-5 py-4 backdrop-blur-xl lg:hidden">
          <AuthBrand showHome />

          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEP_META.length}
            aria-valuenow={step + 1}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${((step + 1) / STEP_META.length) * 100}%`,
              }}
            />
          </div>
        </header>

        {/* Top bar (desktop) */}
        <div className="hidden shrink-0 items-center justify-between px-10 pt-8 lg:flex xl:px-12">
          <div className="flex items-center gap-2" aria-hidden="true">
            {STEP_META.map((item, index) => (
              <span
                key={item.label}
                className={`h-1.5 w-10 rounded-full transition-colors ${
                  index <= step ? "bg-primary" : "bg-line"
                }`}
              />
            ))}
          </div>

          <p className="text-sm text-body">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary-dark"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-1 flex-col"
        >
          <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-5 py-8 sm:px-8 lg:max-w-3xl lg:px-10 lg:py-10 xl:px-12">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <span className="h-0.5 w-5 rounded-full bg-accent" />
                Step {step + 1} of {STEP_META.length}
              </p>

              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink lg:text-4xl">
                {meta.title}
              </h1>

              <p className="mt-2 text-body lg:text-lg">{meta.text}</p>
            </div>

            {submitError && (
              <div
                role="alert"
                className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
              >
                {submitError}
              </div>
            )}

            {step === 0 && (
              <PublicRegisterCampusInfo
                formData={formData}
                errors={errors}
                onChange={handleChange}
                fellowships={fellowships}
                fellowshipsLoading={fellowshipsLoading}
                fellowshipsError={fellowshipsError}
                onRetry={() => setReloadKey((value) => value + 1)}
                departments={departments}
                departmentsLoading={departmentsLoading}
              />
            )}

            {step === 1 && (
              <>
                <PublicRegisterPersonalInfo
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />

                <PublicRegisterContactInfo
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />
              </>
            )}

            {step === 2 && (
              <PublicRegisterBackgroundInfo
                formData={formData}
                errors={errors}
                onChange={handleChange}
              />
            )}

            {step === 3 && (
              <>
                <PublicRegisterProfileImage
                  value={profileImage}
                  onChange={setProfileImage}
                  error={errors.profileImage}
                />

                <PublicRegisterAccountInfo
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />

                <CheckboxCard
                  checked={agreed}
                  onChange={(event) => {
                    setAgreed(event.target.checked);
                    setErrors((current) => ({ ...current, terms: "" }));
                  }}
                  title="I agree to the fellowship terms"
                  description="I confirm that the information I have provided is accurate."
                  error={errors.terms}
                />

                <p className="-mt-2 px-1 text-sm text-body">
                  Please read the{" "}
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="rounded font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Fellowship Terms &amp; Conditions
                  </button>{" "}
                  before you create your account, or{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    open them in a new tab
                  </Link>
                  .
                </p>
              </>
            )}

            <p className="pt-2 text-center text-sm text-body lg:hidden">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:text-primary-dark"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Action bar */}
          <div className="sticky bottom-0 border-t border-line bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 py-4 sm:px-8 lg:max-w-3xl lg:px-10 xl:px-12">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-ink ring-1 ring-line transition hover:text-primary hover:ring-primary/40 active:scale-[0.97] disabled:opacity-60"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </button>
              )}

              {step < LAST_STEP ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="group ml-auto flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 sm:min-w-48 sm:flex-none"
                >
                  Continue
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-primary-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-48 sm:flex-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <TermsDialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        onAccept={() => {
          setAgreed(true);
          setErrors((current) => ({ ...current, terms: "" }));
        }}
      />
    </div>
  );
}
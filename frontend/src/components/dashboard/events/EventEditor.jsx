"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Trash2,
} from "lucide-react";

import { useAccess } from "@/components/dashboard/access/AccessProvider";
import EventCover from "@/components/shared/events/EventCover";
import {
  createEvent,
  getEventForEdit,
  getEventOptions,
  updateEvent,
} from "@/lib/eventsApi";
import { toDateTimeLocal } from "@/lib/eventFormat";

const CAPABILITIES = [
  "fellowship:manage",
  "general:manage",
  "ministry:lead",
  "smallgroup:lead",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHONE_PATTERN = /^[0-9+\-\s()]{6,30}$/;

const CHOICES = {
  public: {
    label: "Public",
    hint: "On the church website and for everyone signed in.",
  },
  members: {
    label: "Members",
    hint: "Signed-in members of a campus.",
  },
  ministry: {
    label: "A ministry",
    hint: "Only the members of one ministry.",
  },
  small_group: {
    label: "A small group",
    hint: "Only the members of one small group.",
  },
};

const fieldClass = (error) =>
  `w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    error
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
  }`;

function Field({ id, label, required, hint, error, children }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      {children}

      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function Card({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {children}
    </section>
  );
}

const emptyForm = {
  title: "",
  category: "Worship",
  description: "",
  location: "",
  onlineUrl: "",
  allDay: false,
  startAt: "",
  endAt: "",
  repeatType: "none",
  repeatUntil: "",
  visibility: "members",
  fellowshipId: "",
  ministryId: "",
  smallGroupId: "",
  theme: "",
  speaker: "",
  verseReference: "",
  verseText: "",
  contactPhone: "",
  rsvpEnabled: false,
  capacity: "",
  featured: false,
};

// [["Main Campus", [ministry, ...]], ...] so each campus shows its own list.
function groupByCampus(items) {
  const groups = new Map();

  items.forEach((item) => {
    const label = item.isGeneral
      ? "General Fellowship"
      : item.campusName || "Campus";

    if (!groups.has(label)) groups.set(label, []);

    groups.get(label).push(item);
  });

  return [...groups.entries()];
}

function GroupedSelect({ id, value, onChange, items, placeholder, error, disabled }) {
  const groups = groupByCampus(items);

  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={`${fieldClass(error)} h-11 disabled:bg-slate-50`}
    >
      {placeholder && <option value="">{placeholder}</option>}

      {groups.map(([label, list]) => (
        <optgroup key={label} label={label}>
          {list.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

export default function EventEditor({ eventId = null }) {
  const router = useRouter();
  const editing = Boolean(eventId);

  const { access, loading: accessLoading } = useAccess();

  const allowed = CAPABILITIES.some((capability) =>
    access?.capabilities?.includes(capability)
  );

  const [options, setOptions] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [moreOpen, setMoreOpen] = useState(false);

  const [existingImage, setExistingImage] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  // Load the choices (and the event itself when editing).
  useEffect(() => {
    if (accessLoading || !allowed) return;

    let cancelled = false;

    async function load() {
      try {
        const [loaded, event] = await Promise.all([
          getEventOptions(),
          editing ? getEventForEdit(eventId) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setOptions(loaded);

        if (event) {
          const day = (value) => toDateTimeLocal(value).slice(0, 10);
          const when = (value) => (event.allDay ? day(value) : toDateTimeLocal(value));

          const startAt = when(event.firstStartAt);
          const endAt = event.firstEndAt ? when(event.firstEndAt) : "";

          setForm({
            title: event.title,
            category: event.category,
            description: event.description || "",
            location: event.location === "To be announced" ? "" : event.location,
            onlineUrl: event.onlineUrl || "",
            allDay: event.allDay,
            startAt,
            endAt: event.allDay && endAt === startAt ? "" : endAt,
            repeatType: event.repeatType,
            repeatUntil: event.repeatUntil || "",
            visibility: event.visibility,
            fellowshipId: event.fellowshipId ? String(event.fellowshipId) : "",
            ministryId: event.ministryId ? String(event.ministryId) : "",
            smallGroupId: event.smallGroupId ? String(event.smallGroupId) : "",
            theme: event.theme || "",
            speaker: event.speaker || "",
            verseReference: event.verseReference || "",
            verseText: event.verseText || "",
            contactPhone: event.contactPhone || "",
            rsvpEnabled: event.rsvpEnabled,
            capacity: event.capacity ? String(event.capacity) : "",
            featured: event.featured,
          });

          setExistingImage(event.imageUrl || "");

          setMoreOpen(
            Boolean(
              event.theme ||
                event.speaker ||
                event.verseReference ||
                event.verseText ||
                event.contactPhone ||
                event.onlineUrl
            )
          );
        } else {
          const managesCampus =
            loaded.canWholeFellowship || loaded.campuses.length > 0;

          setForm((current) => ({
            ...current,
            visibility: loaded.visibilities.includes("members")
              ? "members"
              : loaded.visibilities[0] || "members",
            // One campus to manage: no need to ask.
            fellowshipId:
              !loaded.canWholeFellowship && loaded.campuses.length === 1
                ? String(loaded.campuses[0].id)
                : "",
            // A leader with one ministry or group: pick it for them.
            ministryId:
              !managesCampus && loaded.ministries.length === 1
                ? String(loaded.ministries[0].id)
                : "",
            smallGroupId:
              !managesCampus && loaded.smallGroups.length === 1
                ? String(loaded.smallGroups[0].id)
                : "",
          }));
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [accessLoading, allowed, editing, eventId]);

  // Release a temporary photo preview when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function set(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setServerError("");
  }

  const handleChange = (event) => set(event.target.name, event.target.value);

  function handleAllDay(checked) {
    setForm((current) => ({
      ...current,
      allDay: checked,
      startAt: checked
        ? current.startAt.slice(0, 10)
        : current.startAt && current.startAt.length === 10
          ? `${current.startAt}T09:00`
          : current.startAt,
      endAt: checked ? current.endAt.slice(0, 10) : "",
    }));

    setErrors((current) => ({ ...current, startAt: "", endAt: "" }));
  }

  function handleImage(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setServerError("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setServerError("The image must not exceed 10 MB.");
      return;
    }

    setServerError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImage(null);
    setPreview("");
    setRemoveImage(Boolean(existingImage));
  }

  // What the audience part of the form needs, from what this person may do.
  const managesCampus = options
    ? options.canWholeFellowship || options.campuses.length > 0
    : false;

  const showCampus =
    managesCampus &&
    (form.visibility === "public" || form.visibility === "members");

  const needsMinistry =
    form.visibility === "ministry" ||
    (!managesCampus && form.visibility === "members");

  const needsGroup = form.visibility === "small_group";

  function validate() {
    const next = {};

    if (form.title.trim().length < 3) {
      next.title = "Enter a title (at least 3 characters).";
    }

    if (!form.startAt) {
      next.startAt = form.allDay ? "Choose the date." : "Choose the start date and time.";
    }

    if (form.endAt && form.startAt) {
      const invalid = form.allDay
        ? form.endAt < form.startAt
        : form.endAt <= form.startAt;

      if (invalid) next.endAt = "The end must be after the start.";
    }

    if (
      form.repeatType === "weekly" &&
      form.repeatUntil &&
      form.startAt &&
      form.repeatUntil < form.startAt.slice(0, 10)
    ) {
      next.repeatUntil = "This can't be before the first date.";
    }

    if (form.onlineUrl.trim() && !/^https?:\/\/\S+$/i.test(form.onlineUrl.trim())) {
      next.onlineUrl = "The link must start with https://";
    }

    if (form.contactPhone.trim() && !PHONE_PATTERN.test(form.contactPhone.trim())) {
      next.contactPhone = "Enter a valid phone number.";
    }

    if (form.rsvpEnabled && form.capacity.trim()) {
      const capacity = Number(form.capacity);

      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 5000) {
        next.capacity = "Enter a number between 1 and 5000.";
      }
    }

    if (
      showCampus &&
      !options.canWholeFellowship &&
      options.campuses.length > 1 &&
      !form.fellowshipId
    ) {
      next.fellowshipId = "Choose the campus.";
    }

    if (needsMinistry && !form.ministryId) next.ministryId = "Choose a ministry.";

    if (needsGroup && !form.smallGroupId) next.smallGroupId = "Choose a small group.";

    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Show the optional details if the problem is inside them.
      if (
        validationErrors.onlineUrl ||
        validationErrors.contactPhone
      ) {
        setMoreOpen(true);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const data = new FormData();

    const append = (name, value) => data.append(name, value ?? "");

    append("title", form.title.trim());
    append("category", form.category);
    append("description", form.description.trim());
    append("location", form.location.trim());
    append("onlineUrl", form.onlineUrl.trim());
    append("contactPhone", form.contactPhone.trim());
    append("theme", form.theme.trim());
    append("speaker", form.speaker.trim());
    append("verseReference", form.verseReference.trim());
    append("verseText", form.verseText.trim());
    append("allDay", String(form.allDay));
    append("startAt", form.startAt);
    append("endAt", form.endAt);
    append("repeatType", form.repeatType);
    append("repeatUntil", form.repeatType === "weekly" ? form.repeatUntil : "");
    append("visibility", form.visibility);
    append("fellowshipId", showCampus ? form.fellowshipId : "");
    append("ministryId", needsMinistry ? form.ministryId : "");
    append("smallGroupId", needsGroup ? form.smallGroupId : "");
    append("rsvpEnabled", String(form.rsvpEnabled));
    append("capacity", form.rsvpEnabled ? form.capacity.trim() : "");
    append(
      "featured",
      String(
        Boolean(options?.canFeature && form.visibility === "public" && form.featured)
      )
    );

    if (image) data.append("image", image);
    if (removeImage) data.append("removeImage", "true");

    setSaving(true);
    setServerError("");

    try {
      if (editing) {
        await updateEvent(eventId, data);
      } else {
        await createEvent(data);
      }

      router.push(`/dashboard/events?saved=${editing ? "updated" : "created"}`);
    } catch (err) {
      setServerError(err.message || "We couldn't save the event.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSaving(false);
    }
  }

  if (accessLoading) return null;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Lock className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />

        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          You don&apos;t have access to this page
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Events can be added by campus leaders, ministry leaders and small
          group overseers.
        </p>

        <Link
          href="/dashboard/events"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to events
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
      >
        <p className="text-sm text-red-700">{loadError}</p>

        <Link
          href="/dashboard/events"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to events
        </Link>
      </div>
    );
  }

  if (!options) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-500"
      >
        <Loader2 size={18} className="animate-spin" />
        Loading...
      </div>
    );
  }

  const choices = options.visibilities.filter(
    (value) => value !== "public" || options.canPublic
  );

  const shownImage = preview || (removeImage ? "" : existingImage);
  const dateType = form.allDay ? "date" : "datetime-local";

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div>
          <Link
            href="/dashboard/events"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to events
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {editing ? "Edit event" : "Add event"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {editing
              ? "Changes appear in dashboards and on the website within about a minute."
              : "Only the title and the date are required. The event goes live as soon as you save it."}
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {serverError}
          </div>
        )}

        {/* The event */}
        <Card title="The event">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field id="title" label="Title" required error={errors.title}>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="For example: Friday Prayer Night"
                  aria-invalid={Boolean(errors.title)}
                  className={`${fieldClass(errors.title)} h-11`}
                />
              </Field>
            </div>

            <Field id="category" label="Category">
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`${fieldClass(false)} h-11`}
              >
                {options.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="location"
              label="Place (optional)"
              hint="A room, a building or an address."
            >
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                maxLength={255}
                placeholder="Main hall"
                className={`${fieldClass(false)} h-11`}
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                id="description"
                label="Description (optional)"
                hint="What will happen, who should come, what to bring. Line breaks are kept."
              >
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={form.description}
                  onChange={handleChange}
                  maxLength={5000}
                  className={`${fieldClass(false)} py-3`}
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* When */}
        <Card
          title="When"
          description="Times are shown exactly as you enter them, in the fellowship's local time."
        >
          <label className="mb-5 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(event) => handleAllDay(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />

            <span className="text-sm font-medium text-slate-700">All day</span>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              id="startAt"
              label={form.allDay ? "Date" : "Starts"}
              required
              error={errors.startAt}
            >
              <input
                id="startAt"
                name="startAt"
                type={dateType}
                value={form.startAt}
                onChange={handleChange}
                aria-invalid={Boolean(errors.startAt)}
                className={`${fieldClass(errors.startAt)} h-11`}
              />
            </Field>

            <Field
              id="endAt"
              label={form.allDay ? "Last day (optional)" : "Ends (optional)"}
              error={errors.endAt}
            >
              <input
                id="endAt"
                name="endAt"
                type={dateType}
                value={form.endAt}
                onChange={handleChange}
                aria-invalid={Boolean(errors.endAt)}
                className={`${fieldClass(errors.endAt)} h-11`}
              />
            </Field>

            <Field id="repeatType" label="Repeats">
              <select
                id="repeatType"
                name="repeatType"
                value={form.repeatType}
                onChange={handleChange}
                className={`${fieldClass(false)} h-11`}
              >
                <option value="none">Does not repeat</option>
                <option value="weekly">Every week</option>
              </select>
            </Field>

            {form.repeatType === "weekly" && (
              <Field
                id="repeatUntil"
                label="Last repeat (optional)"
                error={errors.repeatUntil}
                hint="Leave empty to repeat until you stop it."
              >
                <input
                  id="repeatUntil"
                  name="repeatUntil"
                  type="date"
                  value={form.repeatUntil}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.repeatUntil)}
                  className={`${fieldClass(errors.repeatUntil)} h-11`}
                />
              </Field>
            )}
          </div>
        </Card>

        {/* Who is it for */}
        <Card
          title="Who is it for"
          description="Choose who can see this event. Each campus has its own ministries and small groups."
        >
          <fieldset>
            <legend className="sr-only">Who can see this event</legend>

            <div className="grid gap-3 sm:grid-cols-2">
              {choices.map((value) => {
                const choice = CHOICES[value];
                const active = form.visibility === value;

                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-indigo-500 ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={value}
                      checked={active}
                      onChange={handleChange}
                      className="sr-only"
                    />

                    <span className="text-sm font-semibold">{choice.label}</span>

                    <span
                      className={`text-xs leading-5 ${
                        active ? "text-white/75" : "text-slate-500"
                      }`}
                    >
                      {value === "members" && !managesCampus
                        ? "All signed-in members of your campus."
                        : choice.hint}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {showCampus &&
              (options.canWholeFellowship || options.campuses.length > 1) && (
                <Field
                  id="fellowshipId"
                  label="Campus"
                  required={!options.canWholeFellowship}
                  error={errors.fellowshipId}
                >
                  <select
                    id="fellowshipId"
                    name="fellowshipId"
                    value={form.fellowshipId}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.fellowshipId)}
                    className={`${fieldClass(errors.fellowshipId)} h-11`}
                  >
                    {options.canWholeFellowship ? (
                      <option value="">Whole fellowship (all campuses)</option>
                    ) : (
                      <option value="">Select campus</option>
                    )}

                    {options.campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

            {needsMinistry && (
              <Field
                id="ministryId"
                label={managesCampus ? "Ministry" : "Hosted by your ministry"}
                required
                error={errors.ministryId}
              >
                <GroupedSelect
                  id="ministryId"
                  value={form.ministryId}
                  onChange={(event) => set("ministryId", event.target.value)}
                  items={options.ministries}
                  placeholder={
                    options.ministries.length === 1 ? "" : "Select ministry"
                  }
                  error={errors.ministryId}
                  disabled={options.ministries.length === 1}
                />
              </Field>
            )}

            {needsGroup && (
              <Field
                id="smallGroupId"
                label="Small group"
                required
                error={errors.smallGroupId}
              >
                <GroupedSelect
                  id="smallGroupId"
                  value={form.smallGroupId}
                  onChange={(event) => set("smallGroupId", event.target.value)}
                  items={options.smallGroups}
                  placeholder={
                    options.smallGroups.length === 1 ? "" : "Select small group"
                  }
                  error={errors.smallGroupId}
                  disabled={options.smallGroups.length === 1}
                />
              </Field>
            )}
          </div>

          {!options.canPublic && (
            <p className="mt-4 text-xs text-slate-500">
              Only campus leaders can publish events on the public website.
            </p>
          )}

          {options.canFeature && form.visibility === "public" && (
            <label className="mt-5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => set("featured", event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              />

              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Feature on the homepage
                </span>
                <span className="mt-0.5 block text-sm text-slate-500">
                  The homepage highlights one upcoming event. Featured events
                  are chosen first. Otherwise the next public event is shown.
                </span>
              </span>
            </label>
          )}
        </Card>

        {/* RSVP */}
        <Card
          title="RSVP"
          description="Optional. Let members say if they are coming."
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.rsvpEnabled}
              onChange={(event) => set("rsvpEnabled", event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />

            <span>
              <span className="block text-sm font-semibold text-slate-900">
                Ask people to RSVP
              </span>
              <span className="mt-0.5 block text-sm text-slate-500">
                Members answer going, maybe or can&apos;t go. You see who is
                coming.
              </span>
            </span>
          </label>

          {form.rsvpEnabled && (
            <div className="mt-5 max-w-xs">
              <Field
                id="capacity"
                label="Places (optional)"
                error={errors.capacity}
                hint="Leave empty for no limit. Guests count as places."
              >
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={5000}
                  value={form.capacity}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.capacity)}
                  className={`${fieldClass(errors.capacity)} h-11`}
                />
              </Field>
            </div>
          )}
        </Card>

        {/* Photo */}
        <Card
          title="Photo"
          description="Optional. JPG, PNG or WEBP up to 10 MB."
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="h-32 w-full overflow-hidden rounded-xl bg-slate-100 sm:w-56">
              <EventCover src={shownImage} alt="Event photo preview" />
            </div>

            <div className="flex flex-wrap gap-3">
              <label
                htmlFor="event-image"
                className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500"
              >
                <Camera size={16} aria-hidden="true" />
                {shownImage ? "Change photo" : "Choose photo"}
              </label>

              <input
                id="event-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImage}
                className="sr-only"
              />

              {shownImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* More details */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setMoreOpen((current) => !current)}
            aria-expanded={moreOpen}
            className="flex w-full items-center justify-between gap-3 p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          >
            <span>
              <span className="block text-base font-semibold text-slate-900">
                More details
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Optional: online link, theme, speaker, verse and a contact
                phone.
              </span>
            </span>

            <ChevronDown
              size={18}
              aria-hidden="true"
              className={`shrink-0 text-slate-400 transition ${
                moreOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {moreOpen && (
            <div className="grid gap-5 border-t border-slate-100 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  id="onlineUrl"
                  label="Online link"
                  error={errors.onlineUrl}
                  hint="For a meeting or a live stream. Only signed-in members see it."
                >
                  <input
                    id="onlineUrl"
                    name="onlineUrl"
                    type="url"
                    value={form.onlineUrl}
                    onChange={handleChange}
                    maxLength={500}
                    placeholder="https://"
                    aria-invalid={Boolean(errors.onlineUrl)}
                    className={`${fieldClass(errors.onlineUrl)} h-11`}
                  />
                </Field>
              </div>

              <Field id="theme" label="Theme">
                <input
                  id="theme"
                  name="theme"
                  value={form.theme}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="e.g. Rooted in Christ"
                  className={`${fieldClass(false)} h-11`}
                />
              </Field>

              <Field id="speaker" label="Speaker">
                <input
                  id="speaker"
                  name="speaker"
                  value={form.speaker}
                  onChange={handleChange}
                  maxLength={150}
                  className={`${fieldClass(false)} h-11`}
                />
              </Field>

              <Field id="verseReference" label="Verse">
                <input
                  id="verseReference"
                  name="verseReference"
                  value={form.verseReference}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="e.g. Colossians 2:6-7"
                  className={`${fieldClass(false)} h-11`}
                />
              </Field>

              <Field
                id="contactPhone"
                label="Contact phone"
                error={errors.contactPhone}
              >
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  inputMode="tel"
                  value={form.contactPhone}
                  onChange={handleChange}
                  maxLength={30}
                  aria-invalid={Boolean(errors.contactPhone)}
                  className={`${fieldClass(errors.contactPhone)} h-11`}
                />
              </Field>

              <div className="md:col-span-2">
                <Field id="verseText" label="Verse text">
                  <textarea
                    id="verseText"
                    name="verseText"
                    rows={3}
                    value={form.verseText}
                    onChange={handleChange}
                    maxLength={600}
                    placeholder="Type the verse as it is in your Bible."
                    className={`${fieldClass(false)} py-3`}
                  />
                </Field>
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <Link
            href="/dashboard/events"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check size={17} aria-hidden="true" />
                {editing ? "Save changes" : "Create event"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
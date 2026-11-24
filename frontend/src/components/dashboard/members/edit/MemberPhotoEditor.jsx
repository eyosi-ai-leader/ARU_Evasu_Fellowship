"use client";

export default function MemberPhotoEditor({
  form,
  profileImage,
  imagePreview,
  onImageChange,
  onRemoveImage,
}) {
  const initials = `${form.firstName?.[0] || ""}${form.lastName?.[0] || ""}`;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-line">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-ember text-lg font-bold uppercase text-white shadow-soft">
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Member profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{initials || "?"}</span>
          )}
        </div>

        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-ink">
            Profile photo
          </h2>

          <p className="mt-1 text-sm text-body">
            JPG, PNG or WEBP. Maximum file size: 10MB.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <label
              htmlFor="profileImage"
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark active:scale-[0.97] focus-within:ring-4 focus-within:ring-primary/20"
            >
              {profileImage || imagePreview ? "Change photo" : "Choose photo"}
            </label>

            <input
              id="profileImage"
              name="profileImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onImageChange}
              className="sr-only"
            />

            {imagePreview && (
              <button
                type="button"
                onClick={onRemoveImage}
                className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-danger ring-1 ring-danger/30 transition hover:bg-danger/10 active:scale-[0.97]"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
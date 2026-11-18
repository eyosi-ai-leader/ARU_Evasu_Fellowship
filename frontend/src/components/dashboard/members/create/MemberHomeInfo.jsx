"use client";

import {
  ETHIOPIA_REGIONS,
  OTHER_OPTION,
  getCities,
} from "@/lib/ethiopiaLocations";
import { Field, Section, fieldClass } from "./FormParts";

/*
 * Where the member is from: the same Ethiopian region and city lists as
 * the public registration form, plus the specific place or area.
 */
export default function MemberHomeInfo({ form, errors = {}, onChange }) {
  const cities = getCities(form.homeRegion);

  return (
    <Section
      title="Where they are from"
      description="Where they or their family lived before coming to campus."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field id="homeRegion" label="Region">
          <select
            id="homeRegion"
            name="homeRegion"
            value={form.homeRegion}
            onChange={onChange}
            className={fieldClass(false)}
          >
            <option value="">Select region</option>

            {ETHIOPIA_REGIONS.map((region) => (
              <option key={region.name} value={region.name}>
                {region.label ?? region.name}
              </option>
            ))}
          </select>
        </Field>

        <Field id="homeCity" label="City or town">
          <select
            id="homeCity"
            name="homeCity"
            value={form.homeCity}
            onChange={onChange}
            disabled={!form.homeRegion}
            className={fieldClass(false)}
          >
            <option value="">
              {form.homeRegion ? "Select city or town" : "Select region first"}
            </option>

            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}

            {form.homeRegion && (
              <option value={OTHER_OPTION}>Other (write the town)</option>
            )}
          </select>
        </Field>

        {form.homeCity === OTHER_OPTION && (
          <div className="md:col-span-2">
            <Field
              id="homeTownOther"
              label="City or town"
              required
              error={errors.homeTownOther}
            >
              <input
                id="homeTownOther"
                type="text"
                name="homeTownOther"
                value={form.homeTownOther}
                onChange={onChange}
                placeholder="Type the name of the town"
                aria-invalid={Boolean(errors.homeTownOther)}
                className={fieldClass(errors.homeTownOther)}
              />
            </Field>
          </div>
        )}

        <div className="md:col-span-2">
          <Field id="address" label="Specific place or area">
            <input
              id="address"
              type="text"
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="e.g. woreda, kebele, village or neighborhood"
              className={fieldClass(false)}
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}
import { TERMS_SECTIONS, TERMS_UPDATED, TERMS_VERSION } from "@/lib/fellowshipTerms";

export default function TermsContent() {
  return (
    <div className="space-y-7">
      <p className="text-xs font-medium text-slate-400">
        Version {TERMS_VERSION} &middot; Last updated {TERMS_UPDATED}
      </p>

      {TERMS_SECTIONS.map((section, index) => (
        <section key={section.id} aria-labelledby={`terms-${section.id}`}>
          <h2
            id={`terms-${section.id}`}
            className="text-base font-semibold text-slate-900"
          >
            {index + 1}. {section.title}
          </h2>

          {section.paragraphs?.map((text) => (
            <p key={text} className="mt-2 text-sm leading-6 text-slate-600">
              {text}
            </p>
          ))}

          {section.items && (
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-600 marker:text-indigo-400">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
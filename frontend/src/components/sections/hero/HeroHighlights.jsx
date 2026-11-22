import heroContent from "@/data/heroContent";

export default function HeroHighlights() {
  return (
    <dl className="mt-12 grid max-w-md grid-cols-3 gap-3">
      {heroContent.highlights.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/20 backdrop-blur-md"
        >
          <dt className="sr-only">{item.label}</dt>
          <dd className="font-display text-2xl font-semibold text-white">
            {item.value}
          </dd>
          <p className="text-xs text-white/70">{item.label}</p>
        </div>
      ))}
    </dl>
  );
}
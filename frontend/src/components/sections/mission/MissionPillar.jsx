import { BookOpen, Flame, HeartHandshake } from "lucide-react";

const ICONS = { Flame, BookOpen, HeartHandshake };

export default function MissionPillar({ icon, title, text }) {
  const Icon = ICONS[icon] ?? Flame;

  return (
    <div className="group h-full rounded-3xl bg-surface-muted p-7 ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white transition group-hover:bg-ember">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>

      <h3 className="mt-6 font-display text-xl font-semibold text-ink">
        {title}
      </h3>
      <p className="mt-2 leading-7 text-body">{text}</p>
    </div>
  );
}
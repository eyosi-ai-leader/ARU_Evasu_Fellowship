import Image from "next/image";

export default function MomentTile({ src, caption }) {
  return (
    <figure className="group relative h-full overflow-hidden rounded-3xl bg-surface-warm">
      <Image
        src={src}
        alt={caption}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover transition duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />

      <figcaption className="absolute inset-x-4 bottom-4 translate-y-1 text-sm font-medium text-white transition group-hover:translate-y-0">
        {caption}
      </figcaption>
    </figure>
  );
}
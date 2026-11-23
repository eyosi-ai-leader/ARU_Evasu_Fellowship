import { notFound } from "next/navigation";

import { FellowshipDetailPage } from "@/components/pages/fellowships";
import { fellowships, getFellowship } from "@/data/fellowships";

export function generateStaticParams() {
  return fellowships.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const fellowship = getFellowship(slug);

  if (!fellowship) return { title: "Fellowship" };

  return { title: fellowship.name, description: fellowship.description };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const fellowship = getFellowship(slug);

  if (!fellowship) notFound();

  return <FellowshipDetailPage fellowship={fellowship} />;
}
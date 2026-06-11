import { CareerDetailPage } from "@/features/learner/pages/CareerDetailPage";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CareerDetailPage slug={slug} />;
}

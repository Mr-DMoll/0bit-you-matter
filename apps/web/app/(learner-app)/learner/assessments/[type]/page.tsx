import { AssessmentSessionPage } from "@/features/learner/pages/AssessmentSessionPage";

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <AssessmentSessionPage typeSlug={type} />;
}

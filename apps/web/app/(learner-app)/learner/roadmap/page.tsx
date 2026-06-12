import { Suspense } from "react";
import { RoadmapPage } from "@/features/learner/pages/RoadmapPage";

export default function Page() {
  return (
    <Suspense>
      <RoadmapPage />
    </Suspense>
  );
}

import { Suspense } from "react";
import { ReviewScreenPage } from "@/features/reviewer/pages/ReviewScreenPage";
export default function Page() {
  return (
    <Suspense>
      <ReviewScreenPage />
    </Suspense>
  );
}

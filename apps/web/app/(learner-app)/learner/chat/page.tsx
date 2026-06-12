import { Suspense } from "react";
import { GuidanceChatPage } from "@/features/learner/pages/GuidanceChatPage";

export default function Page() {
  return (
    <Suspense>
      <GuidanceChatPage />
    </Suspense>
  );
}

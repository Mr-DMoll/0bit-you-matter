import { LearnerShell } from "@/features/learner/components/LearnerShell";

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return <LearnerShell>{children}</LearnerShell>;
}

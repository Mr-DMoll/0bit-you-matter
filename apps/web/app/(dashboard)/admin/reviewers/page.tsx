"use client";
import { StaffPage } from "@/features/admin/components/StaffPage";

export default function ReviewersPage() {
  return (
    <StaffPage
      title="Professional Reviewers"
      description="Invite and manage subject matter experts who validate AI-generated content."
      roles={["REVIEWER"]}
      inviteConfigs={[
        {
          role:        "REVIEWER",
          label:       "Professional Reviewer",
          placeholder: "reviewer@example.com",
        },
      ]}
    />
  );
}

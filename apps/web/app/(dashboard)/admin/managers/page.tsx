"use client";
import { StaffPage } from "@/features/admin/components/StaffPage";

export default function ManagersPage() {
  return (
    <StaffPage
      title="Managers & Content Managers"
      description="Invite and manage learner-facing managers and content pipeline managers."
      roles={["MANAGER", "CONTENT_MANAGER"]}
      inviteConfigs={[
        {
          role:        "MANAGER",
          label:       "Manager",
          placeholder: "manager@example.com",
        },
        {
          role:        "CONTENT_MANAGER",
          label:       "Content Manager",
          placeholder: "content@example.com",
        },
      ]}
    />
  );
}

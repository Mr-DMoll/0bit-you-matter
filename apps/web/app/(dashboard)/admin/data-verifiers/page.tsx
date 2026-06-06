"use client";
import { StaffPage } from "@/features/admin/components/StaffPage";

export default function DataVerifiersPage() {
  return (
    <StaffPage
      title="Data Verifiers"
      description="Invite and manage verifiers who cross-check APS scores, deadlines and bursary data against official sources."
      roles={["DATA_VERIFIER"]}
      inviteConfigs={[
        {
          role:        "DATA_VERIFIER",
          label:       "Data Verifier",
          placeholder: "verifier@example.com",
        },
      ]}
    />
  );
}

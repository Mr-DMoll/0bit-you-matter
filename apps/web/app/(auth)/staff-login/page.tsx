import { Suspense } from "react";
import LoginPage from "@/features/auth/pages/LoginPage";

export default function StaffLoginRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}

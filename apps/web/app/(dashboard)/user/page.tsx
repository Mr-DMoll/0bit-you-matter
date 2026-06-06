import { redirect } from "next/navigation";
// The USER role no longer exists — all learners use /learner
export default function UserRedirect() {
  redirect("/learner");
}

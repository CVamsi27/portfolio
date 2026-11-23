import { redirect } from "next/navigation";

export default function RetiredRoutinePage() {
  redirect("/settings?view=notifications");
}

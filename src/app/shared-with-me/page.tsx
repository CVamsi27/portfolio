import { redirect } from "next/navigation";

export default function SharedWithMePage() {
  redirect("/share?view=incoming");
}

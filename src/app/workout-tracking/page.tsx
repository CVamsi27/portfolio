import { redirect } from "next/navigation";

export default function RetiredWorkoutPage() {
  redirect("/health?notice=retired-manual");
}

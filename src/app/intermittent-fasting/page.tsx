import { redirect } from "next/navigation";

export default function RetiredFastingPage() {
  redirect("/health?notice=retired-manual");
}

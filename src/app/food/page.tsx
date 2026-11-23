import { redirect } from "next/navigation";

export default function RetiredFoodPage() {
  redirect("/health?notice=retired-manual");
}

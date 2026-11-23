import { redirect } from "next/navigation";

export default function RetiredWeightLossPage() {
  redirect("/health?notice=retired-manual");
}

import { redirect } from "next/navigation";

/** Public alias — the portfolio lives at `/`. */
export default function PortfolioAlias() {
  redirect("/");
}

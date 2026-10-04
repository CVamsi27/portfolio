"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isPersonalPrimaryPath } from "@/lib/personal-nav";
import { ArrowLeft } from "lucide-react";
export default function PersonalBackLink() {
  const path = usePathname();
  const sections = [
    { href: "/plan", label: "Plan" },
    { href: "/health", label: "Health" },
    { href: "/dashboard", label: "Progress" },
    { href: "/more", label: "More" },
  ];
  const parent = sections.find((section) =>
    isPersonalPrimaryPath(path, section.href),
  ) ?? {
    href: "/hub",
    label: "Today",
  };
  return (
    <Link href={parent.href} className="dossier-back-link">
      <ArrowLeft className="h-3.5 w-3.5" />
      {parent.label}
    </Link>
  );
}

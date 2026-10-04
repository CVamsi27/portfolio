import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default function SectionLinks({
  items,
}: {
  items: { href: string; label: string; description: string }[];
}) {
  return (
    <div className="personal-destination-list">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="personal-destination-link"
        >
          <div className="min-w-0">
            <h2 className="font-semibold">{item.label}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
          <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-primary" />
        </Link>
      ))}
    </div>
  );
}

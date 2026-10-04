import Link from "next/link";
export default function SectionLinks({
  items,
}: {
  items: { href: string; label: string; description: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-xl border border-border bg-card p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <h2 className="font-semibold">{item.label} →</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        </Link>
      ))}
    </div>
  );
}

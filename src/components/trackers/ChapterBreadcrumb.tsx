import Link from "next/link";

/**
 * Compact chapter trail rendered inside `PageHeader`, e.g. `Plan / Tasks`.
 * Chapter roots omit it entirely; child pages link back to their chapter.
 */
export default function ChapterBreadcrumb({
  href,
  label,
  current,
}: {
  /** Chapter root, e.g. `/plan`. */
  href: string;
  /** Chapter label, e.g. `Plan`. */
  label: string;
  /** Current page label, e.g. `Tasks`. */
  current: string;
}) {
  return (
    <>
      <Link href={href} className="transition-colors hover:text-foreground">
        {label}
      </Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page" className="text-foreground/90">
        {current}
      </span>
    </>
  );
}

import { cn } from "@/lib/utils";

type NovaMarkProps = {
  variant?: "mark" | "compact" | "wordmark";
  className?: string;
  label?: string;
  simple?: boolean;
};

const variantStyles = {
  mark: {
    svg: "h-9 w-9",
    text: "",
  },
  compact: {
    svg: "h-7 w-7",
    text: "text-base",
  },
  wordmark: {
    svg: "h-8 w-8",
    text: "text-[1.15rem] sm:text-[1.3rem]",
  },
} as const;

export default function NovaMark({
  variant = "wordmark",
  className,
  label,
  simple = false,
}: NovaMarkProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "nova-brand inline-flex items-center gap-2",
        label ? "[&:focus-visible]:outline-none" : "",
        className,
      )}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-testid="nova-mark"
    >
      <svg
        data-testid={simple ? "nova-simple-mark" : undefined}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", styles.svg)}
      >
        {simple ? (
          <>
            <rect x="5" y="5" width="54" height="54" rx="13" fill="#0B1E23" stroke="#49E7FF" strokeWidth="3" />
            <path d="M18 44V20L46 44V20" stroke="#C8FF3D" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="46" cy="20" r="3" fill="#49E7FF" />
          </>
        ) : (
          <>
            <rect x="1.5" y="1.5" width="61" height="61" rx="15" fill="#071014" />
            <path
              d="M9 25.5C16.5 15 27 10 38.5 11.5C47 12.5 53 17 56 23"
              stroke="#49E7FF"
              strokeWidth="2.25"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M55 38.5C47.5 49 37 54 25.5 52.5C17 51.5 11 47 8 41"
              stroke="#49E7FF"
              strokeWidth="2.25"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M18 44V20L46 44V20"
              stroke="#F7FBFF"
              strokeWidth="4.5"
              strokeLinejoin="bevel"
            />
            <path d="M23 35L30 20" stroke="#C8FF3D" strokeWidth="4" strokeLinecap="round" />
            <path d="M34 35L41 20" stroke="#C8FF3D" strokeWidth="4" strokeLinecap="round" />
          </>
        )}
      </svg>
      {variant !== "mark" ? (
        <span className={cn("nova-wordmark font-normal uppercase leading-none", styles.text)}>
          NOVA
        </span>
      ) : null}
    </span>
  );
}

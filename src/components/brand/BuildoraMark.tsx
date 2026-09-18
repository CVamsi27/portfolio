import { cn } from "@/lib/utils";

type BuildoraMarkProps = {
  variant?: "mark" | "wordmark";
  className?: string;
  label?: string;
};

export default function BuildoraMark({
  variant = "wordmark",
  className,
  label,
}: BuildoraMarkProps) {
  return (
    <span
      className={cn("buildora-brand inline-flex items-center gap-2", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8 shrink-0"
      >
        <rect x="1" y="1" width="34" height="34" rx="10" fill="#111111" />
        <path
          d="M11 9.5H19.5C23.6421 9.5 27 12.1863 27 15.5C27 17.2907 25.9914 18.8736 24.4304 19.8C26.3465 20.7111 27.5 22.4028 27.5 24.5C27.5 28.0899 24.2018 30.5 19.5 30.5H11V9.5Z"
          stroke="#F2EEE6"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M11 19.5H19" stroke="#49E7FF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="8" r="2.5" fill="#C8FF3D" />
      </svg>
      {variant === "wordmark" ? (
        <span className="font-display text-[1.05rem] font-black uppercase leading-none tracking-[0.08em]">
          BUILDORA
        </span>
      ) : null}
    </span>
  );
}

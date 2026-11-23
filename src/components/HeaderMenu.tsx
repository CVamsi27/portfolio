import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const HeaderMenu = ({
  items,
  ariaLabel = "Open menu",
  testId,
  alwaysVisible = false,
}: {
  items: { label: string; href: string }[];
  ariaLabel?: string;
  testId?: string;
  alwaysVisible?: boolean;
}) => {
  return (
    <div className={alwaysVisible ? "flex" : "flex lg:hidden"} data-testid={testId}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-none border border-[var(--portfolio-rule)] bg-transparent text-[var(--portfolio-ink)] transition-colors hover:border-[var(--portfolio-ink)] hover:bg-[var(--portfolio-wash)]"
            aria-label={ariaLabel}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 rounded-none border border-[var(--portfolio-rule)] bg-[var(--portfolio-surface)] p-1 shadow-none"
        >
          {items.map((item, idx) => (
            <DropdownMenuItem key={item.href} asChild>
              <a
                href={item.href}
                className="flex w-full cursor-pointer items-center justify-between rounded-none px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--portfolio-ink)] transition-colors hover:bg-[var(--portfolio-wash)] hover:text-[var(--portfolio-accent)]"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-[var(--portfolio-muted)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HeaderMenu;

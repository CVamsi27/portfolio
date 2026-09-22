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
    <div className={alwaysVisible ? "flex" : "flex md:hidden"} data-testid={testId}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg border border-border/60 bg-muted/20 transition-all hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)]"
            aria-label={ariaLabel}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52 rounded-xl border border-border/70 bg-background/95 p-1.5 shadow-xl backdrop-blur-lg"
        >
          {items.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <a
                href={item.href}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 font-utility text-xs font-medium text-foreground transition-colors hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)]"
              >
                <span>{item.label}</span>
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HeaderMenu;

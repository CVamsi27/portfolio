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
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-none" aria-label={ariaLabel}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-none border-border/80 p-1">
          {items.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <a href={item.href} className="w-full cursor-pointer rounded-lg">
                {item.label}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HeaderMenu;

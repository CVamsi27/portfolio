import { Menu } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MENU_LIST } from "@/lib/const";

const HeaderMenu = () => {
  return (
    <div className="flex md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 rounded-xl">
          {MENU_LIST.map((val) => (
            <DropdownMenuItem key={val} asChild>
              <a href={`#${val}`} className="w-full cursor-pointer rounded-lg">
                {val}
              </a>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <a href="/trackers" className="w-full cursor-pointer rounded-lg font-medium text-primary">
              Trackers →
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HeaderMenu;

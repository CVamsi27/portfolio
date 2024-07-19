import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MENU_LIST } from "@/lib/const";

const HeaderMenu = () => {
  return (
    <div className="flex md:hidden items-center">
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Menu />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {MENU_LIST.map((val) => (
            <DropdownMenuItem key={val} className="hover:text-primary">
              <a href={`#${val}`} key={val}>
                {val}
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
export default HeaderMenu;

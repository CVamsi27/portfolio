import { MENU_LIST } from "@/lib/const";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
        <a
          href="#About"
          className="text-lg font-semibold tracking-tight hover:text-primary transition-colors"
        >
          ~VK
        </a>
        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            {MENU_LIST.map((val) => (
              <a
                key={val}
                href={`#${val}`}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
              >
                {val}
              </a>
            ))}
          </div>
          <ModeToggle />
          <HeaderMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

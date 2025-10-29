import { MENU_LIST } from "@/lib/const";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";

const Navbar = () => {
  return (
    <nav className="flex px-6 py-4 sticky top-0 justify-between items-center bg-card/80 backdrop-blur-md border-b border-border/50 z-50 shadow-lg">
      <a href="#About" className="text-2xl font-bold gradient-text hover:scale-105 transition-transform duration-300">
        ~VK.
      </a>
      <div className="flex gap-8 items-center">
        <div className="hidden md:flex gap-8 items-center">
          {MENU_LIST.map((val) => (
            <a 
              href={`#${val}`} 
              key={val} 
              className="text-foreground hover:text-primary transition-all duration-300 font-medium relative group"
            >
              {val}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-linear-to-r from-primary to-purple-600 group-hover:w-full transition-all duration-300"></span>
            </a>
          ))}
        </div>
        <ModeToggle />
        <HeaderMenu />
      </div>
    </nav>
  );
};

export default Navbar;

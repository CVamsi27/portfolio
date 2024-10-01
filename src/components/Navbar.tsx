import { MENU_LIST } from "@/lib/const";
import { ModeToggle } from "./common/ModeToggle";
import HeaderMenu from "./HeaderMenu";

const Navbar = () => {
  return (
    <nav className="flex px-4 py-3 sticky top-0 justify-between items-center bg-card">
      <span className="text-2xl font-extrabold">~VK.</span>
      <div className="flex gap-8 items-center">
        <div className="hidden md:flex gap-8 items-center">
          {MENU_LIST.map((val) => (
            <a href={`#${val}`} key={val} className="hover:text-primary">
              {val}
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

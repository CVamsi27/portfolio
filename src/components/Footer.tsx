import { Copyright, Heart } from "lucide-react";

const Footer = () => {
  const d = new Date();
  let year = d.getFullYear();
  return (
    <footer className="bottom-0 w-full flex flex-col md:flex-row justify-center gap-2 md:justify-center border-t-1 p-2">
      <div className="flex flex-row gap-2 items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <Copyright className="hover:text-primary-500" />
          <span className="text-sm sm:text-base">{year}, Built with</span>
        </div>
        <div className="flex gap-2 items-center">
          <Heart className="text-red-500 hover:text-black" />
          <span className="text-sm sm:text-base">by Vamsi Krishna</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

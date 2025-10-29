import { Copyright, Heart } from "lucide-react";

const Footer = () => {
  const d = new Date();
  let year = d.getFullYear();
  return (
    <footer className="bottom-0 w-full flex flex-col md:flex-row justify-center gap-2 md:justify-center border-t border-border/50 p-4 bg-card/80 backdrop-blur-md">
      <div className="flex flex-row gap-2 items-center justify-center h-full">
        <div className="flex items-center gap-2 group">
          <Copyright className="hover:text-primary transition-colors duration-300 group-hover:rotate-12" />
          <span className="text-sm sm:text-base">{year}, Built with</span>
        </div>
        <div className="flex gap-2 items-center group">
          <Heart className="text-red-500 hover:text-red-600 transition-all duration-300 group-hover:scale-125 group-hover:animate-pulse" />
          <span className="text-sm sm:text-base font-medium">by <span className="gradient-text">Vamsi Krishna</span></span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

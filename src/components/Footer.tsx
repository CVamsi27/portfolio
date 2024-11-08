import { Copyright, Heart } from "lucide-react";

const Footer = () => {
  const d = new Date();
  let year = d.getFullYear();
  return (
    <footer className="flex justify-center w-full px-4 py-3 sticky bottom-0 border-t-1 bg-card">
      <div className="flex flex-col lg:flex-row gap-2 items-center">
        <div className="flex items-center gap-2">
          <Copyright />
          <span className="text-base">{year}, Built with</span>
        </div>
        <div className="flex gap-2 items-center">
          <Heart className="text-red-500 hover:bg-red-500" />
          <span className="text-base">by Vamsi Krishna</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

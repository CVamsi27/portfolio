import { Copyright, Heart } from "lucide-react";

const Footer = () => {
  const d = new Date();
  let year = d.getFullYear();
  return (
    <footer className="flex justify-center w-full px-4 py-3 sticky bottom-0 border-t-1 bg-card">
      <div className="flex gap-2 items-center">
        <Copyright />
        <span className="text-base">{year}, Built with</span>
        <Heart className="text-red-500 hover:bg-red-500" />
        <span className="text-base">by Vamsi Krishna</span>
      </div>
    </footer>
  );
};

export default Footer;

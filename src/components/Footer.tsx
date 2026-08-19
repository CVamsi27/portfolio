import { Copyright, Heart } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1.5 py-4 px-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Copyright className="h-3.5 w-3.5" />
          <span>{year} Built with</span>
          <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
          <span>
            by <span className="gradient-text font-medium">Vamsi Krishna</span>
          </span>
        </div>
        <span className="hidden sm:inline text-border">·</span>
        <span>React · NestJS · PostgreSQL · TypeScript</span>
      </div>
    </footer>
  );
};

export default Footer;
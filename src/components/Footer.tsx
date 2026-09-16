import { ArrowUp } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 px-6 py-6 text-sm text-muted-foreground">
        <p>
          © {year}{" "}
          <span className="font-medium text-foreground">
            Vamsi Krishna Chandaluri
          </span>
        </p>
        <p className="hidden sm:block text-xs tracking-wide">
          TypeScript · React · PostgreSQL
        </p>
        <a
          href="#About"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/50 hover:text-foreground"
        >
          Top
          <ArrowUp className="h-3 w-3" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;

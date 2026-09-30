import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faStackOverflow,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { Code2, BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

const Connections = ({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) => {
  const socialMediaLinks = [
    {
      href: "https://study.buildora.work",
      icon: null,
      customIcon: BookOpen,
      label: "Bible",
    },
    { href: "https://x.com/Vamsikrishna99C", icon: faXTwitter, label: "X" },
    {
      href: "https://www.linkedin.com/in/vamsikrishnachandaluri/",
      icon: faLinkedin,
      label: "LinkedIn",
    },
    { href: "https://github.com/CVamsi27", icon: faGithub, label: "GitHub" },
    {
      href: "https://mail.google.com/mail/u/0/?fs=1&to=cvamsik99@gmail.com&tf=cm",
      icon: faEnvelope,
      label: "Email",
    },
    {
      href: "https://stackoverflow.com/users/14019992/vamsi-krishna",
      icon: faStackOverflow,
      label: "Stack Overflow",
    },
    {
      href: "https://leetcode.com/u/cvamsik99/",
      icon: null,
      customIcon: null,
      label: "LeetCode",
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {socialMediaLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group relative flex h-9 items-center gap-1.5 rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] px-2.5 text-[var(--portfolio-muted)] shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)] hover:shadow-md",
            itemClassName,
          )}
          aria-label={link.label}
        >
          {link.icon ? (
            <FontAwesomeIcon icon={link.icon} className="h-3.5 w-3.5 shrink-0" />
          ) : link.customIcon ? (
            <link.customIcon className="h-3.5 w-3.5 shrink-0 text-[var(--portfolio-accent)]" />
          ) : (
            <Code2 className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="max-w-0 overflow-hidden whitespace-nowrap font-utility text-[0.62rem] font-semibold tracking-wide transition-all duration-200 group-hover:max-w-[5rem]">
            {link.label}
          </span>
        </a>
      ))}
    </div>
  );
};

export default Connections;

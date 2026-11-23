import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faStackOverflow,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { Code2 } from "lucide-react";

import { cn } from "@/lib/utils";

const Connections = ({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) => {
  const socialMediaLinks = [
    { href: "https://github.com/CVamsi27", icon: faGithub, label: "GitHub" },
    {
      href: "https://www.linkedin.com/in/vamsikrishnachandaluri/",
      icon: faLinkedin,
      label: "LinkedIn",
    },
    { href: "https://x.com/Vamsikrishna99C", icon: faXTwitter, label: "X" },
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
      label: "LeetCode",
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {socialMediaLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group relative flex h-9 items-center gap-1.5 rounded-full border border-[var(--portfolio-rule)] bg-transparent px-3 text-[var(--portfolio-muted)] transition-colors duration-150 hover:border-[var(--portfolio-ink)] hover:text-[var(--portfolio-ink)]",
            itemClassName,
          )}
          aria-label={link.label}
        >
          {link.icon ? (
            <FontAwesomeIcon icon={link.icon} className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Code2 className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="max-w-0 overflow-hidden whitespace-nowrap font-sans text-xs font-medium transition-all duration-200 group-hover:max-w-[5.5rem]">
            {link.label}
          </span>
        </a>
      ))}
    </div>
  );
};

export default Connections;

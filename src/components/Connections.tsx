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
      label: "StackOverflow",
    },
    {
      href: "https://leetcode.com/u/cvamsik99/",
      icon: null,
      label: "LeetCode",
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {socialMediaLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--portfolio-rule)] bg-[var(--portfolio-paper)] text-[var(--portfolio-muted)] shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--portfolio-accent)] hover:bg-[var(--portfolio-blue-soft)] hover:text-[var(--portfolio-accent)] hover:shadow-xs",
            itemClassName,
          )}
          title={link.label}
          aria-label={link.label}
        >
          {link.icon ? (
            <FontAwesomeIcon icon={link.icon} className="h-3.5 w-3.5" />
          ) : (
            <Code2 className="h-3.5 w-3.5" />
          )}
        </a>
      ))}
    </div>
  );
};

export default Connections;

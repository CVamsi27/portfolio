import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faStackOverflow,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { Code2 } from "lucide-react";

const Connections = () => {
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
    <div className="flex items-center gap-3">
      {socialMediaLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent hover:border-accent-foreground/10 transition-all"
          title={link.label}
        >
          {link.icon ? (
            <FontAwesomeIcon icon={link.icon} className="h-4 w-4" />
          ) : (
            <Code2 className="h-4 w-4" />
          )}
        </a>
      ))}
    </div>
  );
};

export default Connections;

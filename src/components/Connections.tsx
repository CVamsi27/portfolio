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
    { href: "https://x.com/Vamsikrishna99C", icon: faXTwitter },
    {
      href: "https://www.linkedin.com/in/vamsikrishnachandaluri/",
      icon: faLinkedin,
    },
    { href: "https://github.com/CVamsi27", icon: faGithub },
    {
      href: "https://mail.google.com/mail/u/0/?fs=1&to=cvamsik99@gmail.com&tf=cm",
      icon: faEnvelope,
    },
    {
      href: "https://stackoverflow.com/users/14019992/vamsi-krishna",
      icon: faStackOverflow,
    },
    {
      href: "https://leetcode.com/u/cvamsik99/",
      icon: null,
      label: "LeetCode",
    },
  ];

  return (
    <div className="flex justify-center items-center gap-2 md:gap-10 w-full h-full flex-wrap">
      {socialMediaLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-white w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-border to-border/80 hover:from-primary hover:to-purple-600 rounded-full p-2 mx-2 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 shadow-md hover:shadow-xl animate-scale-in"
          style={{ animationDelay: `${index * 0.1}s` }}
          title={link.label}
        >
          {link.icon ? (
            <FontAwesomeIcon icon={link.icon} size="lg" />
          ) : (
            <Code2 size={20} />
          )}
        </a>
      ))}
    </div>
  );
};
export default Connections;

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faLinkedin,
  faStackOverflow,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";

const Connections = () => {
  const socialMediaLinks = [
    { href: "https://github.com/CVamsi27", icon: faGithub },
    {
      href: "https://www.linkedin.com/in/vamsikrishnachandaluri/",
      icon: faLinkedin,
    },
    {
      href: "https://mail.google.com/mail/u/0/?fs=1&to=cvamsik99@gmail.com&tf=cm",
      icon: faEnvelope,
    },
    { href: "https://x.com/Vamsikrishna99C", icon: faTwitter },
    {
      href: "https://stackoverflow.com/users/14019992/vamsi-krishna",
      icon: faStackOverflow,
    },
  ];

  return (
    <div className="flex justify-center items-center gap-10 w-full h-full mt-6">
      {socialMediaLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary w-6 md:w-8 h-6 md:h-8"
        >
          <FontAwesomeIcon icon={link.icon} size="lg" />
        </a>
      ))}
    </div>
  );
};
export default Connections;
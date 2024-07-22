import {
  FormDetails,
  PersonalDetails,
  Projects,
  Skills,
  WorkExperience,
} from "@/types";
import { AtSign, MapPin, Phone } from "lucide-react";
import azure from "../../public/azure.svg";
import csharp from "../../public/csharp.svg";
import css from "../../public/css.svg";
import git from "../../public/git.svg";
import html from "../../public/html.svg";
import java from "../../public/java.svg";
import javascript from "../../public/javascript.svg";
import mongoBD from "../../public/mongoDB.svg";
import mysql from "../../public/mysql.svg";
import nextJS from "../../public/nextJS.svg";
import postgresql from "../../public/postgresql.svg";
import python from "../../public/python.svg";
import react from "../../public/react.svg";
import typescript from "../../public/typescript.svg";

export const MENU_LIST = [
  "About",
  "Experience",
  "Projects",
  "Skills",
  "Contact",
];

export const WORK_EXPERIENCE: WorkExperience[] = [
  {
    title: "Software Engineer 2",
    description: "Front End Developer",
    duration: "March 2024 - Present",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
  },
  {
    title: "Software Engineer 1",
    description: "Front End Developer",
    duration: "October 2021 - February 2024",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
  },
  {
    title: "Programmer Analyst Trainee",
    description: "Full-Stack Developer",
    duration: "February 2021 - September 2021",
    company: "Cognizant",
    URL: "https://www.cognizant.com/in/en",
  },
];

export const PROJECTS: Projects[] = [
  {
    title: "Digital Library",
    description: "A place to purchase books",
    gitLink: "https://github.com/CVamsi27/digital-library",
    URL: "https://digital-library-web.vercel.app",
  },
  {
    title: "Task Manager",
    description: "A place to manage your tasks",
    gitLink: "https://github.com/CVamsi27/task-manager-1",
    URL: "https://task-manager-rosy-eight.vercel.app",
  },
  {
    title: "Portfolio",
    description: "A place to learn about Vamsi Krishna",
    gitLink: "https://github.com/CVamsi27/portfolio",
    URL: "https://vamsi-krishna-portfolio.vercel.app",
  },
];

export const FORM_DETAILS: FormDetails[] = [
  {
    name: "name",
    label: "Your Name:",
  },
  {
    name: "email",
    label: "Your Email:",
  },
  {
    name: "message",
    label: "Your Message:",
  },
];

export const PERSONAL_DETAILS: PersonalDetails[] = [
  {
    icon: AtSign,
    value: "cvamsik99@gmail.com",
  },
  {
    icon: Phone,
    value: "+91 7702148303",
  },
  {
    icon: MapPin,
    value: "Hyderabad, Telangana, India",
  },
];

export const SKILLS: Skills[] = [
  {
    img: html,
    alt: "HTML",
  },
  {
    img: css,
    alt: "CSS",
  },
  {
    img: react,
    alt: "React",
  },
  {
    img: javascript,
    alt: "Javascript",
  },
  {
    img: typescript,
    alt: "Typescript",
  },
  {
    img: git,
    alt: "Git",
  },
  {
    img: nextJS,
    alt: "NextJS",
  },
  {
    img: java,
    alt: "Java",
  },
  {
    img: csharp,
    alt: "C#",
  },
  {
    img: python,
    alt: "Python",
  },
  {
    img: mongoBD,
    alt: "MongoBD",
  },
  {
    img: mysql,
    alt: "Mysql",
  },
  {
    img: postgresql,
    alt: "Postgresql",
  },
  {
    img: azure,
    alt: "Azure",
  },
];

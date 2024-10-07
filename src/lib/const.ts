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
    description: "Full Stack Developer",
    duration: "March 2024 - Present",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
  },
  {
    title: "Software Engineer 1",
    description: "Full Stack Developer",
    duration: "October 2021 - February 2024",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
  },
  {
    title: "Programmer Analyst Trainee",
    description: "Full Stack Developer",
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

export const VAMSI = [
  { word: "Vamsi", language: "English" },
  { word: "వంశీ", language: "Telugu" },
  { word: "वंशी", language: "Hindi" },
  { word: "வம்சி", language: "Tamil" },
  { word: "ਵੰਸ਼ੀ", language: "Punjabi" },
  { word: "वामसी", language: "Marathi" },
  { word: "વંશી", language: "Gujarati" },
  { word: "فامسي", language: "Arabic" },
  { word: "วามสี", language: "Thai" },
  { word: "វម្សី", language: "Khmer" },
  { word: "ဗမ္ဆီ", language: "Burmese" },
  { word: "Вамси", language: "Russian" },
  { word: "ቫምሲ", language: "Amharic" },
  { word: "वम्सी", language: "Nepali" },
  { word: "วำซี", language: "Lao" },
  { word: "वंसी", language: "Sinhala" },
  { word: "ヴァムシ", language: "Japanese" },
  { word: "범시", language: "Korean" },
  { word: "ཝམ་སི།", language: "Tibetan" },
  { word: "Вамсі", language: "Ukrainian" },
];

export const KRISHNA = [
  { word: "Krishna", language: "English" },
  { word: "కృష్ణ", language: "Telugu" },
  { word: "कृष्ण", language: "Hindi" },
  { word: "கிருஷ்ணா", language: "Tamil" },
  { word: "ਕ੍ਰਿਸ਼ਨਾ", language: "Punjabi" },
  { word: "कृष्ण", language: "Marathi" },
  { word: "કૃષ્ણ", language: "Gujarati" },
  { word: "كرشنا", language: "Arabic" },
  { word: "กฤษณะ", language: "Thai" },
  { word: "ក្រឹស្នា", language: "Khmer" },
  { word: "ကရိစန", language: "Burmese" },
  { word: "Кришна", language: "Russian" },
  { word: "ክርሽና", language: "Amharic" },
  { word: "कृष्ण", language: "Nepali" },
  { word: "ກຣິສ", language: "Lao" },
  { word: "ක්‍රිෂ්ණ", language: "Sinhala" },
  { word: "クリシュナ", language: "Japanese" },
  { word: "크리슈나", language: "Korean" },
  { word: "ཀེ་རི་སྭྲ་ནི", language: "Tibetan" },
  { word: "Кришна", language: "Ukrainian" },
];

export const CHANDALURI = [
  { word: "Chandaluri", language: "English" },
  { word: "చందాలూరి", language: "Telugu" },
  { word: "चंडालुरी", language: "Hindi" },
  { word: "சண்டாலுரி", language: "Tamil" },
  { word: "ਚੰਡਾਲੁਰੀ", language: "Punjabi" },
  { word: "चंडालुरी", language: "Marathi" },
  { word: "ચંડાલુરી", language: "Gujarati" },
  { word: "شاندالوري", language: "Arabic" },
  { word: "ชานดาลูรี", language: "Thai" },
  { word: "ចនដាលុរី", language: "Khmer" },
  { word: "ချန်ဒလူရီ", language: "Burmese" },
  { word: "Чандалури", language: "Russian" },
  { word: "ቻንዳሉሪ", language: "Amharic" },
  { word: "चंडालुरी", language: "Nepali" },
  { word: "ຈານດາລູຣ", language: "Lao" },
  { word: "චන්ඩාලුරි", language: "Sinhala" },
  { word: "チャンダルリ", language: "Japanese" },
  { word: "찬달루리", language: "Korean" },
  { word: "ཅན་དཱ་ལུ་རི།", language: "Tibetan" },
  { word: "Чандалурі", language: "Ukrainian" },
];

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
    title: "Senior Software Engineer",
    description: "Full Stack Developer & Team Lead",
    tech: "React, TypeScript, CSS, Tailwind, C#, .NET, Azure SQL, Azure DevOps",
    duration: "Apr 2025 - Jul 2025",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
    details: [
      "Managed and mentored a team of four engineers, delegating tasks, conducting code reviews, and improving sprint delivery predictability by 20%",
      "Led system design and planning for recruitment modules, improving scalability and reducing development time by 25%",
      "Architected and developed REST APIs using .NET (C#) with MVC principles, optimizing Azure SQL stored procedures to enhance query efficiency by 30%",
      "Drove frontend standards by enforcing TypeScript interfaces, reusable components, and CSS/Tailwind conventions, reducing UI defects by 20%",
      "Established testing and CI/CD workflows with Jest, Postman, and Azure DevOps, ensuring regression-free releases and maintaining 85% test coverage"
    ]
  },
  {
    title: "Software Engineer",
    description: "Full Stack Developer",
    tech: "React, TypeScript, CSS, C#, .NET, Azure SQL",
    duration: "Oct 2021 - Mar 2025",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
    details: [
      "Designed and implemented responsive front-end features using React, TypeScript, and CSS, improving user satisfaction and load performance by 30%",
      "Developed backend services and RESTful APIs in .NET (C#) using MVC architecture, integrated with Azure SQL, reducing data retrieval latency by 25%",
      "Participated in system design and database schema creation, optimizing table structures and stored procedures to boost query performance by 20%",
      "Implemented robust error handling, logging, and validation mechanisms, reducing production incidents by 15% and improving maintainability"
    ]
  },
  {
    title: "Programmer Analyst Trainee",
    description: "Full Stack Developer",
    tech: "Java, Spring Boot, Zuul Gateway, H2 Database, HTML, CSS, JavaScript",
    duration: "Feb 2021 - Oct 2021",
    company: "Cognizant",
    URL: "https://www.cognizant.com/in/en",
    details: [
      "Developed a microservices-based web application using Java (Spring Boot, Zuul Gateway) and H2 Database to enhance modularity and maintainability",
      "Implemented RESTful APIs with MVC architecture, improving backend consistency and reducing code redundancy",
      "Built responsive front-end interfaces using HTML, CSS, and JavaScript, optimizing load time by 15%"
    ]
  },
];

export const PROJECTS: Projects[] = [
  {
    title: "TeamOps",
    description: "Real-time collaboration platform enabling team task management using WebSockets and microservice architecture",
    tech: "Next.js 15, NestJS, TypeScript, PostgreSQL, Prisma ORM",
    gitLink: "https://github.com/CVamsi27/teamops",
    URL: "https://teamops.buildora.work/",
  },
  {
    title: "Super Tic Tac Toe",
    description: "Advanced version of classic Tic Tac Toe with strategic gameplay",
    tech: "React, Next.js, TypeScript, Tailwind CSS",
    gitLink: "https://github.com/CVamsi27/super-tic-tac-toe",
    URL: "https://super-tic-tac-toe.buildora.work/",
  },
  {
    title: "Digital Library",
    description: "A place to purchase books",
    tech: "React, Next.JS, TypeScript, Tailwind, tRPC, Zod, Prisma ORM",
    gitLink: "https://github.com/CVamsi27/digital-library",
    URL: "https://digital-library.buildora.work/",
  },
  {
    title: "Task Manager",
    description: "A place to manage your tasks",
    tech: "React, Next.JS, TypeScript, Tailwind, Zod, Prisma ORM",
    gitLink: "https://github.com/CVamsi27/task-manager-1",
    URL: "https://task-manager.buildora.work/",
  },
  {
    title: "Portfolio",
    description: "A place to learn about Vamsi Krishna",
    tech: "React, Next.JS, TypeScript, Tailwind",
    gitLink: "https://github.com/CVamsi27/portfolio",
    URL: "https://portfolio.buildora.work/",
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

// Multilingual name translations - more maintainable approach
export const NAME_TRANSLATIONS = [
  { vamsi: "Vamsi", krishna: "Krishna", chandaluri: "Chandaluri", language: "English" },
  { vamsi: "వంశీ", krishna: "కృష్ణ", chandaluri: "చందాలూరి", language: "Telugu" },
  { vamsi: "वंशी", krishna: "कृष्ण", chandaluri: "चंडालुरी", language: "Hindi" },
  { vamsi: "வம்சி", krishna: "கிருஷ்ணா", chandaluri: "சண்டாலுரி", language: "Tamil" },
  { vamsi: "ਵੰਸ਼ੀ", krishna: "ਕ੍ਰਿਸ਼ਨਾ", chandaluri: "ਚੰਡਾਲੁਰੀ", language: "Punjabi" },
  { vamsi: "वामसी", krishna: "कृष्ण", chandaluri: "चंडालुरी", language: "Marathi" },
  { vamsi: "વંશી", krishna: "કૃષ્ણ", chandaluri: "ચંડાલુરી", language: "Gujarati" },
  { vamsi: "ವಂಶಿ", krishna: "ಕೃಷ್ಣ", chandaluri: "ಚಂಡಾಲೂರಿ", language: "Kannada" },
  { vamsi: "വംശി", krishna: "കൃഷ്ണ", chandaluri: "ചണ്ഡാലൂരി", language: "Malayalam" },
  { vamsi: "ବଂଶୀ", krishna: "କୃଷ୍ଣ", chandaluri: "ଚାଣ୍ଡାଲୁରୀ", language: "Odia" },
  { vamsi: "বংশী", krishna: "কৃষ্ণ", chandaluri: "চণ্ডালুরী", language: "Bengali" },
  { vamsi: "فامسي", krishna: "كرشنا", chandaluri: "شاندالوري", language: "Arabic" },
  { vamsi: "วามสี", krishna: "กฤษณะ", chandaluri: "ชานดาลูรี", language: "Thai" },
  { vamsi: "វម្សី", krishna: "ក្រឹស្នា", chandaluri: "ចនដាលុរី", language: "Khmer" },
  { vamsi: "ဗမ္ဆီ", krishna: "ကရိစန", chandaluri: "ချန်ဒလူရီ", language: "Burmese" },
  { vamsi: "Вамси", krishna: "Кришна", chandaluri: "Чандалури", language: "Russian" },
  { vamsi: "ቫምሲ", krishna: "ክርሽና", chandaluri: "ቻንዳሉሪ", language: "Amharic" },
  { vamsi: "वम्सी", krishna: "कृष्ण", chandaluri: "चंडालुरी", language: "Nepali" },
  { vamsi: "วำซี", krishna: "ກຣິສ", chandaluri: "ຈານດາລູຣ", language: "Lao" },
  { vamsi: "වංසි", krishna: "ක්‍රිෂ්ණ", chandaluri: "චන්ඩාලුරි", language: "Sinhala" },
  { vamsi: "ヴァムシ", krishna: "クリシュナ", chandaluri: "チャンダルリ", language: "Japanese" },
  { vamsi: "범시", krishna: "크리슈나", chandaluri: "찬달루리", language: "Korean" },
  { vamsi: "瓦姆西", krishna: "克里希纳", chandaluri: "钱达卢里", language: "Chinese (Simplified)" },
  { vamsi: "瓦姆西", krishna: "克里希納", chandaluri: "錢達盧里", language: "Chinese (Traditional)" },
  { vamsi: "ཝམ་སི།", krishna: "ཀེ་རི་སྭྲ་ནི", chandaluri: "ཅན་དཱ་ལུ་རི།", language: "Tibetan" },
  { vamsi: "Вамсі", krishna: "Кришна", chandaluri: "Чандалурі", language: "Ukrainian" },
  { vamsi: "Vamsi", krishna: "Krishna", chandaluri: "Chandaluri", language: "Spanish" },
  { vamsi: "Vamsi", krishna: "Krishna", chandaluri: "Chandaluri", language: "French" },
  { vamsi: "Vamsi", krishna: "Krishna", chandaluri: "Chandaluri", language: "German" },
  { vamsi: "Vamsi", krishna: "Krishna", chandaluri: "Chandaluri", language: "Portuguese" },
  { vamsi: "Vamsi", krishna: "Krishna", chandaluri: "Chandaluri", language: "Italian" },
  { vamsi: "Βάμσι", krishna: "Κρίσνα", chandaluri: "Τσαντάλουρι", language: "Greek" },
  { vamsi: "ვამსი", krishna: "კრიშნა", chandaluri: "ჩანდალური", language: "Georgian" },
  { vamsi: "Վամսի", krishna: "Կրիշնա", chandaluri: "Չանդալուրի", language: "Armenian" },
  { vamsi: "וואמסי", krishna: "קרישנה", chandaluri: "צ'אנדלורי", language: "Hebrew" },
  { vamsi: "وامسی", krishna: "کریشنا", chandaluri: "چاندالوری", language: "Persian" },
  { vamsi: "وامسی", krishna: "کرشنا", chandaluri: "چانڈالوری", language: "Urdu" },
  { vamsi: "Вамси", krishna: "Кришна", chandaluri: "Чандалури", language: "Bulgarian" },
  { vamsi: "Vamsi", krishna: "Krišna", chandaluri: "Čandaluri", language: "Czech" },
  { vamsi: "Vamsi", krishna: "Kryszna", chandaluri: "Czandaluri", language: "Polish" },
];

// Helper functions to extract individual name parts for backward compatibility
export const VAMSI = NAME_TRANSLATIONS.map(({ vamsi, language }) => ({ 
  word: vamsi, 
  language 
}));

export const KRISHNA = NAME_TRANSLATIONS.map(({ krishna, language }) => ({ 
  word: krishna, 
  language 
}));

export const CHANDALURI = NAME_TRANSLATIONS.map(({ chandaluri, language}) => ({ 
  word: chandaluri, 
  language 
}));
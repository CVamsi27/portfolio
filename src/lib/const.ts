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
    title: "Founder / Full Stack Developer",
    description: "Healthcare SaaS Platform",
    tech: "React, Next.js 15, NestJS, TypeScript, PostgreSQL, Prisma ORM, Node.js, Express",
    duration: "Aug 2025 - Present",
    company: "Docita",
    URL: "https://docita.work",
    details: [
      "Founded and engineered a production healthcare SaaS for Indian clinics covering patient records, OPD queue, consultations, digital prescriptions, billing, and follow-ups",
      "Designed paper-to-cloud migration flows for Excel/CSV imports, duplicate review, document archival, OCR-assisted intake, and visit-based patient timelines",
      "Built multi-tenant workspace architecture with RBAC for receptionists, doctors, and admins, plus audit trails for sensitive healthcare and billing actions",
      "Delivered React/Next.js 15 workflows for check-in, patient history, prescription PDFs, invoices, queue management, admin reporting, and clinic operations",
      "Implemented Node.js, Express, NestJS, PostgreSQL, and Prisma services with migrations, validation, query tuning, indexes, caching, and connection pooling",
      "Integrated JWT auth, subscriptions, email automation, WhatsApp reminders/prescription sharing, structured logging, monitoring, and production deployment practices"
    ]
  },
  {
    title: "Senior Software Engineer / Software Engineer",
    description: "Full Stack Developer & Team Lead",
    tech: "React, TypeScript, Tailwind CSS, Node.js, Express, PostgreSQL, C#, .NET, Azure DevOps",
    duration: "Oct 2021 - Jul 2025",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
    details: [
      "Led architecture improvements for recruitment and internal workflow modules, reducing delivery time by 25% through reusable TypeScript patterns and cleaner service boundaries",
      "Designed and optimized Node.js/Express REST APIs with PostgreSQL, improving response times by 30% through query tuning, caching, and reduced N+1 access patterns",
      "Built reusable React and TypeScript component libraries, reducing UI duplication by 20% and improving consistency across product surfaces",
      "Improved frontend performance and accessibility for responsive React interfaces, reducing load times by 30% on high-traffic workflows",
      "Implemented CI/CD pipelines, automated tests, structured error handling, and release checks that maintained 85%+ coverage and reduced production incidents by 15%",
      "Mentored four engineers through code reviews, system design discussions, debugging sessions, and production-readiness practices, improving sprint predictability by 20%",
      "Strengthened observability with structured logging, failure monitoring, and incident triage workflows that reduced diagnosis time for production issues"
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
      "Built Java Spring Boot microservices with Zuul Gateway and H2 Database, improving modularity for backend training projects",
      "Designed REST endpoints using MVC patterns and documented request/response contracts for maintainable service integration",
      "Developed responsive web pages with HTML, CSS, and JavaScript while strengthening fundamentals in debugging and delivery"
    ]
  },
];

export const PROJECTS: Projects[] = [
  {
    title: "Docita",
    description: "Production healthcare SaaS for Indian clinics — patient records, OPD queue, consultations, prescriptions, billing, and follow-ups",
    tech: "Next.js 15, NestJS, TypeScript, PostgreSQL, Prisma ORM, Node.js, Express",
    gitLink: "",
    URL: "https://docita.work",
  },
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
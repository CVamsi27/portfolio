import {
  FormDetails,
  PersonalDetails,
  Projects,
  Skills,
  WorkExperience,
} from "@/types";
import { AtSign, Globe, MapPin, Phone } from "lucide-react";
import git from "../../public/git.svg";
import html from "../../public/html.svg";
import css from "../../public/css.svg";
import java from "../../public/java.svg";
import javascript from "../../public/javascript.svg";
import nextJS from "../../public/nextJS.svg";
import postgresql from "../../public/postgresql.svg";
import python from "../../public/python.svg";
import react from "../../public/react.svg";
import typescript from "../../public/typescript.svg";

export const MENU_LIST = [
  "Work",
  "Experience",
  "Capabilities",
  "Contact",
];

export const WORK_EXPERIENCE: WorkExperience[] = [
  {
    title: "Full Stack Engineer",
    description: "Healthcare SaaS",
    tech: "React, Vite, TanStack Query, Zod, NestJS, Prisma, PostgreSQL, TypeScript, Jest, Vitest, Playwright, GitHub Actions, Docker",
    duration: "Aug 2025 - Present",
    company: "Docita",
    URL: "https://docita.work",
    details: [
      "Own end-to-end delivery of a multi-tenant healthcare platform serving 25+ clinics and 1,000+ appointment workflows per month, covering scheduling, records, prescriptions, billing, and inventory",
      "Design maintainable NestJS, Prisma, and PostgreSQL APIs and data models using tenant-scoped queries, migrations, indexes, pagination, and transactional writes",
      "Make sensitive clinical workflows trustworthy through request-scoped tenancy, PostgreSQL Row-Level Security, deny-by-default ABAC, encryption, audit trails, and PHI-safe error handling",
      "Engineer resilient notifications, documents, payments, and partner integrations with PostgreSQL queues, transactional outbox, idempotency, retries, dead-letter replay, advisory locks, and verified webhooks",
      "Build accessible React/Vite product experiences with TanStack Query and shared Zod schemas; enforce release confidence with Jest, Vitest, Playwright, GitHub Actions, Docker, and database snapshots",
      "Ship controlled AI-assisted capabilities with validated outputs, usage quotas, timeouts, and environment-aware controls"
    ]
  },
  {
    title: "Senior Software Engineer / Software Engineer",
    description: "Full Stack Developer",
    tech: "TypeScript, React, Node.js, Express, NestJS, PostgreSQL, GitHub Actions, Jest",
    duration: "Oct 2021 - Jul 2025",
    company: "MAQ Software",
    URL: "https://maqsoftware.com",
    details: [
      "Reduced delivery time for recruitment and internal-workflow modules by 25% through shared TypeScript service patterns, input validation, pagination, and clear module boundaries",
      "Cut REST API p95 latency by 30% across Node.js, Express, NestJS, and PostgreSQL services by profiling slow paths, tuning queries and indexes, adding targeted caching, and removing N+1 access patterns",
      "Built a reusable React and TypeScript component library that reduced duplicated UI and made loading, validation, keyboard, and screen-reader behavior more consistent",
      "Improved release quality with GitHub Actions, Jest, release checks, and code review while sustaining 85%+ test coverage; mentored four engineers through design reviews and pairing"
    ]
  },
  {
    title: "Programmer Analyst Trainee",
    description: "Full Stack Developer",
    tech: "Java, Spring Boot, Eureka, Zuul Gateway, JWT, JPA/JDBC, Swagger/OpenAPI",
    duration: "Feb 2021 - Oct 2021",
    company: "Cognizant",
    URL: "https://www.cognizant.com/in/en",
    details: [
      "Built 4 Spring Boot microservices for product, vendor, retail-shop, and checkout workflows in an e-commerce platform",
      "Implemented Eureka service discovery, Zuul gateway routing, JWT authorization, REST APIs, Swagger/OpenAPI documentation, and JPA/JDBC persistence"
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
    value: "Hyderabad, India",
  },
  {
    icon: Globe,
    value: "https://buildora.work",
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
    img: python,
    alt: "Python",
  },
  {
    img: postgresql,
    alt: "Postgresql",
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

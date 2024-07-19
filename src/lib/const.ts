import { FormDetails, PersonalDetails, Projects, WorkExperience } from "@/types"
import { AtSign, MapPin, Phone } from "lucide-react";

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
        company: "MAQ Software"
    },
    {
        title: "Software Engineer 1",
        description: "Front End Developer",
        duration: "October 2021 - February 2024",
        company: "MAQ Software"
    },
    {
        title: "Programmer Analyst Trainee",
        description: "Full-Stack Developer",
        duration: "February 2021 - September 2021",
        company: "Cognizant"
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
        URL: "",
    },
];

export const FORM_DETAILS: FormDetails[] = [
    {
        name: "name",
        label: "Your Name:"
    },
    {
        name: "email",
        label: "Your Email:"
    },
    {
        name: "message",
        label: "Your Message:"
    },
];

export const PERSONAL_DETAILS: PersonalDetails[] = [
    {
        icon: AtSign,
        value: "cvamsik99@gmail.com"
    },
    {
        icon: Phone,
        value: "+91 7702148303"
    },
    {
        icon: MapPin,
        value: "Hyderabad, Telangana, India"
    },
]
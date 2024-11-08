import { StaticImageData } from "next/image";

export interface WorkExperience {
  title: string;
  description: string;
  tech: string;
  duration: string;
  company: string;
  URL: string;
}

export interface Projects {
  title: string;
  description: string;
  tech: string;
  gitLink: string;
  URL: string;
}

type FormFieldName = "name" | "email" | "message";

export interface FormDetails {
  name: FormFieldName;
  label: string;
}

export interface PersonalDetails {
  icon: React.FC;
  value: string;
}

export interface Skills {
  img: StaticImageData;
  alt: string;
}

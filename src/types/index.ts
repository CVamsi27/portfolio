export interface WorkExperience {
    title: string,
    description: string,
    duration: string,
    company: string,
}

export interface Projects {
    title: string,
    description: string,
    gitLink: string,
    URL: string,
}

type FormFieldName = "name" | "email" | "message";

export interface FormDetails {
    name: FormFieldName,
    label: string,
}

export interface PersonalDetails {
    icon: React.FC,
    value: string
}
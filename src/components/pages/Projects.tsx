"use client";
import { PROJECTS } from "@/lib/const";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { MoveUpRight } from "lucide-react";
import Link from "next/link";

const Projects = () => {
  return (
    <section
      id="Projects"
      className="w-full flex flex-col gap-10 justify-center pt-20"
    >
      <span className="text-3xl md:text-5xl font-semibold text-center">
        Projects
      </span>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div></div>
        <div className="gap-6 grid grid-cols-1 m-14">
          {PROJECTS.map((value, index) => (
            <Card key={index} className="text-center border-0 bg-card">
              <CardHeader>
                <CardTitle className="text-primary">{value.title}</CardTitle>
                <CardDescription className="text-foreground">
                  {value.description}
                </CardDescription>
              </CardHeader>
              {/* <CardContent>
                <span className="text-2xl">{value.description}</span>
              </CardContent> */}
              <CardFooter className="flex justify-between mx-1">
                <a
                  href={value.gitLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary w-10 h-10 bg-border rounded-lg p-2 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faGithub} size="lg" />
                </a>
                <a
                  href={value.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary w-10 h-10 bg-border rounded-lg p-2 flex items-center justify-center"
                >
                  <MoveUpRight />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Projects;

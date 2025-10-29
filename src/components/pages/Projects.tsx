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
import { ExternalLink } from "lucide-react";

const Projects = () => {
  return (
    <section
      id="Projects"
      className="min-h-screen w-full flex flex-col gap-6 md:gap-10 justify-center px-4 md:px-8 py-12 md:py-20 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400/10 dark:bg-purple-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-400/10 dark:bg-pink-400/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 animate-fade-in">
          <span className="gradient-text">Featured Projects</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {PROJECTS.map((value, index) => (
            <Card 
              key={index} 
              className="border-2 border-border bg-card/80 backdrop-blur-sm hover:border-primary hover:shadow-xl transition-all duration-300 flex flex-col hover-lift animate-scale-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-xl md:text-2xl text-primary group-hover:gradient-text transition-all duration-300">
                  {value.title}
                </CardTitle>
                <CardDescription className="text-foreground text-sm md:text-base mt-2">
                  {value.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="grow">
                <div className="flex flex-wrap gap-2">
                  {value.tech.split(", ").map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 md:px-3 py-1 bg-linear-to-r from-accent to-accent/80 text-accent-foreground rounded-md text-xs md:text-sm font-medium hover:scale-105 transition-transform duration-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-3">
                <a
                  href={value.gitLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium transition-all w-full sm:w-auto hover:scale-105"
                >
                  <FontAwesomeIcon icon={faGithub} size="lg" />
                  <span className="text-sm md:text-base">View Code</span>
                </a>
                <a
                  href={value.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all w-full sm:w-auto text-sm md:text-base hover:scale-105 shadow-md hover:shadow-lg"
                >
                  <span>Live Demo</span>
                  <ExternalLink size={16} />
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

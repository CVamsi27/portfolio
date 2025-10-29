"use client";
import { WORK_EXPERIENCE } from "@/lib/const";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import Link from "next/link";

const Experience = () => {
  return (
    <section
      id="Experience"
      className="min-h-screen w-full flex flex-col gap-6 md:gap-10 justify-center px-4 md:px-8 py-12 md:py-20 relative overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 dark:bg-primary/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 md:mb-12 animate-fade-in">
          <span className="gradient-text">Work Experience</span>
        </h2>
        <div className="space-y-4 md:space-y-6">
          {WORK_EXPERIENCE.map((value, index) => (
            <Link
              key={index}
              href={value.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block group animate-slide-in-left"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <Card className="border-2 border-border bg-card/80 backdrop-blur-sm hover:border-primary hover:shadow-xl transition-all duration-300 hover-lift">
                <CardHeader className="pb-3 md:pb-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-xl md:text-2xl text-primary group-hover:gradient-text transition-all duration-300 mb-1">
                          {value.title}
                        </CardTitle>
                        <p className="text-lg md:text-xl font-semibold text-foreground">
                          {value.company}
                        </p>
                      </div>
                      <span className="text-sm md:text-base text-muted-foreground font-medium px-3 py-1 bg-secondary/50 rounded-full">
                        {value.duration}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 md:gap-4 pt-0">
                  {value.details && value.details.length > 0 && (
                    <ul className="list-disc list-inside space-y-1.5 md:space-y-2 text-foreground">
                      {value.details.map((detail, idx) => (
                        <li key={idx} className="text-sm md:text-base leading-relaxed">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {value.tech.split(", ").map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 md:px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs md:text-sm font-medium hover:scale-105 hover:bg-primary/10 transition-all duration-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;

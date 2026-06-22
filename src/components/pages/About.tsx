"use client";
import Connections from "../Connections";
import { useEffect, useState } from "react";
import { getUniqueLanguageCombination } from "@/lib/utils";

const About = () => {
  const [nameCombination, setNameCombination] = useState({
    vamsi: { word: "Vamsi", language: "English" },
    krishna: { word: "Krishna", language: "English" },
    chandaluri: { word: "Chandaluri", language: "English" },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const { randomVamsi, randomKrishna, randomChandaluri } =
        getUniqueLanguageCombination();
      setNameCombination({
        vamsi: randomVamsi,
        krishna: randomKrishna,
        chandaluri: randomChandaluri,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="About"
      className="min-h-screen flex flex-col justify-center px-6 py-20"
    >
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex flex-col gap-8 text-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground animate-fade-in">
              Hello, I&apos;m
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up">
              <span>{nameCombination.vamsi.word}</span>{" "}
              <span>{nameCombination.krishna.word}</span>{" "}
              <span className="gradient-text">
                {nameCombination.chandaluri.word}
              </span>
            </h1>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-fade-in-delayed">
              <span>{nameCombination.vamsi.language}</span>
              <span className="text-border">/</span>
              <span>{nameCombination.krishna.language}</span>
              <span className="text-border">/</span>
              <span>{nameCombination.chandaluri.language}</span>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium animate-fade-in-delayed-2">
              Full Stack TypeScript Engineer
            </p>
          </div>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-delayed-3">
            Full Stack TypeScript Engineer with 5+ years building SaaS products,
            internal platforms, and production web systems. Strong in React,
            Next.js, Node.js, NestJS, PostgreSQL, Prisma, and CI/CD. Owns
            features end to end — from product workflow design through scalable
            architecture, clean APIs, and polished user experiences.
          </p>

          <div className="flex flex-col items-center gap-6 pt-2 animate-fade-in-delayed-4">
            <Connections />

            <a
              href="/VamsiKrishna_Resume.pdf"
              download="VamsiKrishna_Resume"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Download Resume
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

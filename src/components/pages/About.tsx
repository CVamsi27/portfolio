"use client";
import Connections from "../Connections";
import { useEffect, useState } from "react";
import { getUniqueLanguageCombination } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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
      className="relative min-h-screen flex flex-col justify-center px-6 py-24 overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-primary/10 blur-[120px]"
      />
      <div className="max-w-3xl mx-auto w-full relative">
        <div className="flex flex-col gap-8 text-center">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground animate-fade-in">
              Hello, I&apos;m
            </p>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-slide-up">
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
              Full Stack Engineer · TypeScript · React · Node.js · NestJS ·
              PostgreSQL
            </p>

            <div className="flex justify-center animate-fade-in-delayed-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Open to relocation · Hybrid / On-site / Remote
              </span>
            </div>
          </div>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto animate-fade-in-delayed-3">
            Product-focused Full Stack Engineer with 5+ years of experience
            delivering production web applications with TypeScript, React,
            Node.js, NestJS, and PostgreSQL. Currently leading end-to-end clinic
            workflows at Docita, used by 25+ clinics and supporting 1,000+
            appointments/month — from UX and product needs to APIs, data models,
            tested releases, and cloud delivery.
          </p>

          <div className="flex flex-col items-center gap-6 pt-2 animate-fade-in-delayed-4">
            <Connections />

            <Button asChild variant="outline" className="rounded-full px-6">
              <a
                href="/VamsiKrishna_Resume.pdf"
                download="VamsiKrishna_Resume"
                className="gap-2"
              >
                Download Resume
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
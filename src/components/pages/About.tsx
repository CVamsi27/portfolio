"use client";
import Connections from "../Connections";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Download } from "lucide-react";

const PHRASES = [
  "Full Stack Engineer",
  "TypeScript · React · NestJS · PostgreSQL",
  "Multi-tenant SaaS @ Docita",
  "25+ clinics · 1,000+ appts/mo",
];

const STATS = [
  { value: "5+", label: "Years shipping" },
  { value: "25+", label: "Clinics live" },
  { value: "1k+", label: "Appts / month" },
  { value: "85%+", label: "Test coverage" },
];

const About = () => {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let phrase = 0;
    let char = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = PHRASES[phrase];
      if (!deleting) {
        char += 1;
        setTyped(current.slice(0, char));
        if (char >= current.length) {
          deleting = true;
          timer = setTimeout(tick, 1600);
          return;
        }
        timer = setTimeout(tick, 55);
      } else {
        char -= 1;
        setTyped(current.slice(0, char));
        if (char <= 0) {
          deleting = false;
          phrase = (phrase + 1) % PHRASES.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 28);
      }
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
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
              Vamsi Krishna <span className="gradient-text">Chandaluri</span>
            </h1>

            <div className="flex justify-center animate-fade-in-delayed">
              <div className="w-full max-w-xl rounded-2xl border border-border bg-card/80 px-4 py-3 text-left shadow-xl shadow-primary/10 backdrop-blur">
                <div className="mb-2 flex items-center gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    vamsi@portfolio: ~
                  </span>
                </div>
                <p className="font-mono text-sm sm:text-base" aria-live="polite">
                  <span className="text-emerald-500">$</span>{" "}
                  <span className="text-foreground">{typed}</span>
                  <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-primary" />
                </p>
              </div>
            </div>

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
            delivering business-critical SaaS features end to end with React,
            TypeScript, Node.js, NestJS, and PostgreSQL. Currently building
            multi-tenant healthcare workflows for 25+ clinics and 1,000+
            appointment workflows per month.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto animate-fade-in-delayed-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card/60 px-3 py-3 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <p className="font-display text-2xl font-bold tabular-nums">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

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
      <a
        href="#Experience"
        aria-label="Scroll to experience"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </a>
    </section>
  );
};

export default About;
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
    <section id="About" className="min-h-screen flex flex-col justify-center px-4 md:px-8 py-12 md:py-20 relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/15 dark:bg-primary/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400/15 dark:bg-purple-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400/15 dark:bg-pink-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex flex-col gap-6 md:gap-8 text-center">
          {/* Name Section */}
          <div className="flex flex-col gap-3 md:gap-4">
            <h2 className="text-base md:text-lg lg:text-xl text-primary font-medium animate-fade-in">
              Hi, I'm
            </h2>
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight px-2 animate-slide-up">
                <span className="inline-block relative group">
                  <span className="relative z-10 transition-all duration-300 group-hover:scale-105 inline-block">{nameCombination.vamsi.word}</span>
                  <span className="absolute -bottom-1 left-0 w-full h-2 bg-primary/20 dark:bg-primary/30 group-hover:bg-primary/30 dark:group-hover:bg-primary/40 transition-all duration-300 rounded-sm"></span>
                </span>{" "}
                <span className="inline-block relative group">
                  <span className="relative z-10 transition-all duration-300 group-hover:scale-105 inline-block">{nameCombination.krishna.word}</span>
                  <span className="absolute -bottom-1 left-0 w-full h-2 bg-purple-500/20 dark:bg-purple-500/30 group-hover:bg-purple-500/30 dark:group-hover:bg-purple-500/40 transition-all duration-300 rounded-sm"></span>
                </span>{" "}
                <span className="inline-block relative group">
                  <span className="relative z-10 transition-all duration-300 group-hover:scale-105 inline-block">{nameCombination.chandaluri.word}</span>
                  <span className="absolute -bottom-1 left-0 w-full h-2 bg-pink-500/20 dark:bg-pink-500/30 group-hover:bg-pink-500/30 dark:group-hover:bg-pink-500/40 transition-all duration-300 rounded-sm"></span>
                </span>
              </h1>
              
              {/* Language Indicator Badge */}
              <div className="flex items-center gap-3 md:gap-4 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full border border-border shadow-sm animate-fade-in-delayed hover:shadow-md hover:scale-105 transition-all duration-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">
                    {nameCombination.vamsi.language}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">
                    {nameCombination.krishna.language}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-xs md:text-sm text-muted-foreground font-medium">
                    {nameCombination.chandaluri.language}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium mt-2 animate-fade-in-delayed-2">
              Full Stack Developer | Software Engineer
            </p>
          </div>

          {/* About Section */}
          <div className="flex flex-col gap-4 md:gap-6 mt-4 md:mt-8 max-w-3xl mx-auto animate-fade-in-delayed-3">
            <p className="text-sm sm:text-base md:text-lg text-foreground leading-relaxed px-2">
              Passionate Full Stack Developer with expertise in building modern web applications. 
              I specialize in creating scalable solutions using React, TypeScript, Next.js on the 
              frontend and C#, .NET, Java, Python on the backend. Experienced with databases like 
              PostgreSQL, MongoDB, and MySQL, along with cloud platforms like Azure.
            </p>
          </div>

          {/* Connections */}
          <div className="mt-4 md:mt-8 animate-fade-in-delayed-4">
            <p className="text-base md:text-lg lg:text-xl text-primary font-medium mb-4 md:mb-6">
              Let's Connect
            </p>
            <Connections />
          </div>

          {/* Resume Button */}
          <div className="mt-3 md:mt-4 animate-fade-in-delayed-5">
            <a
              href="/VamsiKrishna_Resume.pdf"
              download="VamsiKrishna_Resume"
              className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-2.5 md:py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
            >
              Download Resume
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;

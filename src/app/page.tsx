import About from "@/components/pages/About";
import Contact from "@/components/pages/Contact";
import Experience from "@/components/pages/Experience";
import Projects from "@/components/pages/Projects";
import Skills from "@/components/pages/Skills";
import React from "react";

export default function Home() {
  return (
    <>
      <About />
      <Experience />
      <Projects />
      <Skills />
      <Contact />
    </>
  );
}

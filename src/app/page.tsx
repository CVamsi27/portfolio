import About from "@/components/pages/About";
import Contact from "@/components/pages/Contact";
import Experience from "@/components/pages/Experience";
import Projects from "@/components/pages/Projects";
import Skills from "@/components/pages/Skills";

export default function Home() {
  return (
    <>
      <About />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <Experience />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <Projects />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <Skills />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <Contact />
    </>
  );
}

import About from "@/components/pages/About";
import Contact from "@/components/pages/Contact";
import Experience from "@/components/pages/Experience";
import Projects from "@/components/pages/Projects";
import Skills from "@/components/pages/Skills";

export default function Home() {
  return (
    <>
      <About />
      <div className="border-t border-border/50" />
      <Experience />
      <div className="border-t border-border/50" />
      <Projects />
      <div className="border-t border-border/50" />
      <Skills />
      <div className="border-t border-border/50" />
      <Contact />
    </>
  );
}

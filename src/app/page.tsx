import About from "@/components/pages/About";
import Contact from "@/components/pages/Contact";
import Experience from "@/components/pages/Experience";
import Projects from "@/components/pages/Projects";
import Skills from "@/components/pages/Skills";
import EditorialFrame from "@/components/editorial/EditorialFrame";

export default function Home() {
  return (
    <EditorialFrame surface="paper" className="min-h-full">
      <div data-public-dossier className="mx-auto w-full max-w-7xl">
      <About />
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <Experience />
      <Projects />
      <Skills />
      <Contact />
      </div>
    </EditorialFrame>
  );
}

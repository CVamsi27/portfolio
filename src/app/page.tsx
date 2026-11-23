import About from "@/components/pages/About";
import Contact from "@/components/pages/Contact";
import Experience from "@/components/pages/Experience";
import Projects from "@/components/pages/Projects";
import Skills from "@/components/pages/Skills";
import ArchitectureShowcase from "@/components/pages/ArchitectureShowcase";
import OpenSource from "@/components/pages/OpenSource";
import Testimonials from "@/components/pages/Testimonials";
import EditorialFrame from "@/components/editorial/EditorialFrame";

export default function Home() {
  return (
    <EditorialFrame surface="paper" className="min-h-full !p-0">
      <div data-public-dossier className="w-full">
        <About />
        <Projects />
        <ArchitectureShowcase />
        <OpenSource />
        <Experience />
        <Skills />
        <Testimonials />
        <Contact />
      </div>
    </EditorialFrame>
  );
}

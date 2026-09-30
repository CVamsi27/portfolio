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
      <div data-public-dossier className="mx-auto w-full max-w-7xl">
        <About />
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--portfolio-accent)]/30 to-transparent" />
        <Projects />
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--portfolio-rule)] to-transparent" />
        <ArchitectureShowcase />
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--portfolio-rule)] to-transparent" />
        <OpenSource />
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--portfolio-rule)] to-transparent" />
        <Experience />
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--portfolio-rule)] to-transparent" />
        <Skills />
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--portfolio-rule)] to-transparent" />
        <Testimonials />
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--portfolio-accent)]/30 to-transparent" />
        <Contact />
      </div>
    </EditorialFrame>
  );
}

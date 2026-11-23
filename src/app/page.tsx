import About from "@/components/pages/About";
import Contact from "@/components/pages/Contact";
import Experience from "@/components/pages/Experience";
import Projects from "@/components/pages/Projects";
import Skills from "@/components/pages/Skills";
import ArchitectureShowcase from "@/components/pages/ArchitectureShowcase";
import OpenSource from "@/components/pages/OpenSource";
import Testimonials from "@/components/pages/Testimonials";
import EditorialFrame from "@/components/editorial/EditorialFrame";

function SectionDivider({ code }: { code: string }) {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex w-full max-w-7xl items-center gap-3 px-5 sm:px-10 lg:px-16"
    >
      <span className="font-mono text-[10px] leading-none text-[var(--portfolio-muted)]/60">
        +
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--portfolio-rule)] via-[var(--portfolio-accent)]/25 to-[var(--portfolio-rule)]" />
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--portfolio-muted)]/70">
        {code}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--portfolio-rule)] via-[var(--portfolio-accent)]/25 to-[var(--portfolio-rule)]" />
      <span className="font-mono text-[10px] leading-none text-[var(--portfolio-muted)]/60">
        +
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <EditorialFrame surface="paper" className="min-h-full !p-0">
      <div data-public-dossier className="w-full">
        <About />
        <div className="mx-auto w-full max-w-7xl">
          <Projects />
          <SectionDivider code="SYS · 02" />
          <ArchitectureShowcase />
          <SectionDivider code="LAB · 03" />
          <OpenSource />
          <SectionDivider code="LOG · 04" />
          <Experience />
          <SectionDivider code="STK · 05" />
          <Skills />
          <SectionDivider code="INV · 06" />
          <Testimonials />
          <SectionDivider code="MSG · 07" />
          <Contact />
        </div>
      </div>
    </EditorialFrame>
  );
}

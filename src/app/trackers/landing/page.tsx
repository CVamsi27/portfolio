import Link from "next/link";
import { ArrowUpRight, Check, Compass, Flame, Flag, Timer } from "lucide-react";
import EditorialFrame from "@/components/editorial/EditorialFrame";
import ChapterLabel from "@/components/editorial/ChapterLabel";
import NovaMark from "@/components/brand/NovaMark";
import { TRACKER_BRAND } from "@/lib/brand";

const FEATURES = [
  { icon: Flag, label: "Goals", description: "Turn a clear outcome into visible daily progress." },
  { icon: Timer, label: "Meal windows", description: "Log first and last meals and see the fast you actually kept." },
  { icon: Compass, label: "Routines", description: "Keep workouts, tasks, focus, and reflections in one rhythm." },
  { icon: Flame, label: "Motivation", description: "Step into a full-screen focus scene when the next move needs energy." },
];

export default function TrackerLandingPage() {
  return (
    <EditorialFrame surface="archive" className="min-h-[calc(100svh-var(--app-header-height))]">
      <main data-testid="tracker-public-landing" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-10">
        <section className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-16 lg:pb-20">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-white/55">
              <NovaMark variant="compact" simple label={TRACKER_BRAND.name} />
              <span className="font-utility text-[10px] uppercase tracking-[0.2em]">From Buildora</span>
            </div>
            <ChapterLabel eyebrow="NOVA // Public entry" />
            <h1 className="mt-5 max-w-4xl font-display text-6xl font-black uppercase leading-[0.86] tracking-[-0.06em] text-white sm:text-8xl">
              Make the next chapter visible.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
              Goals, routines, focus, and momentum in one private workspace. Use it locally without sign-in, then add sync only when you want it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/hub" className="inline-flex min-h-11 items-center gap-2 bg-[#c8ff3d] px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#071014] transition-transform hover:-translate-y-0.5">
                Enter NOVA <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/motivation" className="inline-flex min-h-11 items-center border border-white/20 px-5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:border-[#49e7ff] hover:text-[#49e7ff]">
                Explore motivation
              </Link>
            </div>
          </div>
          <aside className="border border-white/15 bg-white/[0.04] p-5 text-white sm:p-6">
            <p className="font-utility text-[10px] font-bold uppercase tracking-[0.2em] text-[#49e7ff]">What stays with you</p>
            <ul className="mt-5 space-y-4">
              {["Local-first by default", "Optional private sync", "Share only with the people you choose"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-white/75">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#c8ff3d]" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="grid gap-px border-x border-b border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, label, description }) => (
            <article key={label} className="bg-[#071014] p-5 sm:p-6">
              <Icon className="h-5 w-5 text-[#49e7ff]" aria-hidden />
              <h2 className="mt-8 font-display text-2xl font-bold uppercase tracking-[-0.03em] text-white">{label}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
            </article>
          ))}
        </section>
      </main>
    </EditorialFrame>
  );
}

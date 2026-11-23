import ReturningWorkspace from "@/components/daily/ReturningWorkspace";
import Link from "next/link";
import EditorialFrame from "@/components/editorial/EditorialFrame";

export default async function TrackerLandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ study?: string }>;
}) {
  const params = await searchParams;
  return (
    <EditorialFrame surface="archive">
      {params?.study !== "access-denied" && <ReturningWorkspace />}
      <div
        data-testid="tracker-public-landing"
        className="nova-welcome mx-auto w-full max-w-5xl"
      >
        {params?.study === "access-denied" && (
          <section
            data-testid="study-access-denied-notice"
            className="workspace-notice"
            role="status"
          >
            <h2 className="font-semibold">Study Reference Access Restricted</h2>
            <p>
              Open the Software Developer Bible with an authorized account at{" "}
              <a
                className="text-primary underline"
                href="https://study.buildora.work/"
              >
                study.buildora.work
              </a>
              .
            </p>
          </section>
        )}
        <header>
          <p className="text-sm font-semibold text-primary">
            NOVA · Personal Career &amp; Execution OS
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Execute your day. Land the role.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Your daily hiring engine, verified Study Bible roadmap, visual
            analytics, and read-only Google Health Connect dashboard — in one
            focused workspace.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="inline-action nova-welcome-primary" href="/hub">
              Open workspace →
            </Link>
            <Link className="inline-action" href="/login">
              Sign in
            </Link>
          </div>
        </header>
        <div className="nova-welcome-grid">
          {[
            [
              "Today & Plan",
              "Run your 32-hour hiring timetable, track daily progress bars, launch focus sprints, and jump straight into today's study chapter.",
            ],
            [
              "Career & Study Bible",
              "Manage your opportunity pipeline, 5-round interview drills, project defenses, and 600 verified study.buildora.work chapters by stack.",
            ],
            [
              "Google Health & Analytics",
              "Review auto-synced steps, sleep stages, workouts, and weight from Google Health Connect alongside hiring funnel and consistency graphs.",
            ],
          ].map(([title, body]) => (
            <section key={title}>
              <h2 className="font-semibold text-lg">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </section>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Your workspace is private. Cloud sync requires sign-in and configured
          services; local records stay on the device where you saved them.
        </p>
      </div>
    </EditorialFrame>
  );
}

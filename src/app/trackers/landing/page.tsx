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
            NOVA · Your personal workspace
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Run your day.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Goals, routines, focus — alongside meals, movement and reminders.
            One place to decide what’s next and record what happened.
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
              "Today",
              "See your next commitment, tasks and reminders. Add a meal, water or weigh-in without losing your place.",
            ],
            [
              "Plan",
              "Arrange work and exercise around your day. Keep a weekly outline and return to the task you started.",
            ],
            [
              "Health & progress",
              "Review the food, workouts, weight and sleep you actually recorded. Missing data stays unrecorded.",
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
          Your workspace is personal. Cloud sync requires sign-in and configured
          services; local records stay on the device where you saved them.
        </p>
      </div>
    </EditorialFrame>
  );
}

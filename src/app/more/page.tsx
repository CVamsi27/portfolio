"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import SectionLinks from "@/components/personal/SectionLinks";
export default function MorePage() {
  return (
    <RequireAuth>
      <PersonalShell
        showBack={false}
        title="Tools"
        icon="settings"
        subtitle="Your account, saved material and sharing."
      >
        <div data-testid="more-links">
          <SectionLinks
            items={[
              {
                href: "/archive",
                label: "Library",
                description: "Your private notes, links and saved material.",
              },
              {
                href: "/share",
                label: "Sharing",
                description: "Manage explicit sharing and its audience.",
              },
              {
                href: "/settings",
                label: "Settings",
                description:
                  "Modules, optional protection, sync and data backup.",
              },
              {
                href: "/routine",
                label: "Reminder settings",
                description:
                  "Edit meals, supplements and notification preferences.",
              },
            ]}
          />
        </div>
        <a
          href="https://study.buildora.work/"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="personal-study-link"
          className="inline-flex min-h-11 items-center text-sm text-primary underline"
        >
          Open Software Developer Bible ↗
        </a>
      </PersonalShell>
    </RequireAuth>
  );
}

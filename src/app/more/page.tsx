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
        subtitle={null}
      >
        <div data-testid="more-links">
          <SectionLinks
            items={[
              {
                href: "/motivation",
                label: "Motivation",
                description: "Your purpose, reminders and next step.",
              },
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
            ]}
          />
        </div>
      </PersonalShell>
    </RequireAuth>
  );
}

"use client";
import RequireAuth from "@/components/auth/RequireAuth";
import PersonalShell from "@/components/trackers/PersonalShell";
import SectionLinks from "@/components/personal/SectionLinks";
import { PERSONAL_TOOLS_NAV } from "@/lib/personal-nav";
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
            items={PERSONAL_TOOLS_NAV.map((item) => ({
              href: item.href,
              label: item.label,
              description: item.description ?? "",
            }))}
          />
        </div>
      </PersonalShell>
    </RequireAuth>
  );
}

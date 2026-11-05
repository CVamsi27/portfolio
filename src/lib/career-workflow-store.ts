"use client";
import { useSyncedStorage } from "./use-synced-storage";
import { isSupabaseConfigured } from "./supabase/client";
import {
  updateResearchCheck,
  canPreservePreparationStage,
  preservedPreparationStage,
  type CareerResearchCheck,
} from "./career-research";
import { canPrepareApplication } from "./career-queue";
import {
  EMPTY_CAREER_EXECUTION_STATE,
  type CareerExecutionState,
} from "./career-roadmap";
import {
  adaptLegacyCompanyRecords,
  applyResearchImport,
  canonicalRoleUrl,
  careerWritesEnabled,
  newOpportunity,
  parseResearchSnapshot,
  recordCareerActivity,
  validActivity,
  validOpportunity,
  validResearchRole,
  type CareerActivities,
  type CareerActivity,
  type CareerOpportunities,
  type CareerOpportunity,
  type CareerResearch,
  type CareerResearchRole,
  type CareerResearchSnapshotV1,
} from "./career-workflow";

export function useCareerWorkflow() {
  const research = useSyncedStorage<CareerResearch>(
    "career:research",
    {},
    { accountScoped: true, records: true },
  );
  const opportunities = useSyncedStorage<CareerOpportunities>(
    "career:opportunities",
    {},
    { accountScoped: true, records: true },
  );
  const activities = useSyncedStorage<CareerActivities>(
    "career:activities",
    {},
    { accountScoped: true, records: true },
  );
  const execution = useSyncedStorage<CareerExecutionState>(
    "career_execution_state",
    EMPTY_CAREER_EXECUTION_STATE,
  );
  const enabled = careerWritesEnabled(
    isSupabaseConfigured(),
    process.env.NEXT_PUBLIC_CAREER_WORKFLOW_ENABLED,
  );
  function requireWrites() {
    if (!enabled)
      throw new Error(
        "Career records are read-only until the database migration and cloud checks are verified. You can continue reviewing your saved research.",
      );
  }
  function importSnapshot(
    snapshot: CareerResearchSnapshotV1,
    selectedIds: string[],
  ) {
    requireWrites();
    parseResearchSnapshot(snapshot);
    const next = applyResearchImport(research.value, snapshot, selectedIds);
    if (next !== research.value)
      research.setValue((current) =>
        applyResearchImport(current, snapshot, selectedIds),
      );
    return Object.keys(next).length - Object.keys(research.value).length;
  }
  function saveOpportunity(record: CareerOpportunity) {
    requireWrites();
    if (!validOpportunity(record) || !research.value[record.id])
      throw new Error("Check the opportunity fields and dates before saving.");
    const current = opportunities.value[record.id];
    if (record.stage === "ready" && current && current.stage !== "ready") {
      const today = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
      }).format(new Date());
      if (
        !["research", "clarify"].includes(current.stage) ||
        !canPrepareApplication(research.value[record.id], record, today)
      )
        throw new Error(
          "Check the current opening and India eligibility before marking it ready to apply.",
        );
    }
    const needsEvent: Partial<
      Record<CareerOpportunity["stage"], CareerActivity["kind"][]>
    > = {
      applied: ["application"],
      interview: ["interview"],
      offer: ["offer"],
      won: ["agreement"],
    };
    if (
      record.stage !== current?.stage &&
      needsEvent[record.stage] &&
      !Object.values(activities.value).some(
        (a) =>
          !a.deleted &&
          a.opportunityId === record.id &&
          needsEvent[record.stage]!.includes(a.kind),
      )
    )
      throw new Error(
        "Use Record application or Record activity to confirm an actual hiring stage first.",
      );
    opportunities.setValue((previous) => ({
      ...previous,
      [record.id]: {
        ...record,
        followUpOn: ["closed", "won"].includes(record.stage)
          ? null
          : record.followUpOn,
        updatedAt: Math.max(
          Date.now(),
          (previous[record.id]?.updatedAt ?? 0) + 1,
        ),
      },
    }));
  }
  function addActivity(record: CareerActivity) {
    requireWrites();
    if (!validActivity(record))
      throw new Error(
        "Record a valid date, confirmation reference and payment terms where relevant.",
      );
    const role = research.value[record.opportunityId];
    if (!role || role.deleted)
      throw new Error("Choose an existing opportunity.");
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());
    if (!["interview", "delivery"].includes(record.kind) && record.date > today)
      throw new Error(
        "Actual activity cannot be recorded for a future date. Schedule interviews and delivery separately.",
      );
    // Write the actual event first; a retried stage update never invents a receipt.
    activities.setValue((previous) => ({
      ...previous,
      [record.id]: {
        ...record,
        updatedAt: Math.max(
          Date.now(),
          (previous[record.id]?.updatedAt ?? 0) + 1,
        ),
      },
    }));
    opportunities.setValue((previous) => {
      const updated = recordCareerActivity(
        { ...previous, [role.id]: previous[role.id] ?? newOpportunity(role) },
        activities.value,
        record,
      ).opportunities[role.id];
      return {
        ...previous,
        [role.id]: {
          ...updated,
          updatedAt: Math.max(
            Date.now(),
            (previous[role.id]?.updatedAt ?? 0) + 1,
          ),
        },
      };
    });
  }
  function addManualRole(role: CareerResearchRole) {
    requireWrites();
    if (!validResearchRole(role))
      throw new Error(
        "Enter an exact HTTPS role URL and the required research fields.",
      );
    if (
      Object.values(research.value).some(
        (r) => canonicalRoleUrl(r.roleUrl) === canonicalRoleUrl(role.roleUrl),
      )
    )
      throw new Error(
        "That vacancy is already in your queue. Open the existing opportunity instead.",
      );
    research.setValue((previous) => {
      if (previous[role.id]) throw new Error("This role ID is already in use.");
      return { ...previous, [role.id]: { ...role, updatedAt: Date.now() } };
    });
  }
  function saveResearchCheck(id: string, check: CareerResearchCheck) {
    requireWrites();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(new Date());
    const before = research.value[id];
    if (!before)
      throw new Error(
        "Choose an existing opportunity before recording a check.",
      );
    // Validate before either collection changes. Preserve even the previously
    // derived preparation stage; checking facts must not silently advance it.
    updateResearchCheck(before, check, today);
    if (
      !canPreservePreparationStage(
        isSupabaseConfigured(),
        Boolean(opportunities.value[id]),
        opportunities.status,
      )
    )
      throw new Error(
        "Wait for application stages to finish syncing before checking this role. Your research and draft have not changed.",
      );
    if (!opportunities.value[id])
      opportunities.setValue((previous) =>
        previous[id]
          ? previous
          : { ...previous, [id]: preservedPreparationStage(before) },
      );
    research.setValue((previous) => {
      const role = previous[id];
      if (!role)
        throw new Error(
          "Choose an existing opportunity before recording a check.",
        );
      return { ...previous, [id]: updateResearchCheck(role, check, today) };
    });
  }
  function adaptLegacy() {
    requireWrites();
    const adapted = adaptLegacyCompanyRecords(
      execution.value.germanyCompanyRecords ?? {},
      research.value,
    );
    const additions = Object.fromEntries(
      Object.entries(adapted.opportunities).filter(
        ([id]) => !opportunities.value[id],
      ),
    );
    if (Object.keys(additions).length)
      opportunities.setValue((previous) => ({ ...additions, ...previous }));
    return {
      matched: Object.keys(additions).length,
      unmatched: adapted.unmatched,
    };
  }
  return {
    research,
    opportunities,
    activities,
    execution,
    enabled,
    importSnapshot,
    saveOpportunity,
    addActivity,
    addManualRole,
    saveResearchCheck,
    adaptLegacy,
  };
}

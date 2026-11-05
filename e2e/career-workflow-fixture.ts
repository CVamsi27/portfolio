/** Public synthetic fixture. No private candidate or employer research. */
export const careerRole = {
  id: "sample-product-engineer",
  company: "Sample Company",
  title: "Product Engineer",
  roleUrl: "https://example.test/jobs/product-engineer",
  kind: "employment" as const,
  location: "Remote India",
  availability: "active" as const,
  checkedOn: "2026-11-05",
  eligibility: "eligible" as const,
  eligibilityEvidence: "Employer explicitly accepts remote engineers in India.",
  fit: ["React and Node workflow ownership"],
  gaps: ["Discuss the Vue ramp"],
  questions: ["Confirm the first-payment date"],
  suggestedAction: "Prepare the focused application",
  rank: 1,
  compensation: "Range not confirmed",
  contacts: [{ name: "Hiring team", url: "https://example.test/team" }],
  draft: "An editable, unsent introduction grounded in an actual project.",
  updatedAt: Date.parse("2026-11-05T08:00:00Z"),
};

export const careerSnapshot = {
  schemaVersion: 1 as const,
  exportedAt: "2026-11-05T08:00:00Z",
  roles: [careerRole],
};

export const contractRole = {
  ...careerRole,
  id: "sample-contract",
  title: "Workflow implementation",
  roleUrl: "https://example.test/jobs/contract",
  kind: "contract" as const,
  rank: 2,
};

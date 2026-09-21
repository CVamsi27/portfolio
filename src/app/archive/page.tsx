"use client";

import { useMemo, useState } from "react";
import { Archive, Image as ImageIcon, Link2, Pin, Quote, Search, StickyNote } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";
import TrackerShell from "@/components/trackers/TrackerShell";
import EmptyState from "@/components/trackers/EmptyState";
import Segmented from "@/components/trackers/Segmented";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type ArchiveItem, type ArchiveKind, normalizeTags, searchArchive } from "@/lib/archive";
import { useSyncedStorage } from "@/lib/use-synced-storage";
import { GOAL_CATEGORIES, useUserPrefs, type GoalCategory } from "@/lib/user-prefs";

const KINDS: { value: ArchiveKind; label: string; Icon: typeof StickyNote }[] = [
  { value: "note", label: "Note", Icon: StickyNote },
  { value: "link", label: "Link", Icon: Link2 },
  { value: "image", label: "Image", Icon: ImageIcon },
  { value: "quote", label: "Quote", Icon: Quote },
];

function ArchiveImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="img" aria-label={`${alt} image unavailable`} className="mt-2 border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">Image reference unavailable</div>;
  // Archive references intentionally stay as native remote images; binary archive uploads are out of scope.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="mt-2 max-h-44 w-full object-cover" />;
}

export default function ArchivePage() {
  const { prefs } = useUserPrefs();
  const { value, setValue } = useSyncedStorage<ArchiveItem[]>("archive:items", []);
  const items = useMemo(() => value ?? [], [value]);
  const [kind, setKind] = useState<ArchiveKind>("note");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [query, setQuery] = useState("");
  const [goalFilter, setGoalFilter] = useState<"current" | "all" | "unlinked">("current");
  const [linkGoal, setLinkGoal] = useState<GoalCategory | "none">(prefs.goalCategory);
  const currentGoalLabel = GOAL_CATEGORIES.find((category) => category.id === prefs.goalCategory)?.label ?? "Current goal";
  const filteredItems = useMemo(() => items.filter((item) => goalFilter === "all" || (goalFilter === "unlinked" ? !item.goalCategory : item.goalCategory === prefs.goalCategory)), [goalFilter, items, prefs.goalCategory]);
  const matches = useMemo(() => searchArchive(filteredItems, query), [filteredItems, query]);

  const save = () => {
    const cleanBody = body.trim();
    if (!cleanBody) return;
    const cleanUrl = sourceUrl.trim();
    const safeUrl = cleanUrl && /^https:\/\//i.test(cleanUrl) ? cleanUrl : undefined;
    setValue([{ id: `archive_${Date.now().toString(36)}`, body: cleanBody, kind, tags: normalizeTags(tags), sourceUrl: safeUrl, goalCategory: linkGoal === "none" ? null : linkGoal, pinned: false, createdAt: Date.now() }, ...items]);
    setBody(""); setTags(""); setSourceUrl("");
  };

  const togglePin = (id: string) => setValue(items.map((item) => item.id === id ? { ...item, pinned: !item.pinned } : item));

  return <RequireAuth><TrackerShell icon="archive" showDock={false} title="Personal Archive" subtitle="Capture what matters now. Retrieve it when it matters again.">
    <Card variant="dossier"><CardContent className="p-5">
      <div className="flex items-center gap-2"><Archive className="h-4 w-4 text-[#49E7FF]" /><h2 className="font-display font-bold">Quick capture</h2></div>
      <div className="mt-4"><Segmented label="Archive item type" options={KINDS.map(({ value, label }) => ({ value, label }))} value={kind} onChange={setKind} /></div>
      <Textarea aria-label="Capture" className="mt-3 min-h-24" value={body} onChange={(event) => setBody(event.target.value)} placeholder={kind === "quote" ? "Save the exact words worth returning to…" : "Write the useful thing before it disappears…"} />
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input aria-label="Tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags, comma separated" /><Input aria-label="Source URL" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder={kind === "image" ? "HTTPS image URL" : "Source URL (optional)"} /></div>
      <div className="mt-3"><Segmented label="Link to goal" options={[{ value: prefs.goalCategory, label: currentGoalLabel }, { value: "none", label: "No goal" }]} value={linkGoal} onChange={setLinkGoal} /></div>
      <div className="mt-3 flex justify-end"><Button onClick={save} disabled={!body.trim()}>Save to archive</Button></div>
    </CardContent></Card>
    <Card variant="dossier"><CardContent className="p-5">
      <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search archive" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search notes, links, tags…" /></label>
      <div className="mt-3"><Segmented label="Archive scope" options={[{ value: "current", label: currentGoalLabel }, { value: "all", label: "All items" }, { value: "unlinked", label: "Unlinked" }]} value={goalFilter} onChange={setGoalFilter} /></div>
      {matches.length ? <ul className="mt-4 space-y-2">{matches.map((item) => { const KindIcon = KINDS.find((option) => option.value === item.kind)?.Icon ?? StickyNote; const linkedGoal = GOAL_CATEGORIES.find((category) => category.id === item.goalCategory)?.label; return <li key={item.id} className="rounded-xl border border-border/60 px-3 py-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground"><KindIcon className="h-3.5 w-3.5" />{item.kind}{linkedGoal ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] normal-case tracking-normal text-primary">{linkedGoal}</span> : null}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.body}</p>{item.kind === "image" && item.sourceUrl ? <ArchiveImage src={item.sourceUrl} alt={item.body} /> : null}{item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-primary hover:underline">{item.sourceUrl}</a> : null}{item.tags.length ? <div className="mt-2 flex flex-wrap gap-1">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{tag}</span>)}</div> : null}</div><button type="button" aria-label={item.pinned ? "Unpin archive item" : "Pin archive item"} onClick={() => togglePin(item.id)} className={item.pinned ? "text-[#c8ff3d]" : "text-muted-foreground"}><Pin className={item.pinned ? "h-4 w-4 fill-current" : "h-4 w-4"} /></button></div></li>; })}</ul> : <div className="mt-4"><EmptyState icon={Archive} title={query ? "No archive matches" : "Your archive is clear"} hint={query ? "Try another phrase or tag." : "Capture a note, link, image reference, or quote to make it retrievable later."} /></div>}
    </CardContent></Card>
  </TrackerShell></RequireAuth>;
}

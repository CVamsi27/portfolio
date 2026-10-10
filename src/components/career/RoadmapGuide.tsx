import { Fragment } from "react";
import { studyTaskUrl } from "@/lib/germany-execution";
type Context = { date?: string; task?: string; onGuide?: (id: string) => void };
function Inline({ text, context = {} }: { text: string; context?: Context }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {tokens.map((part, i) => {
        if (part.startsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`"))
          return (
            <code
              key={i}
              className="rounded bg-muted px-1 font-mono text-[0.9em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          if (link[2].startsWith("https://"))
            return (
              <a
                key={i}
                href={
                  context.date && context.task
                    ? studyTaskUrl(link[2], context.date, context.task)
                    : link[2]
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 break-words"
              >
                {link[1]}
              </a>
            );
          if (link[2].includes("80.29-topic-brushup"))
            return (
              <a
                key={i}
                href="https://study.buildora.work/80-lanes-abroad-full-stack/80.29-topic-brushup-roadmap.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {link[1]}
              </a>
            );
          const guide = link[2].includes("daily-curriculum")
            ? "curriculum"
            : link[2].includes("germany-exams")
              ? "exams"
              : link[2].includes("germany-campaign")
                ? "campaign"
                : link[2].includes("detailed-roadmap-design")
                  ? "design"
                  : null;
          if (guide && context.onGuide)
            return (
              <button
                key={i}
                className="text-primary underline underline-offset-4 text-left"
                onClick={() => context.onGuide!(guide)}
              >
                {link[1]}
              </button>
            );
          return <span key={i}>{link[1]} (canonical personal document)</span>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
export default function RoadmapGuide({
  content,
  context = {},
}: {
  content: string;
  context?: Context;
}) {
  const blocks = content
    .split(/(```[^\n]*\n[\s\S]*?```)/g)
    .flatMap((part) =>
      part.startsWith("```") ? [part] : part.split(/\n\s*\n/),
    )
    .filter(Boolean);
  return (
    <div className="space-y-4 text-sm leading-relaxed break-words">
      {blocks.map((block, i) => {
        if (block.startsWith("```")) {
          const at = block.indexOf("\n");
          return (
            <pre
              key={i}
              className="overflow-x-auto max-w-full rounded-lg border border-border bg-muted p-3 text-xs"
            >
              <code>{block.slice(at + 1, -3).replace(/\n$/, "")}</code>
            </pre>
          );
        }
        if (block.startsWith(">"))
          return (
            <blockquote key={i} className="border-l-2 border-primary/40 pl-4">
              <Inline
                text={block.replace(/^> ?/gm, "").replace(/\n/g, " ")}
                context={context}
              />
            </blockquote>
          );
        if (block.startsWith("|")) {
          const rows = block
            .split("\n")
            .filter((l) => l.startsWith("|"))
            .map((l) =>
              l
                .split(/(?<!\\)\|/)
                .slice(1, -1)
                .map((s) => s.trim().replace(/\\\|/g, "|")),
            )
            .filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left">
                <thead>
                  <tr>
                    {rows[0]?.map((c, j) => (
                      <th
                        key={j}
                        scope="col"
                        className="border-b border-border p-2 font-semibold"
                      >
                        <Inline text={c} context={context} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1).map((row, j) => (
                    <tr key={j}>
                      {row.map((c, k) => (
                        <td
                          key={k}
                          className="border-b border-border p-2 align-top"
                        >
                          <Inline text={c} context={context} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (/^#{1,6} /.test(block))
          return (
            <h3 key={i} className="font-semibold text-base">
              <Inline text={block.replace(/^#+ /, "")} context={context} />
            </h3>
          );
        if (/^(?:- |\d+\. )/.test(block)) {
          const ordered = /^\d/.test(block);
          const lines = block
            .split("\n")
            .filter(Boolean)
            .map((l) => l.replace(/^(?:- |\d+\. )/, ""));
          const items = lines.map((l, j) => (
            <li key={j}>
              <Inline text={l} context={context} />
            </li>
          ));
          return ordered ? (
            <ol key={i} className="list-decimal pl-5 space-y-2">
              {items}
            </ol>
          ) : (
            <ul key={i} className="list-disc pl-5 space-y-2">
              {items}
            </ul>
          );
        }
        return (
          <p key={i}>
            <Inline text={block.replace(/\n/g, " ")} context={context} />
          </p>
        );
      })}
    </div>
  );
}

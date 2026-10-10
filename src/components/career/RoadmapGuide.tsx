import { Fragment } from "react";
function Inline({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {tokens.map((part, i) => {
        if (part.startsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link) {
          if (link[2].startsWith("https://"))
            return (
              <a
                key={i}
                href={link[2]}
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
          return <span key={i}>{link[1]} (canonical personal document)</span>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
export default function RoadmapGuide({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/);
  return (
    <div className="space-y-4 text-sm leading-relaxed break-words">
      {blocks.map((block, i) => {
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
                        <Inline text={c} />
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
                          <Inline text={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (/^#{3,6} /.test(block))
          return (
            <h3 key={i} className="font-semibold text-base">
              <Inline text={block.replace(/^#+ /, "")} />
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
              <Inline text={l} />
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
            <Inline text={block.replace(/\n/g, " ")} />
          </p>
        );
      })}
    </div>
  );
}

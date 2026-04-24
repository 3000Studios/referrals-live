import { Fragment, useMemo } from "react";

function isHttpUrl(href: string) {
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function renderInline(text: string) {
  // Very small inline parser: **bold** + http(s) links.
  const parts: Array<{ type: "text" | "bold" | "link"; value: string }> = [];
  let i = 0;
  while (i < text.length) {
    const boldStart = text.indexOf("**", i);
    const urlMatch = /https?:\/\/[^\s)]+/g;
    urlMatch.lastIndex = i;
    const url = urlMatch.exec(text);
    const urlStart = url?.index ?? -1;

    const next = [boldStart === -1 ? Infinity : boldStart, urlStart === -1 ? Infinity : urlStart].reduce((a, b) =>
      Math.min(a, b),
    );
    if (next === Infinity) {
      parts.push({ type: "text", value: text.slice(i) });
      break;
    }
    if (next > i) parts.push({ type: "text", value: text.slice(i, next) });

    if (next === boldStart) {
      const end = text.indexOf("**", boldStart + 2);
      if (end === -1) {
        parts.push({ type: "text", value: text.slice(boldStart) });
        break;
      }
      parts.push({ type: "bold", value: text.slice(boldStart + 2, end) });
      i = end + 2;
      continue;
    }

    if (next === urlStart && url) {
      parts.push({ type: "link", value: url[0] });
      i = urlStart + url[0].length;
      continue;
    }
  }

  return parts.map((p, idx) => {
    if (p.type === "bold") return <strong key={idx} className="text-white">{p.value}</strong>;
    if (p.type === "link") {
      const href = p.value;
      return isHttpUrl(href) ? (
        <a key={idx} href={href} target="_blank" rel="noreferrer" className="text-electric hover:text-white underline underline-offset-4">
          {href}
        </a>
      ) : (
        <Fragment key={idx}>{href}</Fragment>
      );
    }
    return <Fragment key={idx}>{p.value}</Fragment>;
  });
}

export function MarkdownLite({ content }: { content: string }) {
  const blocks = useMemo(() => content.replaceAll("\r\n", "\n").split("\n\n").map((b) => b.trim()).filter(Boolean), [content]);

  return (
    <div className="space-y-8">
      {blocks.map((block, idx) => {
        const lines = block.split("\n").map((l) => l.trimEnd());
        const first = lines[0] ?? "";
        if (first.startsWith("### ")) {
          return (
            <section key={idx}>
              <h3 className="font-display text-xl font-bold text-white">{first.replace(/^###\s+/, "")}</h3>
              {lines.slice(1).length ? (
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                  {lines.slice(1).filter(Boolean).map((l, j) => (
                    <p key={j}>{renderInline(l)}</p>
                  ))}
                </div>
              ) : null}
            </section>
          );
        }
        if (first.startsWith("## ")) {
          return (
            <section key={idx}>
              <h2 className="font-display text-2xl font-bold text-white">{first.replace(/^##\s+/, "")}</h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                {lines.slice(1).filter(Boolean).map((l, j) =>
                  l.startsWith("- ") ? (
                    <div key={j} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-neon/70" />
                      <p className="flex-1">{renderInline(l.replace(/^- /, ""))}</p>
                    </div>
                  ) : (
                    <p key={j}>{renderInline(l)}</p>
                  ),
                )}
              </div>
            </section>
          );
        }
        if (first.startsWith("# ")) {
          return (
            <div key={idx}>
              <h1 className="font-display text-4xl font-extrabold text-white md:text-5xl">{first.replace(/^#\s+/, "")}</h1>
              {lines.slice(1).length ? (
                <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
                  {lines.slice(1).filter(Boolean).map((l, j) => (
                    <p key={j}>{renderInline(l)}</p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        }

        const isList = lines.every((l) => l.startsWith("- "));
        if (isList) {
          return (
            <ul key={idx} className="space-y-3 text-sm leading-relaxed text-muted">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-electric/70" />
                  <div className="flex-1">{renderInline(l.replace(/^- /, ""))}</div>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="text-sm leading-relaxed text-muted">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}


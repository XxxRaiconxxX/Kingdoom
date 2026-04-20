import { useState } from "react";

export function ExpandableText({
  text,
  lines = 3,
}: {
  text: string;
  lines?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <p
        className="text-sm leading-6 text-stone-400"
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: String(lines),
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="kd-touch text-xs font-semibold uppercase tracking-[0.16em] text-amber-300 transition hover:text-amber-200"
      >
        {expanded ? "Ver menos" : "Ver mas"}
      </button>
    </div>
  );
}

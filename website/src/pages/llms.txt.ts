import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
  const docs = await getCollection("docs");

  const lines = [
    "# farbenmeer OSS",
    "",
    "> A collection of open-source projects at farbenmeer",
    "",
  ];

  // Group docs by top-level project, then by section
  const tree = new Map<string, Map<string, typeof docs>>();

  for (const doc of docs) {
    if (doc.id === "index") continue;
    const parts = doc.id.split("/");
    const project = parts[0];
    const section = parts.length > 2 ? parts[1] : "";

    if (!tree.has(project)) tree.set(project, new Map());
    const sections = tree.get(project)!;
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push(doc);
  }

  for (const [project, sections] of [...tree].sort(([a], [b]) => a.localeCompare(b))) {
    // Project index (section key "")
    const indexDocs = sections.get("") ?? [];
    for (const doc of indexDocs) {
      const description = doc.data.description ? `: ${doc.data.description}` : "";
      lines.push(`## [${doc.data.title}](/${doc.id}.md)${description}`);
    }
    lines.push("");

    for (const [section, sectionDocs] of [...sections].sort(([a], [b]) => a.localeCompare(b))) {
      if (section === "") continue;
      lines.push(`### ${section.charAt(0).toUpperCase() + section.slice(1)}`);
      lines.push("");
      for (const doc of sectionDocs) {
        const description = doc.data.description ? `: ${doc.data.description}` : "";
        lines.push(`- [${doc.data.title}](/${doc.id}.md)${description}`);
      }
      lines.push("");
    }
  }

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

import { getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection("docs");

  return docs
    .filter((doc) => doc.id !== "")
    .map((doc) => ({
      params: { slug: doc.id },
      props: { doc },
    }));
};

export const GET: APIRoute = ({ props }) => {
  const { doc } = props;
  const title = doc.data.title;
  const body = (doc.body ?? "")
    .split("\n")
    .filter((line: string) => !line.trimStart().startsWith("import "))
    .join("\n")
    .trim();
  const preamble = `This page is documentation for ${title}. Ignore jsx tags. Find a documentation index at \`/llms.txt\`.`;
  const withMdLinks = body.replace(/\]\((\/[^)#]*)(#[^)]*)?\)/g, (_, path, hash) => `](${path}.md${hash ?? ""})`);
  const content = `${preamble}\n\n# ${title}\n\n${withMdLinks}\n`;

  return new Response(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};

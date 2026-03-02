import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";

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
	const body = (doc.body ?? "").trim();
	const content = `# ${title}\n\n${body}\n`;

	return new Response(content, {
		headers: { "Content-Type": "text/markdown; charset=utf-8" },
	});
};

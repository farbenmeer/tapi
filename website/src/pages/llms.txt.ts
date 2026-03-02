import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async () => {
	const docs = await getCollection("docs");

	const packagePages = docs
		.filter((doc) => doc.id !== "" && !doc.id.includes("/"))
		.sort((a, b) => a.id.localeCompare(b.id));

	const lines = [
		"# farbenmeer OSS",
		"",
		"> A collection of open-source projects at farbenmeer",
		"",
	];

	for (const doc of packagePages) {
		const title = doc.data.title;
		const description = doc.data.description
			? `: ${doc.data.description}`
			: "";
		lines.push(`- [${title}](/${doc.id}.md)${description}`);
	}

	return new Response(lines.join("\n") + "\n", {
		headers: { "Content-Type": "text/plain; charset=utf-8" },
	});
};

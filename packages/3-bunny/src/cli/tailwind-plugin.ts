import postcssTailwind from "@tailwindcss/postcss";
import type { BunPlugin } from "bun";
import postcss from "postcss";

const processCss = postcss([postcssTailwind({})]);

const tailwindPlugin: BunPlugin = {
  name: "Tailwind CSS",
  setup(build) {
    build.onLoad({ filter: /\.(css)$/ }, async ({ path }) => {
      console.log("process", path);
      const contents = await Bun.file(path).text();
      const result = await processCss.process(contents, { from: path });
      return { contents: result.css, loader: "css" };
    });
  },
};

export default tailwindPlugin;

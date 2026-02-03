// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "farbenmeer OSS",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/farbenmeer/tapi",
        },
      ],
      sidebar: [
        {
          label: "TApi",
          items: [
            { label: "Introduction", slug: "tapi" },
            {
              label: "Guides",
              autogenerate: { directory: "tapi/guides" },
            },
            {
              label: "Reference",
              autogenerate: { directory: "tapi/reference" },
            },
          ],
        },
        {
          label: "Lacy",
          slug: "lacy",
        },
        {
          label: "Skeleton",
          slug: "skeleton",
        },
        {
          label: "Router",
          items: [
            { label: "Introduction", slug: "router" },
            {
              label: "Guides",
              autogenerate: { directory: "router/guides" },
            },
            {
              label: "Reference",
              autogenerate: { directory: "router/reference" },
            },
          ],
        },
        {
          label: "Bunny",
          slug: "bunny",
        },
        {
          label: "Tag-Based Cache",
          items: [
            { label: "Introduction", slug: "tag-based-cache" },
            {
              label: "Reference",
              autogenerate: { directory: "tag-based-cache/reference" },
            },
          ],
        },
      ],
    }),
  ],
});

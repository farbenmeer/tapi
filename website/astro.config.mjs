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
          collapsed: true,
          items: [
            { label: "Introduction", slug: "tapi" },
            {
              label: "Guides",
              items: [{ autogenerate: { directory: "tapi/guides" } }],
            },
            {
              label: "Reference",
              items: [{ autogenerate: { directory: "tapi/reference" } }],
            },
          ],
        },
        {
          label: "Lacy",
          collapsed: true,
          items: [
            { label: "Introduction", slug: "lacy" },
            {
              label: "Reference",
              items: [{ autogenerate: { directory: "lacy/reference" } }],
            },
          ],
        },
        {
          label: "Router",
          collapsed: true,
          items: [
            { label: "Introduction", slug: "router" },
            {
              label: "Guides",
              items: [{ autogenerate: { directory: "router/guides" } }],
            },
            {
              label: "Reference",
              items: [{ autogenerate: { directory: "router/reference" } }],
            },
          ],
        },
        {
          label: "Bunny",
          collapsed: true,
          items: [
            { label: "Introduction", slug: "bunny" },
            {
              label: "Guides",
              items: [{ autogenerate: { directory: "bunny/guides" } }],
            },
            {
              label: "Conventions",
              items: [{ autogenerate: { directory: "bunny/conventions" } }],
            },
            {
              label: "Reference",
              items: [{ autogenerate: { directory: "bunny/reference" } }],
            },
          ],
        },
        {
          label: "Prisma Migrate Test",
          collapsed: true,
          items: [
            { label: "Introduction", slug: "prisma-migrate-test" },
            {
              label: "Reference",
              items: [
                { autogenerate: { directory: "prisma-migrate-test/reference" } },
              ],
            },
          ],
        },
        {
          label: "Vite Plugin TApi",
          collapsed: true,
          items: [
            { label: "Introduction", slug: "vite-plugin-tapi" },
            {
              label: "Guides",
              items: [
                { autogenerate: { directory: "vite-plugin-tapi/guides" } },
              ],
            },
          ],
        },
        {
          label: "Tag-Based Cache",
          collapsed: true,
          items: [
            { label: "Introduction", slug: "tag-based-cache" },
            {
              label: "Reference",
              items: [
                { autogenerate: { directory: "tag-based-cache/reference" } },
              ],
            },
          ],
        },
      ],
    }),
  ],
});

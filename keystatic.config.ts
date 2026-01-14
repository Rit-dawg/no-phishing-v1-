import { config, fields, collection } from "@keystatic/core";

const isProd = process.env.NODE_ENV === "production";

export default config({
  storage: isProd
    ? {
        kind: "github",
        repo: {
          owner: "Rit-dawg", // Change this to your GitHub username
          name: "no-phishing-v1-", // Change this to your repository name
        },
      }
    : {
        kind: "local",
      },
  collections: {
    advisories: collection({
      label: "Security Advisories",
      slugField: "title",
      path: "content/advisories/*",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        excerpt: fields.text({ label: "Excerpt", multiline: true }),
        date: fields.date({ label: "Published Date" }),
        author: fields.text({ label: "Author" }),
        severity: fields.select({
          label: "Severity",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Critical", value: "critical" },
          ],
          defaultValue: "medium",
        }),
        content: fields.document({
          label: "Content",
          formatting: true,
          dividers: true,
          links: true,
          images: {
            directory: "public/images/advisories",
            publicPath: "/images/advisories",
          },
        }),
      },
    }),
  },
});

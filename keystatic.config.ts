// This file is strictly for Keystatic and should not be imported by the main app bundle.
// @ts-ignore
import {
  config,
  fields,
  collection,
} from "https://esm.sh/@keystatic/core@0.5.48";

export default config({
  storage: {
    kind: "github",
    repo: "Rit-dawg/no-phishing-v1-", // Replace this with your actual GitHub "username/repo-name"
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
          images: true,
        }),
      },
    }),
  },
});

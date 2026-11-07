// @ts-check
import { defineConfig } from "astro/config";

// Static site: English at /, Spanish at /es/
export default defineConfig({
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: "auto" },
});

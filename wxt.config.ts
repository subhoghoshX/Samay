import { defineConfig } from "wxt";

export default defineConfig({
  manifest: {
    permissions: ["webNavigation", "storage", "tabs", "scripting", "alarms"],
  },
});

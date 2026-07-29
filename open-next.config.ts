import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  // `npm run build` is the OpenNext build itself, so point Next's build at the
  // binary directly — otherwise OpenNext re-invokes `npm run build` and recurses.
  buildCommand: "npx next build",
  ...defineCloudflareConfig(),
};

import packageJson from "./package.json";

/**
 * After changing, please reload the extension at `chrome://extensions`
 */
const manifest: any = {
  manifest_version: 3,
  name: "KonvaJS Devtools",
  version: packageJson.version,
  description: packageJson.description,
  permissions: ["storage"],
  // options_page: "src/pages/options/index.html",
  background:
    process.env.ENV_TARGET === "firefox"
      ? {
          scripts: ["src/pages/background/index.js"],
          type: "module",
        }
      : {
          service_worker: "src/pages/background/index.js",
          type: "module",
        },
  action: {
    default_popup: "src/pages/popup/index.html",
    default_icon: "icon32_black.png",
  },
  // chrome_url_overrides: {
  //   newtab: "src/pages/newtab/index.html",
  // },
  icons: {
    "16": "icon16.png",
    "32": "icon32.png",
    "48": "icon48.png",
    "128": "icon128.png",
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "<all_urls>"],
      js: ["src/pages/content/index.js"],
      css: [],
      // KEY for cache invalidation
      // css: ["assets/css/contentStyle<KEY>.chunk.css"],
    },
  ],
  devtools_page: "src/pages/devtools/index.html",
  web_accessible_resources: [
    {
      resources: [
        "assets/js/*.js",
        "assets/css/*.css",
        "src/pages/detector/index.js",
      ],
      matches: ["*://*/*"],
    },
  ],
};

if (process.env.ENV_TARGET === "firefox") {
  manifest.browser_specific_settings = {
    gecko: {
      id: "maitrungduc1410@gmail.com",
    },
  };
}

export default manifest;

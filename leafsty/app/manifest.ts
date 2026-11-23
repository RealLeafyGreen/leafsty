import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Leafsty — End-to-End Encrypted Chat",
    short_name: "Leafsty",
    description: "Private, end-to-end encrypted spaces, DMs, and calls.",
    start_url: "/",
    display: "standalone",
    background_color: "#071410",
    theme_color: "#059669",
    icons: [
      {
        src: "/leafsty-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/leafsty-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

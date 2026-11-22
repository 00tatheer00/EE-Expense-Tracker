import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EE Expense Tracker",
    short_name: "EE Expenses",
    description: "Expense management for Emerging Edge, EEST and STYLONE.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F8FB",
    theme_color: "#0B1A3A",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Add expense", short_name: "Add", url: "/expenses/new" },
      { name: "Expenses", url: "/expenses" },
      { name: "Reports", url: "/reports" },
    ],
  };
}

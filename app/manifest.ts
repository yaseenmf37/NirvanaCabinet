import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "New Nirvana | Cabinet OS",
    short_name: "New Nirvana",
    description: "مدیریت یکپارچه عملیات صنعت کابینت از اندازه‌گیری تا نصب.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#334155",
    dir: "rtl",
    lang: "fa",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

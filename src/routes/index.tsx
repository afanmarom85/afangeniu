import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beranda Maz Afan - Tempat Berbagi Karya & Hal Bermanfaat" },
      { name: "description", content: "Beranda pribadi Maz Afan. Tempat berbagi aplikasi sederhana, media pembelajaran, dan perangkat bermanfaat." },
      { property: "og:title", content: "Beranda Maz Afan" },
      { property: "og:description", content: "Tempat berbagi aplikasi sederhana, media pembelajaran, dan perangkat bermanfaat." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/beranda.html"
      title="Beranda Maz Afan"
      className="fixed inset-0 h-screen w-screen border-0"
    />
  );
}

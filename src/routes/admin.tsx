import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Dashboard Admin - Beranda Maz Afan" },
      { name: "description", content: "Kelola profil, karya, unduhan, dan pesan Beranda Maz Afan." },
      { property: "og:title", content: "Dashboard Admin - Beranda Maz Afan" },
      { property: "og:description", content: "Kelola isi Beranda Maz Afan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type App = { id?: string; nama: string; kategori: string; deskripsi: string; status: string; url: string; is_featured: boolean; urutan: number };
type Download = { id?: string; judul: string; jenis: string; deskripsi: string; url: string; urutan: number };
type Profile = { nama: string; peran: string; tentang: string; foto_url: string; email: string };
type Message = { id: string; nama: string; email: string; pesan: string; created_at: string };

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin");
      setIsAdmin(!!data && data.length > 0);
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (isAdmin === null) return <div className="p-10 text-muted-foreground">Memuat...</div>;
  if (!isAdmin)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-foreground">Akun ini bukan admin.</p>
        <Button variant="outline" onClick={logout}>Keluar</Button>
      </div>
    );

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-foreground">Dashboard Admin</h1>
          <div className="flex gap-2">
            <Button variant="outline" asChild><a href="/" target="_blank" rel="noreferrer">Lihat Web</a></Button>
            <Button variant="ghost" onClick={logout}>Keluar</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Tabs defaultValue="profil">
          <TabsList>
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="karya">Koleksi Aplikasi</TabsTrigger>
            <TabsTrigger value="unduhan">Unduhan</TabsTrigger>
            <TabsTrigger value="pesan">Pesan</TabsTrigger>
          </TabsList>
          <TabsContent value="profil"><ProfileEditor /></TabsContent>
          <TabsContent value="karya"><AppsEditor /></TabsContent>
          <TabsContent value="unduhan"><DownloadsEditor /></TabsContent>
          <TabsContent value="pesan"><MessagesList /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 rounded-xl border bg-card p-5">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ProfileEditor() {
  const [p, setP] = useState<Profile | null>(null);
  useEffect(() => {
    supabase.from("profile").select("*").eq("id", 1).maybeSingle().then(({ data }) =>
      setP(data ?? { nama: "", peran: "", tentang: "", foto_url: "", email: "" }),
    );
  }, []);
  if (!p) return null;
  async function save() {
    const { error } = await supabase.from("profile").upsert({ id: 1, ...p!, updated_at: new Date().toISOString() });
    error ? toast.error(error.message) : toast.success("Profil disimpan");
  }
  return (
    <Card>
      <Field label="Nama"><Input value={p.nama} onChange={(e) => setP({ ...p, nama: e.target.value })} /></Field>
      <Field label="Peran / Profesi"><Input value={p.peran} onChange={(e) => setP({ ...p, peran: e.target.value })} /></Field>
      <Field label="Tentang Saya"><Textarea rows={5} value={p.tentang} onChange={(e) => setP({ ...p, tentang: e.target.value })} /></Field>
      <Field label="Link Foto Profil (URL gambar)"><Input value={p.foto_url} onChange={(e) => setP({ ...p, foto_url: e.target.value })} placeholder="https://..." /></Field>
      <Field label="Email Kontak"><Input type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></Field>
      <Button onClick={save}>Simpan Profil</Button>
    </Card>
  );
}

function AppsEditor() {
  const [items, setItems] = useState<App[]>([]);
  const load = () => supabase.from("apps").select("*").order("urutan").then(({ data }) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  const update = (i: number, patch: Partial<App>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  async function save(a: App) {
    const { error } = await supabase.from("apps").upsert(a);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan"); load();
  }
  async function remove(a: App) {
    if (!a.id) return setItems(items.filter((x) => x !== a));
    if (!confirm(`Hapus "${a.nama}"?`)) return;
    const { error } = await supabase.from("apps").delete().eq("id", a.id);
    error ? toast.error(error.message) : (toast.success("Dihapus"), load());
  }
  return (
    <div className="space-y-4">
      <Button onClick={() => setItems([...items, { nama: "", kategori: "Umum", deskripsi: "", status: "Siap Digunakan", url: "", is_featured: false, urutan: items.length + 1 }])}>
        + Tambah Aplikasi
      </Button>
      {items.map((a, i) => (
        <Card key={a.id ?? `new-${i}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nama"><Input value={a.nama} onChange={(e) => update(i, { nama: e.target.value })} /></Field>
            <Field label="Kategori"><Input value={a.kategori} onChange={(e) => update(i, { kategori: e.target.value })} /></Field>
            <Field label="Status"><Input value={a.status} onChange={(e) => update(i, { status: e.target.value })} placeholder="Siap Digunakan / Pengembangan" /></Field>
            <Field label="Link Aplikasi"><Input value={a.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Urutan"><Input type="number" value={a.urutan} onChange={(e) => update(i, { urutan: Number(e.target.value) })} /></Field>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={a.is_featured} onCheckedChange={(v) => update(i, { is_featured: v })} />
              <Label>Tampilkan di Beranda (Karya Pilihan)</Label>
            </div>
          </div>
          <Field label="Deskripsi"><Textarea value={a.deskripsi} onChange={(e) => update(i, { deskripsi: e.target.value })} /></Field>
          <div className="flex gap-2">
            <Button onClick={() => save(a)} disabled={!a.nama.trim()}>Simpan</Button>
            <Button variant="destructive" onClick={() => remove(a)}>Hapus</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DownloadsEditor() {
  const [items, setItems] = useState<Download[]>([]);
  const load = () => supabase.from("downloads").select("*").order("urutan").then(({ data }) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  const update = (i: number, patch: Partial<Download>) => setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  async function save(d: Download) {
    const { error } = await supabase.from("downloads").upsert(d);
    if (error) return toast.error(error.message);
    toast.success("Tersimpan"); load();
  }
  async function remove(d: Download) {
    if (!d.id) return setItems(items.filter((x) => x !== d));
    if (!confirm(`Hapus "${d.judul}"?`)) return;
    const { error } = await supabase.from("downloads").delete().eq("id", d.id);
    error ? toast.error(error.message) : (toast.success("Dihapus"), load());
  }
  return (
    <div className="space-y-4">
      <Button onClick={() => setItems([...items, { judul: "", jenis: "PDF", deskripsi: "", url: "", urutan: items.length + 1 }])}>
        + Tambah Berkas
      </Button>
      {items.map((d, i) => (
        <Card key={d.id ?? `new-${i}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Judul"><Input value={d.judul} onChange={(e) => update(i, { judul: e.target.value })} /></Field>
            <Field label="Jenis Berkas"><Input value={d.jenis} onChange={(e) => update(i, { jenis: e.target.value })} /></Field>
            <Field label="Link Unduhan (Google Drive, dll)"><Input value={d.url} onChange={(e) => update(i, { url: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Urutan"><Input type="number" value={d.urutan} onChange={(e) => update(i, { urutan: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Deskripsi"><Textarea value={d.deskripsi} onChange={(e) => update(i, { deskripsi: e.target.value })} /></Field>
          <div className="flex gap-2">
            <Button onClick={() => save(d)} disabled={!d.judul.trim()}>Simpan</Button>
            <Button variant="destructive" onClick={() => remove(d)}>Hapus</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MessagesList() {
  const [items, setItems] = useState<Message[]>([]);
  const load = () => supabase.from("messages").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  async function remove(id: string) {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    error ? toast.error(error.message) : load();
  }
  if (!items.length) return <Card><p className="text-muted-foreground">Belum ada pesan masuk.</p></Card>;
  return (
    <div className="space-y-3">
      {items.map((m) => (
        <Card key={m.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">{m.nama} <span className="font-normal text-muted-foreground">({m.email})</span></p>
              <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("id-ID")}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Hapus</Button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{m.pesan}</p>
        </Card>
      ))}
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk Admin - Beranda Maz Afan" },
      { name: "description", content: "Halaman masuk untuk mengelola isi Beranda Maz Afan." },
      { property: "og:title", content: "Masuk Admin - Beranda Maz Afan" },
      { property: "og:description", content: "Halaman masuk pengelola Beranda Maz Afan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"masuk" | "daftar">("masuk");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "masuk") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Cek email Anda untuk konfirmasi akun, lalu masuk.");
        setMode("masuk");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "masuk" ? "Masuk Admin" : "Buat Akun Admin"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "masuk"
              ? "Kelola isi Beranda Maz Afan."
              : "Akun pertama yang mendaftar otomatis menjadi admin."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Kata sandi</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Memproses..." : mode === "masuk" ? "Masuk" : "Daftar"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "masuk" ? "daftar" : "masuk")}
        >
          {mode === "masuk" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </form>
    </div>
  );
}

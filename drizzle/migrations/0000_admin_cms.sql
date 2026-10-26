create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first registered user becomes admin
create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.apps (id uuid primary key default gen_random_uuid(), nama text not null, kategori text not null default 'Umum', deskripsi text not null default '', status text not null default 'Siap Digunakan', url text not null default '', is_featured boolean not null default false, urutan int not null default 0, created_at timestamptz not null default now());
create table public.downloads (id uuid primary key default gen_random_uuid(), judul text not null, jenis text not null default 'PDF', deskripsi text not null default '', url text not null default '', urutan int not null default 0, created_at timestamptz not null default now());
create table public.profile (id int primary key default 1 check (id=1), nama text not null default '', peran text not null default '', tentang text not null default '', foto_url text not null default '', email text not null default '', updated_at timestamptz not null default now());
create table public.messages (id uuid primary key default gen_random_uuid(), nama text not null check (char_length(nama) between 1 and 100), email text not null check (char_length(email) between 3 and 255), pesan text not null check (char_length(pesan) between 1 and 2000), created_at timestamptz not null default now());

grant select on public.apps, public.downloads, public.profile to anon, authenticated;
grant insert, update, delete on public.apps, public.downloads, public.profile to authenticated;
grant insert on public.messages to anon, authenticated;
grant select, delete on public.messages to authenticated;
grant all on public.apps, public.downloads, public.profile, public.messages to service_role;

alter table public.apps enable row level security;
alter table public.downloads enable row level security;
alter table public.profile enable row level security;
alter table public.messages enable row level security;

create policy "public read apps" on public.apps for select to anon, authenticated using (true);
create policy "admin write apps" on public.apps for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read downloads" on public.downloads for select to anon, authenticated using (true);
create policy "admin write downloads" on public.downloads for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "public read profile" on public.profile for select to anon, authenticated using (true);
create policy "admin write profile" on public.profile for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "anyone send message" on public.messages for insert to anon, authenticated with check (true);
create policy "admin read messages" on public.messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete messages" on public.messages for delete to authenticated using (public.has_role(auth.uid(),'admin'));

insert into public.profile (id, nama, peran, tentang, foto_url, email) values (1, 'Maz Afan', 'Guru & Pengembang Aplikasi Sederhana', 'Halo! Saya adalah seorang pendidik yang memiliki ketertarikan tinggi pada integrasi teknologi dalam dunia pendidikan.', '', 'maz.afan@emailku.id');
insert into public.apps (nama,kategori,deskripsi,status,is_featured,urutan) values
('Aplikasi Rapor SD','Administrasi','Alat bantu olah nilai dan cetak deskripsi capaian pembelajaran Kurikulum Merdeka secara otomatis.','Siap Digunakan',true,1),
('Generator Soal AI Helper','Alat Pendidik','Template perintah dan pembuat kuis interaktif berbasis kisi-kisi pembelajaran.','Siap Digunakan',true,2),
('Media Pembelajaran Interaktif','Media Ajar','Kumpulan gim kuis interaktif sains dan matematika dasar untuk siswa sekolah dasar.','Siap Digunakan',true,3),
('Pengacak Kelompok Belajar','Alat Pendidik','Aplikasi sederhana untuk membagi kelompok belajar siswa secara acak dan adil.','Pengembangan',false,4),
('Timer & Bel Kelas Interaktif','Media Ajar','Hitung mundur waktu diskusi kelompok dilengkapi efek suara penanda waktu habis.','Siap Digunakan',false,5);
insert into public.downloads (judul,jenis,deskripsi,urutan) values
('Modul Ajar IPAS Kelas 4 - Kurikulum Merdeka','PDF','Perangkat pembelajaran lengkap Bab 1 sampai Bab 4 dilengkapi LKPD interaktif.',1),
('Template Format Nilai Harian (Excel)','Word / Excel','Format rekapitulasi nilai yang otomatis menghitung rerata dan predikat capaian.',2),
('Panduan Penggunaan Aplikasi Rapor SD','PDF','Buku petunjuk pengisian dan penyelesaian masalah teknis penggunaan aplikasi.',3);
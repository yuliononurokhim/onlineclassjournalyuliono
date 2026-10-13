# Jurnal Kelas Online (EduJournal SD)

Sistem jurnal harian kelas terpadu untuk Sekolah Dasar (SD/MI) dengan 5 peran pengguna (Admin, Guru Kelas, Guru BK, Guru PAI, Orang Tua Murid), landing page informatif transparan, kartu kredensial siap cetak, sistem apresiasi bintang, penanganan bimbingan konseling real-time, penilaian PAI bertingkat, dan ruang chat privat dengan wali murid.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan klarifikasi yang telah dikonfirmasi:
> - **Jenjang Pendidikan**: Sekolah Dasar (SD/MI) dengan apresiasi bintang karakter (Keaktifan, Kebaikan, Disiplin, Ibadah, Kreativitas).
> - **Sistem Penyimpanan & Demo**: LocalStorage terpadu reaktif dilengkapi dengan *Quick Role Switcher* di bar navigasi untuk demo instan ke-5 peran pengguna tanpa kehilangan sesi, di samping form login kredensial standar.
> - **Format Akun Orang Tua**: Tersedia dua format sekaligus: **Kartu Visual Siap Cetak (Print/PDF Layout dengan QR Code & data login unik)** serta **Tabel Kredensial dengan ekspor CSV & fitur salin instan**.

---

## 1. Overview & Core Concept

**EduJournal SD** adalah platform tata kelola kelas inklusif dan transparan yang menjembatani kolaborasi guru kelas, guru spesialis, guru konseling, kepala sekolah/admin, dan orang tua murid secara real-time.

- **Target Persona & Peran**:
  1. **Admin**: Mengelola identitas sekolah (nama, NPSN, alamat, logo/kop surat resmi), kurikulum (mata pelajaran, capaian pembelajaran / CP, tujuan pembelajaran / TP), serta panel reset/bantuan lupa password pengguna.
  2. **Guru Kelas**: Menginput siswa (input manual per siswa atau upload Excel template `.xlsx`/`.csv`), membuat & mencetak kartu login wali murid, mencatat jurnal harian umum kelas, dan memberikan apresiasi bintang harian.
  3. **Guru BK (Bimbingan Konseling)**: Mencatat kondisi/kasus khusus siswa secara terstruktur, memberikan bintang perilaku positif, dan mengirimkan catatan khusus yang tampil langsung di dashboard orang tua anak terkait.
  4. **Guru PAI (Pendidikan Agama Islam)**: Mengelola penilaian harian khusus dengan format fleksibel: Nama Penilaian $\to$ Sub Indikator / Aspek Penilaian $\to$ Ceklist Ketuntasan (Tuntas/Belum Tuntas) + Catatan Pembiasaan Ibadah serta apresiasi bintang.
  5. **Orang Tua Murid**: Dashboard personal hanya untuk anak kandungnya: melihat perolehan bintang prestasi harian, rekap jurnal harian kelas, catatan pendampingan dari BK/PAI, jadwal mata pelajaran, dan percakapan chat langsung dengan guru pendamping.
- **Landing Page Publik**:
  - Halaman depan profesional menampilkan profil sekolah, statistik kelas umum, pengumuman sekolah terkini, kontak transparan guru pendamping, dan form login dengan tab peran/pilihan akun demo.
- **Fitur Chat Aman & Privat**:
  - Komunikasi dua arah terenkripsi secara lokal antara orang tua murid dan guru (Guru Kelas, Guru BK, Guru PAI) dengan riwayat percakapan tersimpan, timestamp, dan status baca.

---

## 2. User Experience & Visual Design

### Visual Identity & Theme
- **Aesthetic Direction**: *Warm Academic Editorial & Playful Discipline* — terinspirasi dari standar aplikasi pendidikan modern Indonesia (bersih, hangat, tipografi berkarakter, bebas dari desain kaku ala birokrasi lama).
- **Color Tokens**:
  - Canvas: `#F8FAFC` (Slate-50) & `#FFFFFF` (White)
  - Primary / Brand: Indigo modern (`#4338CA` / `#3730A3`) dengan aksen Navy Edukasi (`#1E293B`)
  - Aksen Apresiasi: Amber Emas (`#F59E0B`) untuk sistem bintang reward murid
  - Status BK: Rose Netral (`#E11D48`) untuk kasus/pendampingan dan Emerald (`#059669`) untuk resolusi positif
  - PAI Badge: Teal Edukatif (`#0D9488`) untuk indikator capaian ibadah
- **Typography**:
  - Display / Headings: `Plus Jakarta Sans` (font modern, tegas, ramah untuk dunia sekolah)
  - Body & Form: `DM Sans` / `Plus Jakarta Sans` untuk keterbacaan tinggi
  - Angka & Rekapitulasi: `tabular-nums font-mono` untuk tanggal, skor bintang, dan rekap nilai
- **Komponen & Tata Letak**:
  - Header berstandar 3 zona: Logo & Nama Sekolah $\to$ Navigasi Publik/Breadcrumbs $\to$ Tombol Akun / Role Switcher
  - Print Mode khusus untuk Lembar Kartu Siswa (grid 2x3 kartu rapi ukuran kartu pelajar dengan border putus-putus siap potong/gunting).
  - Modal Interaktif untuk import Excel dengan preview tabel data sebelum disimpan ke database.

---

## 3. Key Product Decisions & Trade-Offs

- **Penyimpanan Data Reaktif (Browser Storage + Event Broadcast)**:
  - *Keputusan*: Menggunakan LocalStorage yang diperkaya dengan reactive state listener dan dataset awal yang realistis (mock data sekolah dasar lengkap dengan 8 siswa, 4 pengumuman, histori jurnal, dan catatan kasus).
  - *Alasan*: Memastikan aplikasi bekerja 100% instan tanpa setup database eksternal yang rumit, bebas lag saat berpindah peran di depan penguji/pengguna, dan data tetap tersimpan saat direfresh. Disediakan tombol "Reset ke Data Awal" dan "Ekspor/Impor JSON Cadangan".
- **Excel Upload Parsing**:
  - *Keputusan*: Mendukung file CSV dan format Excel standar dengan template bawaan yang dapat diunduh (nama, NISN, jenis kelamin, nama orang tua, nomor kontak), ditambah fallback parser manual langsung di antarmuka.
- **Privasi Dashboard Orang Tua**:
  - *Keputusan*: Orang tua yang login hanya dapat melihat data spesifik anak yang ditautkan, tanpa mengekspos data pribadi siswa lain di kelas.
- **Sistem Lupa Password Terpusat di Admin**:
  - *Keputusan*: Admin memiliki panel "Bantuan Kredensial & Reset Password" di mana admin dapat melihat daftar pengguna, membuat password sementara yang baru, atau menyalin link login satu klik.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        EduJournal SD Application                       │
├────────────────────────────────────────────────────────────────────────┤
│  Landing Page (Informasi Sekolah, Pengumuman, Kontak Guru, Form Login) │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
    [Role-Based Authentication / Switcher]           │ Public School Info
                    │                                │
┌───────────────────┴────────────────────────────────┴───────────────────┐
│                           Dashboard Views                              │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│  [Admin Panel]  │ [Guru Kelas]     │ [Guru BK]       │ [Guru PAI]      │
│  - Profil & Kop │ - Siswa & Excel  │ - Kasus Siswa   │ - Penilaian Cek │
│  - Mapel, CP/TP │ - Kartu OrangTua │ - Bintang Sikap │ - Nilai Indikator│
│  - Reset Sandi  │ - Jurnal Harian  │ - Laporan Ortu  │ - Bintang Ibadah│
└────────┬────────┴────────┬─────────┴────────┬────────┴────────┬────────┘
         │                 │                  │                 │
         └─────────────────┴────────┬─────────┴─────────────────┘
                                    │
                         [Orang Tua Murid View]
                         - Rekap Bintang Anak
                         - Catatan BK & PAI Real-time
                         - Jurnal Harian Kelas
                         - Chat Dua Arah dengan Guru
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                    Shared State & Persistence Layer                    │
│      - SchoolProfile (Nama, Logo, Kop, CP/TP)                          │
│      - StudentStore (Siswa, NISN, OrangTua, Kredensial Unik)           │
│      - JournalStore (Jurnal Kelas Harian, Tanggal, Materi)             │
│      - StarRewardStore (Bintang dari Guru Kelas, BK, PAI)              │
│      - CaseRecordStore (Catatan BK Real-time)                          │
│      - PaiAssessmentStore (Instrumen Dinamis, Indikator, Ketuntasan)   │
│      - MessageStore (Chat Orang Tua - Guru)                            │
│      - UserCredentialStore (Admin Password Assistance)                 │
└────────────────────────────────────────────────────────────────────────┘
```

### Modul Fitur Rinci:
1. **Landing Page**:
   - Hero banner profil sekolah dengan kop dan visi misi.
   - Papan Pengumuman Sekolah terkini (filter kategori: Akademik, Libur, Kegiatan).
   - Daftar Guru Pendamping Kelas (foto, nama, peran, kontak WhatsApp/Email).
   - Tab Login: Login manual dengan username/password dan Quick Role Launcher untuk demo.
2. **Admin Studio**:
   - Form Kustomisasi Sekolah: Nama Sekolah, Alamat, NPSN, Upload/Pilih Logo, Teks Kop Surat.
   - Manajemen Akademik: Input Mata Pelajaran, Capaian Pembelajaran (CP), dan Tujuan Pembelajaran (TP).
   - Kredensial & Reset Password: Tabel user aktif, status akun, tombol reset sandi instan, dan log audit.
3. **Guru Kelas Workspace**:
   - Manajemen Murid: Form tambah manual + Upload Excel/CSV template download + Edit/Hapus.
   - Generator Kartu Login Orang Tua: Kartu visual dengan QR mockup, ID siswa, username & password unik, tombol "Cetak Semua Kartu" (Window Print bersahabat PDF), dan tombol "Ekspor Tabel Kredensial".
   - Jurnal Harian Kelas: Formulir jurnal harian (Tanggal, Jam Pelajaran, Mapel yang diambil dari data Admin, Capaian Pembelajaran/TP yang dipilih, Uraian Kegiatan, Kehadiran Kelas).
   - Pemberian Bintang Siswa: Modal pemberian bintang harian per siswa dengan kategori (Akademik, Kerjasama, Ketertiban).
4. **Guru BK Workspace**:
   - Catatan Kasus & Konseling: Input tanggal kejadian, nama siswa, jenis kejadian (Ringan/Perlu Perhatian/Prestasi Luar Biasa), tindak lanjut, dan toggle "Laporkan ke Dashboard Orang Tua".
   - Pemberian Bintang Karakter: Bintang Empati, Kejujuran, Kesantunan.
   - Feed Real-time Kasus: Tampilan kronologis kasus siswa.
5. **Guru PAI Workspace**:
   - Pembuat Aspek Penilaian Fleksibel: Tambah instrumen baru (contoh: Praktik Wudhu, Hafalan Juz 30, Pembiasaan Sholat Dhuha).
   - Sub-Indikator Dinamis: Tambah poin-poin ceklist per instrumen (contoh: Tertib Rukun Wudhu, Membaca Doa Setelah Wudhu).
   - Matriks Ketuntasan Kelas: Grid interaktif ceklist (Tuntas / Perlu Bimbingan) per siswa dengan kalkulasi otomatis persentase ketuntasan.
   - Bintang Ibadah: Pemberian bintang pembiasaan ibadah.
6. **Dashboard Orang Tua**:
   - Profil Anak Terpilih: Foto, NISN, Kelas.
   - Top Bar Bintang Kehormatan: Total bintang anak, breakdown perolehan dari Guru Kelas, BK, dan PAI.
   - Tab Jurnal Kelas Hari Ini: Apa yang dipelajari anak hari ini.
   - Tab Catatan Khusus BK & PAI: Umpan balik real-time dari guru BK dan perkembangan capaian PAI.
   - Tab Chat Privat: Ruang obrolan dengan Guru Kelas, Guru BK, atau Guru PAI dengan template sapaan sopan dan balas otomatis interaktif.

---

## 5. Verification Plan

1. **Pengujian Fungsionalitas 5 Peran**:
   - Verifikasi login sebagai Admin $\to$ Ubah nama/kop sekolah $\to$ Periksa perubahan langsung tercermin di header dan kop kartu cetak.
   - Verifikasi Guru Kelas $\to$ Tambah siswa baru & unduh/cetak kartu $\to$ Tulis jurnal harian $\to$ Berikan bintang.
   - Verifikasi Guru BK $\to$ Catat kasus siswa $\to$ Kirim ke dashboard orang tua.
   - Verifikasi Guru PAI $\to$ Buat penilaian baru dengan 3 sub-indikator $\to$ Lakukan ceklist ketuntasan siswa.
   - Verifikasi Orang Tua $\to$ Pastikan hanya data anaknya yang muncul, bintang terhitung akurat, dan dapat mengirim pesan chat ke guru.
2. **Pengujian Cetak & Ekspor**:
   - Uji tombol cetak kartu orang tua (tampilan print-friendly tanpa elemen dashboard pengganggu).
   - Uji ekspor kredensial dan download template Excel.
3. **Kompilasi & Kualitas Kode**:
   - Menjalankan `compile_applet` untuk memastikan bebas error TypeScript dan bundling Vite berjalan mulus.

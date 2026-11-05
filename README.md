# 🌷 Mama's Magical Birthday Experience

**HAPPY BIRTHDAY, MAMA!** — _A Little Universe Filled With Love, Memories & Happiness._

Website ulang tahun interaktif untuk Mama: kotak hadiah 3D pembuka, galeri kenangan
(Polaroid, Carousel 3D, Memory Cards, Cinematic Showcase, Timeline), kue ulang tahun
3D (Three.js), taman bunga parallax, surat cinta dengan efek mengetik, doa & harapan,
hadiah rahasia, dan penutup sinematik. Website ini dibuat ulang dari versi sebelumnya
untuk Bibi. Semua fitur lama tetap ada dan sudah ditingkatkan.

Website ini statis (HTML + CSS + JavaScript murni), jadi tidak perlu proses build dan
bisa langsung di-hosting di GitHub Pages.

---

## 📁 Struktur folder

```
index.html            ← struktur halaman
css/style.css         ← dasar, tombol, opening, hero, dekorasi, kotak hadiah 3D
css/sections.css      ← galeri, timeline, kue, taman, surat, doa, hadiah, finale, responsif
js/config.js          ← ✏️ SEMUA KONTEN YANG BISA DIUBAH ADA DI SINI
js/utils.js           ← helper, deteksi kualitas perangkat, parallax, tilt
js/audio.js           ← musik latar & efek suara (Web Audio)
js/particles.js       ← kelopak, confetti, kilau, hati (canvas)
js/decor.js           ← bunga SVG, kupu-kupu, balon, kotak hadiah 3D
js/gallery.js         ← galeri, carousel, lightbox, timeline
js/cake3d.js          ← kue 3D Three.js + fallback CSS
js/sections.js        ← opening, hero, taman, surat, doa, hadiah, finale
js/main.js            ← inisialisasi, navigasi, kontrol musik, fullscreen
js/vendor/three.min.js← Three.js r149 (MIT), dimuat hanya saat mendekati section kue
sw.js                 ← cache offline (network-first)
assets/photos/        ← 📸 taruh foto Mama di sini
assets/audio/         ← 🎵 (opsional) taruh musik di sini
```

---

## 📸 Mengganti foto Mama

1. Siapkan foto. Disarankan:
   - format **.webp** atau **.jpg**,
   - sisi terpanjang sekitar **1600 px**,
   - ukuran file di bawah **400 KB**.
2. Salin foto ke `assets/photos/`, misalnya `mama-1.webp`, `mama-2.webp`, dan `mama-hero.webp`.
3. Buka `js/config.js`, lalu isi `src` untuk setiap foto:

```js
hero: {
  photo: { src: "assets/photos/mama-hero.webp", alt: "Mama tersenyum", focus: "50% 30%" },
},
photos: [
  {
    src: "assets/photos/mama-1.webp",
    alt: "Mama di taman",
    focus: "50% 25%",        // titik fokus crop: "x% y%" (0% 0% = kiri-atas)
    date: "2019",            // boleh kosong
    title: "Senyum Terindah",
    caption: "Senyum yang selalu menghangatkan rumah.",
    description: "Cerita singkat tentang kenangan ini…",
  },
  // tambah atau hapus item sesuka hati
],
finale: { photo: { src: "" } }, // kosong = memakai foto hero
```

Catatan:
- Jika `src` kosong atau file tidak ditemukan, website menampilkan **placeholder
  ilustrasi bunga**. Placeholder ini sengaja tidak dibuat menyerupai foto asli.
- Thumbnail di galeri dipotong (crop) dengan rapi. Atur bagian yang ingin ditonjolkan
  (misalnya wajah) dengan `focus`. Di Cinematic Showcase, foto selalu ditampilkan utuh.
- Galeri, carousel, dan timeline otomatis mengikuti jumlah foto.

**Kompres ke WebP (opsional):**

```bash
# dengan ImageMagick
magick foto-asli.jpg -resize 1600x1600\> -quality 82 assets/photos/mama-1.webp
# atau dengan cwebp
cwebp -q 82 -resize 1600 0 foto-asli.jpg -o assets/photos/mama-1.webp
```

Bisa juga memakai https://squoosh.app langsung di browser.

---

## ✏️ Mengganti teks, surat, warna, dan pesan

Semua konten ada di **`js/config.js`**:

| Bagian | Kunci di config |
|---|---|
| Nama penerima & judul tab | `recipient`, `pageTitle` |
| Warna tema | `theme` (pink, peach, cream, lavender, lilac, rose, white, gold) |
| Teks pembuka | `opening` |
| Hero (judul, subjudul, tombol, foto) | `hero` |
| Foto & kenangan | `photos` |
| Kue ulang tahun (teks, jumlah lilin) | `cake` |
| Taman bunga | `garden` |
| Isi surat, tanda tangan, kecepatan ketik | `letter` |
| Doa & harapan | `blessings.items` |
| Pesan hadiah rahasia (dan warnanya) | `gifts.items` |
| Penutup | `finale` |
| Musik | `music` |
| Efek suara | `sfx` |
| Teks footer | `footer` |

Di isi surat, gunakan `\n\n` untuk memulai paragraf baru.

---

## 🎵 Musik & efek suara

- Musik **tidak pernah diputar otomatis**. Musik baru mulai setelah Mama menekan
  tombol **OPEN YOUR SPECIAL SURPRISE**. Atur `music.startOnOpen: false` jika ingin
  musik hanya diputar lewat tombol ♫.
- Musik bawaan, **Soft Piano Lullaby**, dibuat langsung oleh browser (Web Audio),
  jadi 100% bebas hak cipta. Ada juga pilihan **Happy Birthday Melody** (melodi domain
  publik, fitur dari versi lama).
- Untuk memakai file musik sendiri, salin file ke `assets/audio/`, misalnya
  `music.mp3`, lalu isi:

```js
music: { src: "assets/audio/music.mp3", title: "Judul Lagu", volume: 0.6, startOnOpen: true },
```

  Gunakan hanya musik yang bebas royalti atau yang sudah memiliki izin.
- Efek suara (buka hadiah, lonceng, confetti, klik) juga dibuat oleh browser.
  Untuk menggantinya dengan file sendiri, isi `sfx.giftOpen`, `sfx.bell`,
  `sfx.confetti`, atau `sfx.click` dengan path file audio.
- Volume dan pilihan lagu bisa diatur lewat ikon 🔊 di pojok kanan atas.
  Pengaturan volume disimpan di browser.

---

## 🚀 Deploy ke GitHub Pages

1. Commit dan push semua file ke branch `main`:
   ```bash
   git add .
   git commit -m "Mama's Magical Birthday Experience"
   git push origin main
   ```
2. Di GitHub, buka **Settings → Pages**.
3. Pada **Source**, pilih **Deploy from a branch**. Pilih branch `main` dan folder
   `/ (root)`, lalu klik **Save**.
4. Tunggu 1–2 menit. Website akan tersedia di:
   `https://<username>.github.io/ultha/`

Semua path di website bersifat relatif, jadi tidak perlu konfigurasi tambahan.

### Menjalankan di komputer sendiri

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

File `index.html` juga bisa dibuka langsung dengan klik dua kali. Namun, cache offline
(service worker) hanya aktif di `https://` atau `localhost`.

---

## ⚙️ Performa & aksesibilitas

- **Kualitas adaptif**: jumlah partikel, kupu-kupu, resolusi 3D, dan bayangan
  menyesuaikan kemampuan perangkat. Kualitas bisa dipaksa lewat URL, misalnya
  `?quality=low`, `?quality=medium`, atau `?quality=high`.
- **Three.js dimuat secara lazy**, hanya saat pengunjung mendekati section kue.
  Render 3D berhenti saat section tidak terlihat atau tab disembunyikan.
- **Fallback**: jika WebGL tidak didukung, kue CSS tetap tampil dan tetap bisa
  "ditiup".
- **prefers-reduced-motion** dihormati: animasi dekoratif dimatikan, partikel
  dikurangi, dan surat langsung tampil utuh.
- Gambar memakai `loading="lazy"`. Musik dijeda otomatis saat tab disembunyikan.
- Navigasi keyboard: tombol panah untuk carousel dan lightbox, `Esc` untuk menutup
  lightbox atau menu.

---

Dibuat dengan 💗 oleh Rafly untuk Mama tersayang.

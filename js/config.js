/* =====================================================================
   MAMA'S MAGICAL BIRTHDAY EXPERIENCE — KONFIGURASI
   ---------------------------------------------------------------------
   Semua teks, foto, warna, isi surat, dan musik bisa diganti di sini
   tanpa menyentuh kode lain. Lihat README.md untuk panduan lengkap.
   ===================================================================== */
window.BIRTHDAY_CONFIG = {
  recipient: "Mama",
  from: "Rafly",
  pageTitle: "Happy Birthday, Mama! 🌷",

  /* Warna tema (dipakai sebagai CSS variables di seluruh website) */
  theme: {
    pink: "#F7C9D9",
    peach: "#FFD9C7",
    cream: "#FFF7ED",
    lavender: "#DCCCF5",
    lilac: "#E9DDF7",
    rose: "#ECAAC5",
    white: "#FFFFFF",
    gold: "#E8D4A5",
  },

  /* Layar pembuka (kotak hadiah 3D) */
  opening: {
    kicker: "A little surprise is waiting for you…",
    button: "OPEN YOUR SPECIAL SURPRISE",
    line1: "Today Is All About You...",
    title: "HAPPY BIRTHDAY, MAMA!",
  },

  /* Hero section.
     photo.src: isi dengan path foto, contoh "assets/photos/mama-hero.jpg".
     Biarkan "" untuk menampilkan placeholder bunga.
     photo.focus: titik fokus foto (CSS object-position) agar wajah tidak terpotong. */
  hero: {
    kicker: "Mama's Magical Birthday Experience",
    title: "Happy Birthday,",
    name: "Mama",
    subtitle: "A Little Universe Filled With Love, Memories & Happiness.",
    tagline:
      "To the most beautiful soul, the heart of our family, and the greatest blessing in our lives.",
    button: "Discover Your Surprise",
    photo: { src: "assets/photos/mama-hero.webp", alt: "Mama tersenyum memakai kerudung krem saat senja", focus: "40% 20%" },
  },

  /* Galeri & timeline kenangan.
     - src     : path foto (disarankan .webp/.jpg ±1600px). "" = placeholder.
     - focus   : object-position untuk crop thumbnail ("50% 30%" = fokus agak ke atas).
     - date    : tahun/tanggal (boleh kosong).
     - title, caption, description : teks kenangan.
     Tambah/kurangi item sesuka hati — galeri, carousel & timeline ikut menyesuaikan. */
  photos: [
    {
      src: "assets/photos/mama-1-senyum-terindah.webp",
      alt: "Mama tersenyum dengan pemandangan pegunungan berkabut di belakangnya",
      focus: "88% 30%",
      date: "",
      title: "Senyum Terindah",
      caption: "Senyum yang selalu menghangatkan rumah.",
      description: "Setiap kali Mama tersenyum, rasanya seluruh dunia ikut menjadi lebih terang.",
    },
    {
      src: "assets/photos/mama-2-doa.webp",
      alt: "Mama berpipi-pipian dengan anak kecil",
      focus: "30% 50%",
      date: "",
      title: "Doa yang Tak Pernah Putus",
      caption: "Di balik setiap langkah kami, ada doa Mama.",
      description: "Terima kasih untuk setiap doa yang Mama panjatkan, bahkan yang tak pernah kami dengar.",
    },
    {
      src: "assets/photos/mama-3-pelukan.webp",
      alt: "Mama dipeluk anaknya di sofa",
      focus: "50% 42%",
      date: "",
      title: "Pelukan Paling Hangat",
      caption: "Tempat pulang yang paling nyaman.",
      description: "Pelukan Mama selalu menjadi tempat teraman untuk melepas lelah.",
    },
    {
      src: "assets/photos/mama-4-keluarga.webp",
      alt: "Mama bersama anak-anak di depan kue ulang tahun",
      focus: "50% 50%",
      date: "",
      title: "Tawa Bersama Keluarga",
      caption: "Momen sederhana yang paling berharga.",
      description: "Tawa Mama adalah musik favorit di rumah kami.",
    },
    {
      src: "assets/photos/mama-5-hari-bahagia.webp",
      alt: "Mama duduk bersama dua anaknya di depan dinding bergambar bunga sakura",
      focus: "50% 50%",
      date: "",
      title: "Hari-Hari Bahagia",
      caption: "Setiap hari bersama Mama adalah hadiah.",
      description: "Kenangan kecil yang selalu ingin kami ulang lagi dan lagi.",
    },
    {
      src: "assets/photos/mama-6-selamanya.webp",
      alt: "Mama tertawa bersandar pada anaknya di bangku rotan",
      focus: "48% 58%",
      date: "",
      title: "Selamanya Sayang Mama",
      caption: "Hari ini, esok, dan selamanya.",
      description: "Apa pun yang terjadi, Mama akan selalu menjadi rumah bagi kami.",
    },
  ],

  /* Kue ulang tahun 3D */
  cake: {
    title: "A Magical Birthday Cake",
    instruction: "Make a Wish, Mama!",
    button: "BLOW THE CANDLES",
    relight: "Light the candles again",
    wishMessage: "May all your beautiful wishes come true.",
    candles: 5,
  },

  /* Taman bunga */
  garden: {
    title: "Mama's Magical Garden",
    subtitle: "Every flower here blooms just for you.",
    hint: "Tap the garden to make the flowers bloom 🌷",
    bloomedHint: "May all of Mama's prayers bloom beautifully 🌸",
  },

  /* Surat untuk Mama. Gunakan "\n" untuk baris baru, "\n\n" untuk paragraf baru. */
  letter: {
    title: "A Letter For Mama",
    hint: "Tap the heart seal to open",
    text:
      "Untuk Mama tersayang,\n\n" +
      "Selamat ulang tahun, Mama.\n\n" +
      "Hari ini adalah hari yang sangat istimewa karena seseorang yang begitu berharga dalam hidup kami sedang merayakan hari kelahirannya.\n\n" +
      "Terima kasih untuk setiap cinta, perhatian, pengorbanan, kesabaran, dan doa yang selalu Mama berikan.\n\n" +
      "Mungkin tidak semua rasa sayang bisa diungkapkan dengan kata-kata. Namun, ketahuilah bahwa Mama adalah salah satu anugerah terindah dalam kehidupan kami.\n\n" +
      "Semoga setiap langkah Mama selalu dipenuhi kesehatan, kebahagiaan, ketenangan, dan keberkahan.\n\n" +
      "Semoga segala doa baik menjadi kenyataan.\n\n" +
      "Semoga senyum Mama tidak pernah hilang.\n\n" +
      "Terima kasih telah menjadi rumah yang selalu penuh kehangatan.\n\n" +
      "We love you, Mama.\n\n" +
      "Happy Birthday!",
    signature: "With all our love,",
    signatureName: "Rafly",
    typingSpeed: 24, // milidetik per huruf
  },

  /* Doa & harapan */
  blessings: {
    title: "Beautiful Wishes For You",
    items: [
      { icon: "🌿", text: "Semoga Mama selalu diberikan kesehatan." },
      { icon: "✨", text: "Semoga umur Mama dipenuhi keberkahan." },
      { icon: "🌸", text: "Semoga setiap hari menghadirkan kebahagiaan." },
      { icon: "🍀", text: "Semoga segala urusan dipermudah." },
      { icon: "💞", text: "Semoga selalu dikelilingi orang-orang yang menyayangi Mama." },
      { icon: "😊", text: "Semoga senyum indah Mama selalu menghiasi hari-hari." },
    ],
  },

  /* Hadiah rahasia */
  gifts: {
    title: "Secret Gifts For You",
    subtitle: "Three little boxes, three little messages. Tap to open!",
    allOpened: "All gifts are open — one last surprise is waiting below ↓",
    items: [
      { label: "Gift 1", message: "Thank you for everything, Mama.", color: "#F7C9D9", ribbon: "#E8D4A5" },
      { label: "Gift 2", message: "You are loved more than words can express.", color: "#DCCCF5", ribbon: "#FFFFFF" },
      { label: "Gift 3", message: "Your happiness means everything to us.", color: "#FFD9C7", ribbon: "#ECAAC5" },
    ],
  },

  /* Penutup. photo kosong = memakai foto hero. */
  finale: {
    title: "WE LOVE YOU, MAMA!",
    subtitle: "Forever grateful to have you in our lives.",
    birthday: "HAPPY BIRTHDAY!",
    blessing: "THANK YOU FOR BEING OUR GREATEST BLESSING.",
    closing: "We love you, always and forever.",
    photo: { src: "", alt: "Foto Mama", focus: "50% 30%" },
  },

  /* Musik latar.
     src: path file musik bebas royalti, contoh "assets/audio/music.mp3".
     Jika kosong / gagal dimuat, website memainkan piano lembut yang
     dibuat langsung oleh browser (Web Audio) — 100% bebas hak cipta. */
  music: {
    src: "",
    title: "Soft Piano Lullaby",
    volume: 0.6,
    startOnOpen: true, // mulai setelah Mama menekan tombol pembuka (bukan autoplay)
  },

  /* Efek suara opsional (kosong = suara sintetis bawaan) */
  sfx: {
    giftOpen: "",
    bell: "",
    confetti: "",
    click: "",
  },

  footer: "Dibuat dengan 💗 oleh Rafly untuk Mama tersayang",
};

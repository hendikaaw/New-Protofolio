# Interactive Glassmorphic & Terminal Portfolio

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

Sistem portofolio web interaktif yang menggabungkan estetika antarmuka modern Apple Glassmorphism dengan fungsionalitas antarmuka baris perintah (Command Line Interface / CLI) berarsitektur Linux. Proyek ini dibangun untuk menyajikan profil profesional, rekam jejak pengalaman, proyek sistem, dan kompetensi teknis melalui pengalaman pengguna yang unik, responsif, dan terstruktur.

---

## Ringkasan Arsitektur & Fitur Utama

- **Apple-Inspired Glassmorphic UI**: Mengimplementasikan efek kustom *frosted glass* (`backdrop-filter`), *ambient glowing background orbs*, transisi mikro responsif, serta *floating dock navigation*.
- **Interactive Linux CLI Terminal**: Emulator terminal web fungsional yang mendukung eksekusi perintah shell, manipulasi direktori, dan penanganan status sistem.
- **Persistent Virtual File System (VFS)**: Sistem berkas virtual berbasis objek JSON yang tersimpan secara persisten pada *browser local storage*.
- **Integrated Vim Text Editor**: Editor teks *in-terminal* (perintah `vi`) dengan dukungan *Normal Mode* dan *Insert Mode* untuk pembuatan dan penyuntingan berkas real-time.
- **Embedded Terminal Game Engine**: Implementasi permainan Snake berbasis karakter ASCII yang berjalan secara langsung di dalam buffer terminal (`play snake`).
- **Privilege Escalation & Root Mode**: Simulasi hak akses tingkat lanjut (*Sudo Mode*) yang mengubah tata letak antarmuka dan skema warna secara dinamis.
- **Gemini AI CLI Assistant**: Engine simulasi asisten cerdas berbasis CLI untuk merespons kueri seputar rekam jejak teknis pengguna.
- **Global Command Palette**: Modul navigasi cepat berbasis pintasan papan ketik (`Ctrl + K` / `Cmd + K`) untuk aksesibilitas lintas halaman.
- **Dynamic Theme Engine**: Sistem manajemen tema berbasis CSS Variables (*Hacker Dark*, *Blood Maroon*, *Cyberpunk*, dan *Light Mode*).

---

## Spesifikasi Teknologi

| Komponen | Teknologi / Framework | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Core** | HTML5 / CSS3 / JavaScript (ES6+) | Tanpa dependensi framework berat (*Zero-dependency vanilla stack*). |
| **Styling Engine** | Modern CSS Variables & Flexbox/Grid | Penanganan tata letak responsif dan pencahayaan dinamis. |
| **Iconography** | Font Awesome 6 CDN | Penyediaan ikonografi antarmuka yang konsisten. |
| **Typography** | Inter & JetBrains Mono (Google Fonts) | Kombinasi font sans-serif modern dan monospace ala terminal. |
| **Storage Engine** | Web Storage API (LocalStorage) | Persistensi status Virtual File System dan konfigurasi tema. |

---

## Panduan Memulai dan Penggunaan Lokal

Proyek ini dibangun menggunakan teknologi web murni sehingga tidak memerlukan proses kompilasi, *bundling*, atau *dependency installation*.

### 1. Kloning Repositori

```bash
git clone [https://github.com/username/portfolio.git](https://github.com/username/portfolio.git)
cd portfolio

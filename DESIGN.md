# ClarityLab interface

Beranda mengantar pengunjung langsung ke pemilihan gambar. Editor berfokus pada preview asli dan laporan analisis yang dapat dipindai.

## Visual language
Putih kehijauan #fcfdfb untuk halaman, teal #14594f untuk aksi dan navigasi, hijau pucat #edf4ef untuk area upload, abu-abu netral #eef0ef untuk preview. Teks utama #173e38 dan sekunder #52635f. Peringatan memakai kuning gelap #745215; error merah #a12c33. Preview tidak diberi filter.

Segoe UI sebagai font lokal yang jelas untuk alat kerja, tanpa unduhan font atau dependency. Judul besar, bobot 650; isi 16px. Label sekunder 13–14px. Tombol minimum tinggi 48px, radius 8px; panel radius 14px. Border tipis, tanpa shadow panel. SVG geometris sebagai logo dan simbol upload.

## Layout
Desktop: hero dua kolom, penjelasan di kiri dan upload di kanan. Fitur dalam daftar berbatas garis. Editor memakai preview lebar di kiri dan analisis di kanan. Di bawah 720px, kolom bertumpuk dengan preview sebelum laporan. Navbar tetap menyediakan Beranda dan Editor.

## Interaction and state
Satu dokumen bersama untuk kedua URL. History API mempertahankan File dan object URL di memori. Navigasi Back/Forward mengikuti URL, tidak membuat ulang analisis. Ganti gambar membatalkan analisis lama; respons lama tidak boleh mengganti laporan baru. Validasi gagal mempertahankan gambar sebelumnya. Object URL sementara dan yang diganti dilepas.

Status kosong, loading, sukses, error dan retry tersedia. Focus terlihat, skip-link, status live, teks error, dan reduced-motion. Transformasi mendatang ditandai secara eksplisit.

PhotoFix memperluas Editor dengan kontrol Auto Fix dan form Manual Fix dalam disclosure native. Kontrol dinonaktifkan sebelum gambar dipilih. Hasil tampil di dalam panel preview yang sama: sebelum–sesudah berdampingan pada desktop dan bertumpuk di mobile. Teks label membedakan asli dan hasil tanpa filter CSS. Tautan download memakai blob yang sama dengan preview hasil dan hanya tersedia setelah proses sukses.

Mengubah pengaturan manual atau mengganti gambar membatalkan request PhotoFix yang lama dan menghapus hasil/download sebelumnya. Reset ke asli mengembalikan parameter manual netral serta menyisakan preview dan laporan asli. Navigasi tanpa reload tetap mempertahankan gambar dan hasil. Warna, tipografi, tombol, dan status mengikuti sistem yang sama.

DocuClear memakai komponen dan layout PhotoFix yang sama, dengan pilihan hitam-putih/grayscale dan checkbox pengurangan noise. Kedua alat berbagi satu preview hasil, status proses, ringkasan parameter, serta download di bawah preview. Label hasil menyebut alat yang menghasilkan gambar; tombol download mengikuti format JPG (PhotoFix) atau PNG (DocuClear). Memproses hasil baru menggantikan hasil sebelumnya. Reset pada salah satu alat mengosongkan hasil bersama dan mengembalikan kedua form ke default. Integrasi DocuClear belum diverifikasi visual; pengujian diserahkan ke pengguna sesuai permintaan.

StencilMaker memakai layout alat yang sama, slider threshold dengan nilai numerik, dan checkbox negatif. Ketiga alat berbagi preview/status/download; reset mengembalikan semua form, dan hasil StencilMaker berupa PNG. Integrasi terbaru belum diuji atas permintaan pengguna.

Copy mengikuti arahan pengguna: tanpa slogan akun/AI/penyimpanan, baris prinsip promosi, footnote upload, keterangan sesi pada footer, atau instruksi berulang untuk membandingkan/download. Bantuan yang memengaruhi pilihan, batas upload, dan pesan error dipertahankan. Footer hanya memuat identitas ClarityLab.

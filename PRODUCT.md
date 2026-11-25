# ClarityLab
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users and purpose
Aplikasi publik untuk memahami kualitas gambar dan melakukan transformasi citra. Proyek mata kuliah Pengolahan Citra dengan materi transformasi spasial dan frekuensi.

## Stack
Flask, OpenCV, NumPy, HTML, CSS, JavaScript. Target hosting Vercel; belum di-deploy pada tahap ini.

## Workflow and constraints
Upload satu JPG/JPEG/PNG, maks. 3 MB dan 2048 × 2048 piksel sesuai backend saat ini. Langsung masuk Editor tanpa reload, tampilkan preview, lakukan analisis brightness/contrast/sharpness otomatis, tampilkan rekomendasi. File disimpan dalam memori browser dan diproses in-memory di backend tanpa database atau penyimpanan permanen. Refresh mengosongkan sesi. Tanpa akun atau riwayat.

## Scope and truth
API health, analisis kualitas, dan PhotoFix sudah diimplementasikan. PhotoFix menyediakan Auto Fix, Manual Fix (gamma/log, contrast stretching, sharpening), preview sebelum–sesudah, reset, dan download JPG. Selalu mengolah gambar asli; hasil tidak menumpuk. Hasil JPG tidak mempertahankan transparansi/metadata. Laporan kualitas tetap merujuk asli. Verifikasi otomatis dan alur browser desktop selesai pada 24 November 2026; rincian dan batas pengujian ada di README.md.

DocuClear baru diimplementasikan: grayscale, contrast stretching, median filter opsional, thresholding adaptif, preview bersama, dan download PNG. Implementasi serta integrasi terbaru belum diuji; pengguna meminta melakukan pengujian sendiri. Hasil verifikasi PhotoFix di atas adalah catatan sebelum perubahan integrasi DocuClear.

StencilMaker diimplementasikan dengan threshold biner global 0–255 (default 128), image negative opsional, preview bersama, dan download PNG. Integrasi ketiga alat belum diuji ulang; pengguna melakukan pengujian sendiri. Konfigurasi Vercel disiapkan dengan entrypoint src/index.py, Python 3.12, dependency langsung terkunci, dan pengecualian file pengembangan. Build dan deployment Vercel belum dilakukan.

## Brand commitments
Nama ClarityLab, bahasa Indonesia. Pengguna belum memiliki identitas warna dan meminta saran.

Pengguna meminta teks antarmuka ringkas: hapus klaim tanpa akun/registrasi, tanpa AI, penyimpanan permanen, peringatan refresh pada footer, dan keterangan yang berulang atau tidak membantu tindakan. Tetap tampilkan bantuan parameter, batas file, status proses dan error yang berguna. Detail implementasi dan batas teknis disimpan di dokumentasi.

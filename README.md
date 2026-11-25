# ClarityLab

Aplikasi Flask untuk memeriksa dan memperbaiki kualitas gambar dengan OpenCV dan NumPy. Tampilan Beranda dan Editor memakai HTML, CSS, dan JavaScript tanpa framework tambahan.

## Jalankan di Windows

Dari folder proyek:

~~~powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run.py
~~~

Buka http://127.0.0.1:5000. Dev server memakai debug dari run.py; gunakan hanya untuk pengembangan. Untuk preview tanpa debugger/reloader:

~~~powershell
.\.venv\Scripts\python.exe -m flask --app src.index:app run --no-debugger --no-reload --port 5000
~~~

## Kolaborasi melalui GitHub

Untuk anggota tim yang baru menyiapkan proyek:

~~~powershell
git clone https://github.com/NessLM/ClarityLab.git
cd ClarityLab
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run.py
~~~

Gunakan Python 3.12. Virtual environment, cache, dan konfigurasi rahasia tidak ikut repository; setiap anggota membuat `.venv` sendiri. Untuk memakai perintah singkat, aktifkan environment dengan `.\.venv\Scripts\Activate.ps1`, lalu jalankan `python run.py`.

Untuk perubahan berikutnya, buat branch sendiri agar pekerjaan tim tidak saling menimpa:

~~~powershell
git switch main
git pull --ff-only
git switch -c fitur/nama-perubahan
# Edit file, lalu periksa perubahan sebelum commit.
git status
git add .
git commit -m "Jelaskan perubahan"
git push -u origin fitur/nama-perubahan
~~~

Buka pull request dari branch tersebut ke `main`. Setelah branch pernah dipush, perubahan berikutnya cukup di-commit lalu `git push`. Anggota tim memerlukan akses write dari pemilik repository untuk push langsung; siapa pun yang bisa membaca repository dapat clone.

## Persiapan Vercel

Konfigurasi deployment sudah disiapkan; belum dipublikasikan atau diuji build-nya di Vercel. Fitur dan tampilan tidak berubah pada tahap persiapan ini.

- `src/index.py` mengekspor instance Flask `app` dari factory yang sama dengan aplikasi lokal. `run.py` memakai instance tersebut untuk pengembangan.
- `.python-version` memilih Python 3.12. Vercel menentukan patch yang tersedia untuk seri tersebut.
- `requirements.txt` mengunci dependency langsung sesuai versi pada `.venv`: Flask 3.1.3, NumPy 2.5.5, OpenCV headless 4.14.0.94. Dependency transitif mengikuti resolver paket; ini bukan lockfile lengkap. Tidak diperlukan Gunicorn atau dependency frontend.
- `vercel.json` memakai preset Flask dengan durasi maksimum function 30 detik. File pengembangan dikecualikan dari bundle function. Templates dan services tetap disertakan.
- `public/` dikirim sebagai aset statis dan dilayani CDN Vercel pada URL yang sama (`/css`, `/js`, `/assets`); folder ini tidak dimasukkan ulang ke bundle Python. Flask tetap melayani aset yang sama pada server lokal.
- `.vercelignore` mengecualikan virtual environment, cache, data pengujian, metadata lokal dan `.env` dari upload deployment. `.gitignore` mengecualikan file lokal dari commit berikutnya; file yang sudah terlanjur tracked harus ditinjau terpisah.

Saat siap deploy melalui dashboard Vercel:

1. Push source ke repository GitHub, lalu import repository di Vercel.
2. Pilih root folder yang berisi `vercel.json`, `requirements.txt`, dan folder `src`. Gunakan **Framework Preset: Flask**.
3. Biarkan override Build Command, Install Command, dan Output Directory nonaktif agar preset menangani build. Aplikasi ini tidak memerlukan environment variable, database, atau penyimpanan upload.
4. Buat deployment Preview, lalu periksa `/api/health`, `/`, `/editor`, aset statis, upload dan hasil ketiga alat sebelum promosi ke Production.

Untuk preview menggunakan runtime Vercel, setelah Vercel CLI tersedia dan project terhubung, jalankan `vercel dev` dari root proyek. Server Flask lokal hanya memverifikasi aplikasi lokal dan tidak menggantikan build Vercel.

Batas aplikasi tetap 3 MiB/file, resolusi 2048 × 2048, dan hasil maksimum 4 MiB. Batas default request/response Vercel adalah 4,5 MB dan bundle Python standar 500 MB. Ukuran bundle OpenCV/NumPy, cold start, dan kompatibilitas instalasi Linux perlu diperiksa pada build Preview sesungguhnya.

Rujukan: [Flask di Vercel](https://vercel.com/docs/frameworks/backend/flask), [runtime Python](https://vercel.com/docs/functions/runtimes/python), dan [batas Functions](https://vercel.com/docs/functions/limitations).

## Yang tersedia

- Beranda responsif, pemilihan file dan drag-and-drop.
- Upload JPG/JPEG/PNG, maksimum 3 MB, resolusi maksimum 2048 × 2048 piksel sesuai backend.
- Preview gambar asli dan navigasi Beranda–Editor tanpa reload, termasuk Back/Forward.
- Analisis kecerahan, kontras, ketajaman dan rekomendasi dari POST /api/quality.
- PhotoFix Auto Fix dan Manual Fix: gamma, logaritmik, contrast stretching, dan sharpening.
- DocuClear dengan hasil hitam-putih adaptif atau grayscale, serta pengurangan noise opsional.
- StencilMaker dengan threshold 0–255 dan image negative.
- Preview sebelum–sesudah, reset ke gambar asli, download JPG untuk PhotoFix serta PNG untuk DocuClear/StencilMaker.
- Status kosong, loading, sukses, error, dan retry.
- Satu gambar di memori browser; refresh mengosongkan sesi. Backend tidak menyimpan upload permanen.

DocuClear dan StencilMaker sudah diimplementasikan, tetapi integrasi terbaru belum diuji; pengujian diserahkan kepada pengguna sesuai permintaan. Konfigurasi Vercel sudah disiapkan; build dan deployment di Vercel belum dilakukan.

## Menggunakan PhotoFix

1. Pilih atau tarik satu JPG/PNG pada Beranda atau Editor. Preview asli dan analisis kualitas terbuka otomatis.
2. Pada bagian PhotoFix, klik **Jalankan Auto Fix**, atau buka **Manual Fix** untuk mengatur parameter sendiri.
3. Untuk Manual Fix, pilih Gamma Transformation atau Logarithmic Transformation, atur sharpening, dan aktifkan contrast stretching bila dibutuhkan. Klik **Terapkan Manual Fix** untuk memproses; slider tidak memanggil API setiap kali digeser.
4. Bandingkan gambar **Sebelum · Asli** dan **Sesudah · PhotoFix**. Desktop menampilkan keduanya berdampingan; layout mobile menumpuknya secara vertikal.
5. Klik **Download hasil JPG** di bawah preview. Nama file mengikuti `<nama-asli>-photofix.jpg`; browser dapat menambah nomor jika nama tersebut sudah ada.
6. **Reset ke asli** menghapus preview hasil, tautan download, dan mengembalikan parameter manual ke nilai netral. Gambar asli dan laporan kualitas tetap ada.

Setiap pemrosesan dimulai dari File asli, bukan hasil percobaan sebelumnya. Mengubah pengaturan manual membatalkan proses dan menghapus hasil lama sampai diterapkan lagi. Mengganti gambar juga mengosongkan hasil dan pengaturan. Navigasi Beranda–Editor tidak menghapus sesi; refresh menghapusnya.

### Cara kerja dan batasan

PhotoFix mengolah kanal luminansi Y pada ruang YCrCb, kemudian mengubahnya kembali ke BGR. Urutan proses: contrast stretching (opsional), transformasi gamma/logaritmik, lalu unsharp masking berbasis Gaussian blur (opsional). Tidak menggunakan AI.

- **Auto Fix:** contrast stretching memakai minimum–maksimum aktual jika kontras di bawah 38 dan rentang intensitas melebihi 10. Rentang penuh mempertahankan detail terang yang jarang muncul. Setelah stretching, gamma dipilih menuju intensitas rata-rata sekitar 127,5 bila rata-rata masih di bawah 85 atau di atas 185, dibatasi 0,3–3. Sharpening 0,4 dipakai jika variansi Laplacian di bawah 65 dan simpangan baku intensitas minimal 3.
- **Manual Fix:** gamma 0,3–3, dengan 1 netral, di atas 1 lebih terang, di bawah 1 lebih gelap. Logaritmik memakai `log(1 + 9x) / log(10)` untuk intensitas ternormalisasi x; slider gamma tidak digunakan. Contrast stretching manual memakai persentil 2–98 dan dapat memangkas detail di luar rentang tersebut. Sharpening 0–2, dengan 0 nonaktif.
- Area dengan intensitas tunggal tidak direntangkan. Gambar hitam/putih polos tidak dipaksa berubah oleh Auto Fix.
- Auto Fix memakai heuristik; hasil tidak selalu lebih baik untuk setiap foto. Sharpening dapat mempertegas noise dan tidak memulihkan detail yang sudah hilang.
- Angka pada panel pemeriksaan kualitas tetap merujuk gambar asli, bukan hasil PhotoFix.
- Preview hasil dan download memakai blob JPG yang sama, kualitas encoder 90 dan resolusi tetap. Kompresi JPEG bersifat lossy; pengaturan netral sekalipun dapat menghasilkan piksel download yang berbeda dari asli. Transparansi PNG dan metadata asli tidak dipertahankan.
- Gambar tidak disimpan permanen di server. Hasil download menjadi file lokal yang disimpan browser atas permintaan pengguna.

## API PhotoFix

`POST /api/photo-fix`, body `multipart/form-data`:

| Field | Nilai | Default |
| --- | --- | --- |
| `image` | File JPG/JPEG/PNG, maks. 3 × 1024² byte dan 2048 × 2048 piksel | Wajib |
| `mode` | `auto` atau `manual` | `auto` |
| `method` | `gamma` atau `log` (manual) | `gamma` |
| `gamma` | Angka finite 0.3–3 (manual) | `1` |
| `stretch` | String `true` atau `false` (manual) | `false` |
| `sharpen` | Angka finite 0–2 (manual) | `0` |

Dalam mode otomatis, backend memilih parameter dan mengabaikan parameter manual. Dalam mode manual, semua parameter divalidasi, termasuk gamma walaupun metode log dipilih. Gunakan titik untuk angka desimal pada request API; antarmuka menampilkan angka dalam format Indonesia.

Sukses: `200 image/jpeg` dengan `Content-Disposition: attachment`, `Cache-Control: no-store`, dan header `X-PhotoFix-Settings` berisi JSON parameter yang diterapkan. Respons berupa biner langsung, tanpa base64 atau file sementara di server.

Error validasi: `400` dengan JSON `status` dan `message`. Hasil lebih besar dari 4 MiB ditolak dengan `413`; batas request Flask sebesar 3 MiB + 64 KiB juga dapat menghasilkan `413` HTML. Kegagalan encoding mengembalikan `500`. Frontend menangani respons error JSON maupun non-JSON dan timeout setelah 30 detik; pengguna dapat menjalankan proses lagi. Batas payload hosting sebenarnya belum diverifikasi melalui deployment.

## Menggunakan DocuClear

1. Upload foto dokumen menggunakan alur yang sama dengan PhotoFix.
2. Buka bagian **DocuClear** di Editor. Pilih **Hitam-putih** untuk tulisan atau **Grayscale** untuk mempertahankan gradasi.
3. Aktifkan **Kurangi noise** bila gambar berbintik. Opsi ini nonaktif secara default karena filter median dapat menghapus goresan tulisan tipis.
4. Klik **Terapkan DocuClear**. Preview bersama akan menampilkan **Sebelum · Asli** dan **Sesudah · DocuClear**.
5. Klik **Download hasil PNG** di bawah preview untuk menyimpan `<nama-asli>-docuclear.png`.
6. Klik **Reset ke asli** untuk menghapus hasil dan mengembalikan pengaturan semua alat ke default.

Semua alat memakai satu area hasil dan satu download. Hasil terbaru menggantikan hasil sebelumnya, tidak menumpuk transformasi. Memilih pengaturan lain menghapus hasil lama; klik terapkan lagi untuk menghasilkan preview baru. Mengganti gambar membatalkan proses yang masih berjalan. Laporan kualitas tetap merujuk gambar asli.

Urutan DocuClear: grayscale → median 3 × 3 (opsional) → contrast stretching persentil 2–98 → adaptive Gaussian threshold (mode hitam-putih, blok 31 dan C = 11). Bila rentang persentil datar, stretching dilewati. Mode grayscale berhenti sebelum thresholding. PNG menggunakan kompresi lossless dan mempertahankan resolusi, tetapi warna, transparansi, dan metadata asli tidak dipertahankan.

DocuClear tidak melakukan OCR, mengoreksi perspektif, merotasi halaman, atau memulihkan tulisan yang hilang. Thresholding dan stretching dapat menghilangkan detail tipis atau mengubah area gelap yang rata; coba grayscale atau nonaktifkan pengurangan noise bila perlu.

### API DocuClear

`POST /api/docu-clear`, body `multipart/form-data`:

| Field | Nilai | Default |
| --- | --- | --- |
| `image` | JPG/JPEG/PNG dengan batas upload yang sama | Wajib |
| `mode` | `binary` atau `grayscale` | `binary` |
| `denoise` | String `true` atau `false` | `false` |

Sukses: `200 image/png`, `Content-Disposition: attachment`, `Cache-Control: no-store`, dan header `X-DocuClear-Settings` berisi JSON `mode` serta `denoise` yang diterapkan. Validasi gagal mengembalikan `400` JSON; hasil lebih dari 4 MiB ditolak dengan `413`; kegagalan encoding mengembalikan `500`. Request terlalu besar dapat menghasilkan `413` HTML dari Flask. Frontend memakai penanganan error dan timeout 30 detik yang sama dengan PhotoFix. Preview dan download menggunakan blob hasil yang sama.

## Menggunakan StencilMaker

1. Upload gambar, lalu buka bagian **StencilMaker** di Editor.
2. Atur **Threshold** antara 0 dan 255 (default 128). Sebelum efek negatif, intensitas grayscale di atas threshold menjadi putih; intensitas lainnya menjadi hitam.
3. Aktifkan **Negatif** untuk menukar hitam dan putih setelah thresholding.
4. Klik **Buat stencil**, bandingkan preview sebelum–sesudah, lalu klik **Download hasil PNG** di bawah preview.
5. File disimpan sebagai `<nama-asli>-stencilmaker.png`. Reset ke asli menghapus hasil dan mengembalikan pengaturan seluruh alat ke default.

Pemrosesan selalu dimulai dari gambar asli: grayscale → threshold biner global → image negative opsional. Resolusi tetap, hasil hanya bernilai 0/255, dan PNG tidak menambahkan kompresi lossy. Warna, transparansi, dan metadata asli tidak dipertahankan. Thresholding global dapat menghilangkan detail pada gambar dengan pencahayaan tidak merata; sesuaikan ambang sesuai gambar. StencilMaker tidak menambahkan jembatan penghubung yang diperlukan untuk stencil potong fisik.

### API StencilMaker

`POST /api/stencil-maker`, body `multipart/form-data`:

| Field | Nilai | Default |
| --- | --- | --- |
| `image` | JPG/JPEG/PNG dengan batas upload yang sama | Wajib |
| `threshold` | Bilangan bulat 0–255 | `128` |
| `negative` | String `true` atau `false` | `false` |

Sukses: `200 image/png`, `Content-Disposition: attachment`, `Cache-Control: no-store`, dan header `X-StencilMaker-Settings` berisi JSON threshold serta status negatif yang diterapkan. Validasi gagal mengembalikan `400` JSON; hasil lebih dari 4 MiB ditolak dengan `413`; kegagalan encoding mengembalikan `500`. Batas request Flask, timeout, pembatalan respons lama, preview, dan download mengikuti alur bersama PhotoFix/DocuClear.

Implementasi StencilMaker dan perubahan integrasi bersama belum dijalankan atau diuji oleh agen, sesuai permintaan pengguna. Checklist untuk pengujian mandiri: coba threshold 0/128/255, negatif aktif/nonaktif, gambar seragam, download PNG, reset, ganti gambar saat proses berjalan, dan bergantian memakai ketiga alat. Pastikan negatif membalik hasil normal, nama/format download sesuai alat terakhir, dan hasil lama tidak muncul kembali.

## Struktur antarmuka

- app/templates/index.html: dokumen bersama, Beranda, navigasi, footer.
- app/templates/editor.html: memakai dokumen bersama pada URL /editor.
- app/templates/_editor.html: preview, analisis dan rekomendasi.
- public/css/style.css: tema dan tata letak responsif.
- public/js/editor.js: state memori dan History API.
- public/js/upload.js: validasi, preview, dan drag-and-drop.
- public/js/quality.js: request analisis, pembatalan request lama, laporan dan retry.
- public/js/photo-fix.js: kontrol ketiga alat dan alur bersama pembatalan proses, preview hasil, reset dan download.
- app/services/photo_fix.py: validasi parameter dan transformasi luminansi.
- app/services/docu_clear.py: validasi mode, grayscale, filtering, contrast stretching dan thresholding dokumen.
- app/services/stencil_maker.py: validasi threshold, thresholding biner dan image negative.
- app/routes/image_api.py: API analisis kualitas dan endpoint biner ketiga alat.

Fondasi Flask, API analisis kualitas, validasi upload, dan konfigurasi sebelumnya tetap dipakai. Ketiga alat menggunakan service dan endpoint terpisah tanpa dependency tambahan.

## Pengujian

~~~powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
node --test tests/frontend.test.cjs
~~~

Hasil verifikasi PhotoFix pada **24 November 2026**, sebelum penambahan DocuClear dan perubahan alur preview bersama:

| Pemeriksaan | Hasil |
| --- | --- |
| 11 tes Python | Lolos: halaman/API, batas upload, arah gamma/log, citra polos, stretching, sharpening, validasi parameter, dan regresi detail terang yang jarang muncul |
| 7 tes JavaScript | Lolos: upload, navigasi, retry, pemrosesan dari asli, pembatalan respons lama, reset dan tautan download |
| Opera GX desktop, Flask lokal | File picker → upload → analisis → Auto Fix → before–after → download JPG selesai |
| Manual gamma 1,55 dan sharpening 0,4 | Preview berubah, parameter hasil sesuai, download JPG selesai |
| Manual logaritmik dan contrast stretching | Proses berhasil, gamma nonaktif, ringkasan sesuai |
| Reset ke asli | Parameter kembali netral, hasil/download tersembunyi, preview asli tetap tampil |
| Pemeriksaan dua file download | Auto 12.887 byte dan manual gamma 10.946 byte; keduanya dapat didekode sebagai 640 × 480 dan byte-nya identik dengan keluaran API untuk parameter yang sama |

Citra uji sintetis tersedia di `tests/photofix-sample.png`. Untuk mengulang secara manual, gunakan file ini dan alur PhotoFix di atas. Hasil Auto Fix mempertahankan tulisan terang yang menempati sebagian kecil gambar; regression test berada di `tests/test_photo_fix.py`.

Tes JavaScript memakai DOM/jaringan simulasi. Screenshot Beranda, Editor, dan panel PhotoFix kosong sudah diperiksa pada ukuran 1440 × 900 serta 390 × 844; interaksi before–after dan download di atas diuji langsung pada browser desktop. Pengujian di perangkat mobile fisik, lintas-browser, deployment, dan penilaian pada kumpulan foto nyata belum dilakukan.

### Checklist DocuClear untuk pengguna

Implementasi DocuClear belum dijalankan, dites, atau diperiksa melalui browser oleh agen, sesuai permintaan pengguna. Hasil tes PhotoFix di atas merupakan catatan sebelumnya, bukan verifikasi ulang integrasi terbaru.

- Coba dokumen JPG dan PNG di kedua mode; pastikan preview asli tetap utuh dan label hasil sesuai.
- Coba pengurangan noise aktif/nonaktif pada tulisan tipis dan gambar berbintik.
- Download hasil PNG, buka file tersebut, dan cocokkan dengan preview serta resolusi aslinya.
- Bergantian jalankan PhotoFix dan DocuClear; periksa label, format download JPG/PNG, dan hasil terbaru.
- Ubah pengaturan, reset ke asli, dan ganti gambar saat proses berjalan; pastikan hasil lama tidak muncul kembali.
- Coba navigasi Beranda–Editor, error jaringan, gambar tidak valid, batas ukuran/resolusi, dan tampilan mobile.

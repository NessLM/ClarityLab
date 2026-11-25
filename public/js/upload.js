"use strict";
(() => {
    const input = document.getElementById("imageInput");
    const error = document.getElementById("uploadError");
    const fileStatus = document.getElementById("fileStatus");
    let selection = 0;

    async function upload(file) {
        if (!file) return;
        const current = ++selection;
        let url;
        error.hidden = true;
        fileStatus.textContent = "Memeriksa file gambar…";
        try {
            if (!/\.(jpe?g|png)$/i.test(file.name) || (file.type && !["image/jpeg", "image/png"].includes(file.type))) {
                throw new Error("Format gambar harus JPG, JPEG, atau PNG. Silakan pilih file lain.");
            }
            if (!file.size) throw new Error("File gambar kosong. Silakan pilih file lain.");
            if (file.size > 3 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 3 MB. Silakan pilih gambar yang lebih kecil.");
            url = URL.createObjectURL(file);
            const image = new Image();
            image.src = url;
            try { await image.decode(); }
            catch { throw new Error("File tidak dapat dibaca sebagai gambar. Silakan pilih JPG atau PNG yang valid."); }
            if (image.naturalWidth > 2048 || image.naturalHeight > 2048) {
                throw new Error("Resolusi gambar maksimal 2048 × 2048 piksel. Perkecil gambar terlebih dahulu.");
            }
            if (current !== selection) return;
            const state = window.claritylab;
            if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
            state.file = file;
            state.resetProcessing();
            state.previewUrl = url;
            url = null;
            const preview = document.getElementById("imagePreview");
            preview.src = state.previewUrl;
            preview.hidden = false;
            document.getElementById("beforePane").hidden = false;
            document.getElementById("emptyPreview").hidden = true;
            document.getElementById("fileName").textContent = file.name;
            document.getElementById("imageDetails").textContent =
                image.naturalWidth + " × " + image.naturalHeight + " px · " +
                new Intl.NumberFormat("id-ID", {maximumFractionDigits: 2}).format(file.size / (1024 * 1024)) + " MB";
            state.showView("editor", true);
            fileStatus.textContent = "Gambar dibuka di Editor.";
            state.analyze();
        } catch (problem) {
            if (current !== selection) return;
            error.textContent = problem.message;
            error.hidden = false;
            fileStatus.textContent = "";
            error.scrollIntoView({block: "nearest"});
        } finally {
            if (url) URL.revokeObjectURL(url);
        }
    }

    document.querySelectorAll("[data-upload]").forEach(button => {
        button.addEventListener("click", () => input.click());
    });
    input.addEventListener("change", () => {
        const file = input.files[0];
        input.value = "";
        upload(file);
    });
    document.querySelectorAll(".drop-zone").forEach(zone => {
        let depth = 0;
        zone.addEventListener("dragenter", event => {
            event.preventDefault();
            depth++;
            zone.classList.add("is-dragging");
        });
        zone.addEventListener("dragover", event => event.preventDefault());
        zone.addEventListener("dragleave", () => {
            if (--depth <= 0) zone.classList.remove("is-dragging");
        });
        zone.addEventListener("drop", event => {
            event.preventDefault();
            depth = 0;
            zone.classList.remove("is-dragging");
            if (event.dataTransfer.files.length !== 1) {
                error.textContent = "Pilih satu gambar dalam satu waktu.";
                error.hidden = false;
                return;
            }
            upload(event.dataTransfer.files[0]);
        });
    });
    // Prevent the browser from replacing the app when a file is dropped outside the upload area.
    window.addEventListener("dragover", event => event.preventDefault());
    window.addEventListener("drop", event => event.preventDefault());
})();

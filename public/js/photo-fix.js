"use strict";
(() => {
    let activeRequest;
    let resultUrl;
    const get = id => document.getElementById(id);
    const form = get("manualFixForm");
    const documentForm = get("docuClearForm");
    const stencilForm = get("stencilForm");
    const status = get("photoFixStatus");
    const number = new Intl.NumberFormat("id-ID", {maximumFractionDigits: 2});

    function clearResult() {
        activeRequest?.abort();
        activeRequest = null;
        get("autoFix").disabled = false;
        get("manualFix").disabled = false;
        get("applyDocuClear").disabled = false;
        get("applyStencil").disabled = false;
        get("afterPane").hidden = true;
        get("previewKind").textContent = "Asli";
        get("resultPreview").removeAttribute("src");
        get("previewStage").classList.remove("has-result");
        get("downloadResult").hidden = true;
        get("downloadResult").removeAttribute("href");
        get("appliedSettings").hidden = true;
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = null;
    }

    function updateControls() {
        const log = get("intensityMethod").value === "log";
        get("gammaInput").disabled = log;
        get("logHelp").hidden = !log;
        get("gammaOutput").textContent = number.format(Number(get("gammaInput").value));
        get("sharpenOutput").textContent = number.format(Number(get("sharpenInput").value));
        get("thresholdOutput").textContent = number.format(Number(get("thresholdInput").value));
    }

    window.claritylab.resetProcessing = () => {
        clearResult();
        form.reset();
        documentForm.reset();
        stencilForm.reset();
        updateControls();
        get("photoFixControls").disabled = !window.claritylab.file;
        get("docuClearControls").disabled = !window.claritylab.file;
        get("stencilControls").disabled = !window.claritylab.file;
        status.dataset.state = "idle";
        status.textContent = window.claritylab.file ? "Gambar siap." : "";
    };

    async function applyFix(mode, tool = "PhotoFix") {
        const file = window.claritylab.file;
        if (!file) return;
        const isDocument = tool === "DocuClear";
        const isStencil = tool === "StencilMaker";
        const extension = tool === "PhotoFix" ? "jpg" : "png";
        const endpoint = {PhotoFix: "/api/photo-fix", DocuClear: "/api/docu-clear", StencilMaker: "/api/stencil-maker"}[tool];
        clearResult();
        const controller = new AbortController();
        activeRequest = controller;
        get("autoFix").disabled = true;
        get("manualFix").disabled = true;
        get("applyDocuClear").disabled = true;
        get("applyStencil").disabled = true;
        status.dataset.state = "loading";
        status.textContent = "Memproses " + tool + "…";
        const data = new FormData();
        data.append("image", file);
        if (isStencil) {
            data.append("threshold", get("thresholdInput").value);
            data.append("negative", String(get("negativeInput").checked));
        } else {
            data.append("mode", mode);
        }
        if (isDocument) {
            data.append("denoise", String(get("documentDenoise").checked));
        } else if (!isStencil && mode === "manual") {
            data.append("method", get("intensityMethod").value);
            data.append("gamma", get("gammaInput").value);
            data.append("sharpen", get("sharpenInput").value);
            data.append("stretch", String(get("stretchInput").checked));
        }
        let pendingUrl;
        let timedOut = false;
        const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
        try {
            const response = await fetch(endpoint, {method: "POST", body: data, signal: controller.signal});
            if (!response.ok) {
                let error;
                try { error = await response.json(); } catch { /* The hosting gateway may return an HTML error. */ }
                throw new Error(error?.message || (response.status === 413 ? "Ukuran gambar atau hasil terlalu besar. Perkecil gambar lalu coba lagi." : tool + " gagal. Silakan coba lagi."));
            }
            if (!response.headers.get("Content-Type")?.startsWith(extension === "png" ? "image/png" : "image/jpeg")) throw new Error("Server tidak mengirim hasil " + extension.toUpperCase() + " yang valid. Coba lagi.");
            const settings = JSON.parse(response.headers.get("X-" + tool + "-Settings"));
            const blob = await response.blob();
            if (controller !== activeRequest) return;
            pendingUrl = URL.createObjectURL(blob);
            const image = new Image();
            image.src = pendingUrl;
            await image.decode();
            if (controller !== activeRequest) return;
            resultUrl = pendingUrl;
            pendingUrl = null;
            get("resultPreview").src = resultUrl;
            get("resultPreview").alt = "Hasil pengolahan " + tool;
            get("afterLabel").textContent = "Sesudah · " + tool;
            get("previewKind").textContent = "Asli + " + tool;
            get("afterPane").hidden = false;
            get("previewStage").classList.add("has-result");
            const download = get("downloadResult");
            download.href = resultUrl;
            download.download = file.name.replace(/\.[^.]+$/, "") + "-" + tool.toLowerCase() + "." + extension;
            download.textContent = "Download hasil " + extension.toUpperCase();
            download.hidden = false;
            const applied = get("appliedSettings");
            if (isStencil) {
                applied.textContent = "Threshold " + number.format(settings.threshold) + " · Negatif " + (settings.negative ? "aktif" : "nonaktif");
            } else if (isDocument) {
                applied.textContent = (settings.mode === "binary" ? "Hitam-putih adaptif" : "Grayscale") + " · Pengurangan noise " + (settings.denoise ? "aktif" : "nonaktif");
            } else {
                applied.textContent = (settings.mode === "auto" ? "Auto Fix" : "Manual Fix") + " · " +
                    (settings.method === "log" ? "Logaritmik" : "Gamma " + number.format(settings.gamma)) +
                    " · Contrast stretching " + (settings.stretch ? "aktif" : "nonaktif") +
                    " · Sharpening " + number.format(settings.sharpen);
            }
            applied.hidden = false;
            status.dataset.state = "success";
            status.textContent = tool + " selesai.";
            get("previewStage").scrollIntoView({block: "nearest"});
        } catch (error) {
            if (controller !== activeRequest) return;
            status.dataset.state = "error";
            status.textContent = timedOut ? "Proses terlalu lama. Coba jalankan " + tool + " lagi." :
                error.name === "TypeError" ? "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi." :
                tool + " belum berhasil. " + error.message;
        } finally {
            clearTimeout(timeout);
            if (pendingUrl) URL.revokeObjectURL(pendingUrl);
            if (controller === activeRequest) {
                activeRequest = null;
                get("autoFix").disabled = false;
                get("manualFix").disabled = false;
                get("applyDocuClear").disabled = false;
                get("applyStencil").disabled = false;
            }
        }
    }

    get("autoFix").addEventListener("click", () => applyFix("auto"));
    form.addEventListener("submit", event => { event.preventDefault(); applyFix("manual"); });
    form.addEventListener("input", () => {
        clearResult();
        updateControls();
        status.dataset.state = "idle";
        status.textContent = "Pengaturan berubah. Terapkan Manual Fix.";
    });
    documentForm.addEventListener("submit", event => {
        event.preventDefault();
        applyFix(get("documentMode").value, "DocuClear");
    });
    documentForm.addEventListener("input", () => {
        clearResult();
        status.dataset.state = "idle";
        status.textContent = "Pengaturan berubah. Terapkan DocuClear.";
    });
    stencilForm.addEventListener("submit", event => {
        event.preventDefault();
        applyFix(null, "StencilMaker");
    });
    stencilForm.addEventListener("input", () => {
        clearResult();
        updateControls();
        status.dataset.state = "idle";
        status.textContent = "Pengaturan berubah. Buat stencil lagi.";
    });
    get("resetFix").addEventListener("click", window.claritylab.resetProcessing);
    get("resetDocument").addEventListener("click", window.claritylab.resetProcessing);
    get("resetStencil").addEventListener("click", window.claritylab.resetProcessing);
})();

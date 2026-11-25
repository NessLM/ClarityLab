"use strict";
(() => {
    let activeRequest;
    const status = document.getElementById("uploadStatus");
    const report = document.getElementById("qualityReport");
    const retry = document.getElementById("retryAnalysis");
    const panel = document.querySelector(".analysis-panel");
    const number = new Intl.NumberFormat("id-ID", {maximumFractionDigits: 2});

    window.claritylab.analyze = async function () {
        const file = this.file;
        if (!file) return;
        activeRequest?.abort();
        const controller = new AbortController();
        activeRequest = controller;
        report.hidden = true;
        retry.hidden = true;
        panel.setAttribute("aria-busy", "true");
        status.dataset.state = "loading";
        status.textContent = "Menganalisis kualitas gambar…";
        const form = new FormData();
        form.append("image", file);
        let timedOut = false;
        const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
        try {
            const response = await fetch("/api/quality", {method: "POST", body: form, signal: controller.signal});
            let data;
            try { data = await response.json(); }
            catch { throw new Error(response.status === 413 ? "Ukuran upload terlalu besar. Pilih gambar maksimal 3 MB." : "Respons server tidak dapat dibaca. Coba analisis lagi."); }
            if (!response.ok || data.status !== "success") throw new Error(data.message || "Analisis gagal. Coba lagi.");
            if (controller !== activeRequest) return;
            const labels = {brightness: ["Normal"], contrast: ["Cukup"], sharpness: ["Cukup Tajam"]};
            for (const key of Object.keys(labels)) {
                const metric = data.quality[key];
                document.getElementById(key + "Value").textContent = number.format(metric.value);
                const badge = document.getElementById(key + "Status");
                badge.textContent = metric.status;
                badge.dataset.warning = String(!labels[key].includes(metric.status));
            }
            const list = document.getElementById("recommendationList");
            list.replaceChildren();
            for (const item of data.recommendations) {
                const li = document.createElement("li");
                const title = document.createElement("strong");
                title.textContent = item.tool === "None" ? "Tidak perlu penyesuaian khusus" : item.method;
                const text = document.createElement("p");
                text.textContent = item.message;
                li.append(title, text);
                list.append(li);
            }
            status.dataset.state = "success";
            status.textContent = "Analisis selesai. Ini hasil pemeriksaan gambarmu.";
            report.hidden = false;
        } catch (error) {
            if (controller !== activeRequest) return;
            status.dataset.state = "error";
            status.textContent = timedOut ? "Server belum merespons. Coba analisis lagi." :
                error.name === "TypeError" ? "Tidak dapat terhubung ke server. Periksa koneksi, lalu coba lagi." : error.message;
            retry.hidden = false;
        } finally {
            clearTimeout(timeout);
            if (controller === activeRequest) panel.setAttribute("aria-busy", "false");
        }
    };
    retry.addEventListener("click", () => window.claritylab.analyze());
})();

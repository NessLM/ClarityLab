"use strict";
window.claritylab = {
    file: null,
    previewUrl: null,
    showView(view, push = false, focus = true) {
        const editor = view === "editor";
        document.getElementById("homeView").hidden = editor;
        document.getElementById("editorView").hidden = !editor;
        document.querySelectorAll("nav [data-view]").forEach(link => {
            if (link.dataset.view === view) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
        document.title = editor ? "Editor — ClarityLab" : "ClarityLab — Kenali kualitas gambarmu";
        const path = editor ? "/editor" : "/";
        if (push && location.pathname !== path) history.pushState({view}, "", path);
        if (focus) {
            document.getElementById(editor ? "editorTitle" : "homeTitle").focus();
            window.scrollTo(0, 0);
        }
    }
};
document.querySelectorAll("[data-view]").forEach(link => {
    link.addEventListener("click", event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        window.claritylab.showView(link.dataset.view, true);
    });
});
window.addEventListener("popstate", () => {
    window.claritylab.showView(location.pathname === "/editor" ? "editor" : "home");
});
window.claritylab.showView(location.pathname === "/editor" ? "editor" : "home", false, false);

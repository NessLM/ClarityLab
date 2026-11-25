"use strict";
const {test} = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

function app() {
    const nodes = new Map();
    function element() {
        return {
            hidden: false, dataset: {}, textContent: "", value: "", files: [], children: [], events: {}, attributes: {},
            classList: {add() {}, remove() {}},
            addEventListener(type, handler) {this.events[type] = handler;},
            setAttribute(key, value) {this.attributes[key] = value;},
            removeAttribute(key) {delete this.attributes[key];},
            append(...children) {this.children.push(...children);},
            replaceChildren() {this.children = [];},
            focus() {}, scrollIntoView() {},
            reset() {
                get("intensityMethod").value = "gamma";
                get("gammaInput").value = "1";
                get("sharpenInput").value = "0";
                get("stretchInput").checked = false;
            }
        };
    }
    const get = id => {if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id);};
    const navigation = ["home", "editor"].map(view => Object.assign(element(), {dataset: {view}}));
    const uploads = [element()];
    const zones = [element()];
    const requests = [], revoked = [], windowEvents = {};
    const context = {
        console, Intl, AbortController, setTimeout, clearTimeout,
        location: {pathname: "/"},
        history: {pushState(state, title, path) {context.location.pathname = path;}},
        document: {
            getElementById: get, createElement: element, querySelector: get,
            querySelectorAll(selector) {
                return selector === "[data-upload]" ? uploads : selector === ".drop-zone" ? zones : navigation;
            }
        },
        URL: {createObjectURL: file => "blob:" + file.name, revokeObjectURL: url => revoked.push(url)},
        Image: class {naturalWidth = 100; naturalHeight = 80; async decode() {if (this.src.includes("corrupt")) throw Error(); if (this.src.includes("wide")) this.naturalWidth = 2049;}},
        FormData: class {values = {}; append(key, value) {this.values[key] = value;}},
        fetch(url, options) {return new Promise((resolve, reject) => requests.push({url, options, resolve, reject}));},
        scrollTo() {}, addEventListener(type, handler) {windowEvents[type] = handler;}
    };
    context.window = context;
    vm.createContext(context);
    for (const name of ["editor", "quality", "photo-fix", "upload"]) vm.runInContext(fs.readFileSync("public/js/" + name + ".js", "utf8"), context);
    async function upload(name = "photo.png", size = 100, type = "image/png") {
        get("imageInput").files = [{name, size, type}];
        get("imageInput").events.change();
        await new Promise(setImmediate);
    }
    const success = (index, value = 40) => requests[index].resolve({
        ok: true, json: async () => ({
            status: "success", quality: {
                brightness: {value, status: "Terlalu Gelap"},
                contrast: {value: 0, status: "Kontras Rendah"},
                sharpness: {value: 0, status: "Berpotensi Buram"}
            }, recommendations: [{tool: "PhotoFix", method: "Gamma Correction", message: "<img src=x onerror=alert(1)>"}]
        })
    });
    const photoSuccess = index => requests[index].resolve({
        ok: true,
        headers: {get: key => key === "Content-Type" ? "image/jpeg" : JSON.stringify({mode: "auto", method: "gamma", gamma: 2, stretch: false, sharpen: 0.4})},
        blob: async () => ({name: "result.jpg"})
    });
    return {context, get, requests, revoked, upload, success, photoSuccess, windowEvents};
}

test("upload, preview, analysis, navigation, refresh and same-file reselect", async () => {
    const a = app();
    assert.equal(a.get("editorView").hidden, true);
    await a.upload();
    assert.equal(a.context.location.pathname, "/editor");
    assert.equal(a.get("imagePreview").src, "blob:photo.png");
    assert.equal(a.requests[0].url, "/api/quality");
    assert.equal(a.get("uploadStatus").dataset.state, "loading");
    a.success(0);
    await new Promise(setImmediate);
    assert.equal(a.get("qualityReport").hidden, false);
    assert.equal(a.get("brightnessValue").textContent, "40");
    assert.equal(a.get("recommendationList").children[0].children[1].textContent, "<img src=x onerror=alert(1)>");
    a.context.claritylab.showView("home", true);
    assert.equal(a.context.claritylab.file.name, "photo.png");
    a.context.location.pathname = "/editor";
    a.windowEvents.popstate();
    assert.equal(a.get("editorView").hidden, false);
    assert.equal(a.requests.length, 1);
    await a.upload();
    assert.deepEqual(a.revoked, ["blob:photo.png"]);
    assert.equal(a.get("imageInput").value, "");
    a.success(1);
    await new Promise(setImmediate);
    assert.equal(app().context.claritylab.file, null);
});

test("invalid files preserve the current image and do not reach the API", async () => {
    const a = app();
    await a.upload();
    a.success(0);
    await new Promise(setImmediate);
    for (const [name, size, type] of [
        ["bad.gif", 100, "image/gif"], ["large.png", 3 * 1024 * 1024 + 1, "image/png"],
        ["empty.png", 0, "image/png"], ["corrupt.png", 100, "image/png"], ["wide.png", 100, "image/png"]
    ]) {
        await a.upload(name, size, type);
        assert.equal(a.get("uploadError").hidden, false, name);
        assert.equal(a.context.claritylab.file.name, "photo.png");
    }
    assert.equal(a.requests.length, 1);
    assert.ok(a.revoked.includes("blob:wide.png"));
});

test("new image cancels older analysis; late response cannot overwrite new report", async () => {
    const a = app();
    await a.upload("first.png");
    await a.upload("second.png");
    assert.equal(a.requests[0].options.signal.aborted, true);
    a.success(1, 90);
    await new Promise(setImmediate);
    a.success(0, 20);
    await new Promise(setImmediate);
    assert.equal(a.get("brightnessValue").textContent, "90");
});

test("network and non-JSON errors provide retry without losing the image", async () => {
    const a = app();
    await a.upload();
    a.requests[0].reject(new TypeError("Failed to fetch"));
    await new Promise(setImmediate);
    assert.equal(a.get("retryAnalysis").hidden, false);
    assert.equal(a.get("qualityReport").hidden, true);
    a.get("retryAnalysis").events.click();
    a.requests[1].resolve({status: 413, json: async () => {throw Error();}});
    await new Promise(setImmediate);
    assert.match(a.get("uploadStatus").textContent, /3 MB/);
    a.get("retryAnalysis").events.click();
    a.success(2);
    await new Promise(setImmediate);
    assert.equal(a.get("uploadStatus").dataset.state, "success");
    assert.equal(a.get(".analysis-panel").attributes["aria-busy"], "false");
});

test("PhotoFix auto and manual use original; preview and download share the result", async () => {
    const a = app();
    await a.upload(); a.success(0);
    await new Promise(setImmediate);
    a.get("autoFix").events.click();
    assert.equal(a.requests[1].url, "/api/photo-fix");
    assert.equal(a.requests[1].options.body.values.mode, "auto");
    a.photoSuccess(1);
    await new Promise(setImmediate);
    assert.equal(a.get("afterPane").hidden, false);
    assert.equal(a.get("resultPreview").src, a.get("downloadResult").href);
    assert.equal(a.get("downloadResult").download, "photo-photofix.jpg");
    assert.equal(a.get("imagePreview").src, "blob:photo.png");
    a.get("gammaInput").value = "1.5";
    a.get("stretchInput").checked = true;
    a.get("manualFixForm").events.input();
    assert.equal(a.get("downloadResult").hidden, true);
    a.get("manualFixForm").events.submit({preventDefault() {}});
    const values = a.requests[2].options.body.values;
    assert.equal(values.image, a.context.claritylab.file);
    assert.equal(values.mode, "manual");
    assert.equal(values.gamma, "1.5");
    assert.equal(values.stretch, "true");
    a.photoSuccess(2);
    await new Promise(setImmediate);
    a.get("resetFix").events.click();
    assert.equal(a.get("gammaInput").value, "1");
    assert.equal(a.get("afterPane").hidden, true);
    assert.ok(a.revoked.includes("blob:result.jpg"));
});

test("replacing image or changing controls cancels PhotoFix and rejects stale results", async () => {
    const a = app();
    await a.upload(); a.success(0);
    a.get("autoFix").events.click();
    await a.upload("new.png"); a.success(2);
    assert.equal(a.requests[1].options.signal.aborted, true);
    a.photoSuccess(1);
    await new Promise(setImmediate);
    assert.equal(a.get("afterPane").hidden, true);
    assert.equal(a.get("downloadResult").hidden, true);
    a.get("autoFix").events.click();
    a.get("intensityMethod").value = "log";
    a.get("manualFixForm").events.input();
    assert.equal(a.get("gammaInput").disabled, true);
    assert.equal(a.requests[3].options.signal.aborted, true);
    a.photoSuccess(3);
    await new Promise(setImmediate);
    assert.equal(a.get("afterPane").hidden, true);
});

test("PhotoFix errors allow retry and never expose a failed download", async () => {
    const a = app();
    await a.upload(); a.success(0);
    a.get("autoFix").events.click();
    a.requests[1].reject(new TypeError("Failed to fetch"));
    await new Promise(setImmediate);
    assert.equal(a.get("photoFixStatus").dataset.state, "error");
    assert.equal(a.get("autoFix").disabled, false);
    assert.equal(a.get("downloadResult").hidden, true);
    a.get("autoFix").events.click();
    a.requests[2].resolve({ok: false, status: 413, json: async () => {throw Error();}});
    await new Promise(setImmediate);
    assert.match(a.get("photoFixStatus").textContent, /terlalu besar/);
    a.get("autoFix").events.click(); a.photoSuccess(3);
    await new Promise(setImmediate);
    assert.equal(a.get("photoFixStatus").dataset.state, "success");
});

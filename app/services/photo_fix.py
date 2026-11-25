import math

import cv2
import numpy as np

from app.services.quality_checker import analyze_quality


def stretch_luminance(luminance, percentiles=(2, 98)):
    low, high = np.percentile(luminance, percentiles)
    if high <= low:
        return luminance.copy()
    return np.clip((luminance.astype(np.float32) - low) * 255 / (high - low), 0, 255).round().astype(np.uint8)


def photo_fix(image, options):
    """Apply spatial transforms to luminance, always starting from the original."""
    mode = options.get("mode", "auto")
    if mode not in {"auto", "manual"}:
        raise ValueError("Mode PhotoFix harus auto atau manual.")
    color = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
    luminance = color[:, :, 0]
    # Auto preserves sparse highlights; percentile clipping is a manual choice.
    percentiles = (0, 100) if mode == "auto" else (2, 98)

    if mode == "auto":
        quality = analyze_quality(image)
        low, high = np.percentile(luminance, percentiles)
        stretch = quality["contrast"]["value"] < 38 and high - low > 10
        adjusted = stretch_luminance(luminance, percentiles) if stretch else luminance
        mean = float(adjusted.mean())
        gamma = 1.0
        if 0 < mean < 255 and (mean < 85 or mean > 185):
            gamma = round(float(np.clip(math.log(mean / 255) / math.log(0.5), 0.3, 3)), 2)
        sharpen = 0.4 if quality["sharpness"]["value"] < 65 and quality["contrast"]["value"] >= 3 else 0.0
        settings = {"mode": mode, "method": "gamma", "gamma": gamma, "stretch": bool(stretch), "sharpen": sharpen}
    else:
        method = options.get("method", "gamma")
        if method not in {"gamma", "log"}:
            raise ValueError("Metode intensitas harus gamma atau log.")
        try:
            gamma = float(options.get("gamma", "1"))
            sharpen = float(options.get("sharpen", "0"))
        except (ValueError, TypeError):
            raise ValueError("Gamma dan sharpening harus berupa angka.") from None
        if not math.isfinite(gamma) or not 0.3 <= gamma <= 3:
            raise ValueError("Gamma harus berada antara 0,3 dan 3.")
        if not math.isfinite(sharpen) or not 0 <= sharpen <= 2:
            raise ValueError("Sharpening harus berada antara 0 dan 2.")
        stretch = options.get("stretch", "false")
        if stretch not in {"true", "false"}:
            raise ValueError("Contrast stretching harus true atau false.")
        settings = {"mode": mode, "method": method, "gamma": gamma, "stretch": stretch == "true", "sharpen": sharpen}

    if settings["method"] == "gamma" and settings["gamma"] == 1 and not settings["stretch"] and settings["sharpen"] == 0:
        return image.copy(), settings
    if settings["stretch"]:
        luminance = stretch_luminance(luminance, percentiles)
    values = np.arange(256, dtype=np.float32) / 255
    if settings["method"] == "log":
        values = np.log1p(9 * values) / np.log(10)
    else:
        values = values ** (1 / settings["gamma"])
    luminance = cv2.LUT(luminance, (values * 255).round().astype(np.uint8))
    if settings["sharpen"]:
        blurred = cv2.GaussianBlur(luminance, (0, 0), 1)
        luminance = cv2.addWeighted(luminance, 1 + settings["sharpen"], blurred, -settings["sharpen"], 0)
    color[:, :, 0] = luminance
    return cv2.cvtColor(color, cv2.COLOR_YCrCb2BGR), settings

import cv2

from app.services.photo_fix import stretch_luminance


def docu_clear(image, options):
    mode = options.get("mode", "binary")
    if mode not in {"binary", "grayscale"}:
        raise ValueError("Mode DocuClear harus binary atau grayscale.")
    denoise = options.get("denoise", "false")
    if denoise not in {"true", "false"}:
        raise ValueError("Pengurangan noise harus true atau false.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if denoise == "true":
        gray = cv2.medianBlur(gray, 3)
    gray = stretch_luminance(gray)
    if mode == "binary":
        # Local thresholds cope with uneven document lighting better than a single cutoff.
        gray = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11)
    return gray, {"mode": mode, "denoise": denoise == "true"}

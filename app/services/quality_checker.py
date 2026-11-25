
import cv2
import numpy as np


def analyze_quality(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 1. Analisis brightness
    brightness = float(np.mean(gray))

    if brightness < 85:
        brightness_status = "Terlalu Gelap"
    elif brightness > 185:
        brightness_status = "Cenderung Terang"
    else:
        brightness_status = "Normal"

    # 2. Analisis contrast
    contrast = float(np.std(gray))

    if contrast < 38:
        contrast_status = "Kontras Rendah"
    else:
        contrast_status = "Cukup"

    # 3. Analisis ketajaman menggunakan Laplacian
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = float(laplacian.var())

    if sharpness < 65:
        sharpness_status = "Berpotensi Buram"
    else:
        sharpness_status = "Cukup Tajam"

    return {
        "brightness": {
            "value": round(brightness, 2),
            "status": brightness_status
        },
        "contrast": {
            "value": round(contrast, 2),
            "status": contrast_status
        },
        "sharpness": {
            "value": round(sharpness, 2),
            "status": sharpness_status
        }
    }

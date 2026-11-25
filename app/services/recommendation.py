
def get_recommendations(quality):
    recommendations = []

    brightness = quality["brightness"]["status"]
    contrast = quality["contrast"]["status"]
    sharpness = quality["sharpness"]["status"]

    if brightness == "Terlalu Gelap":
        recommendations.append({
            "tool": "PhotoFix",
            "method": "Gamma Correction",
            "message": "Foto terlalu gelap. Disarankan memperbaiki kecerahan menggunakan Gamma Transformation."
        })

    if brightness == "Cenderung Terang":
        recommendations.append({
            "tool": "PhotoFix",
            "method": "Gamma Correction",
            "message": "Foto cenderung terang. Penyesuaian gamma dapat dicoba untuk menurunkan kecerahan."
        })

    if contrast == "Kontras Rendah":
        recommendations.append({
            "tool": "PhotoFix",
            "method": "Contrast Stretching",
            "message": "Kontras gambar rendah. Contrast Stretching dapat membantu memperjelas perbedaan intensitas."
        })

    if sharpness == "Berpotensi Buram":
        recommendations.append({
            "tool": "PhotoFix",
            "method": "Sharpening",
            "message": "Foto berpotensi buram. Penajaman dapat dicoba, tetapi tidak menjamin detail yang hilang dapat dipulihkan."
        })

    if not recommendations:
        recommendations.append({
            "tool": "None",
            "method": "No Adjustment",
            "message": "Tidak ditemukan masalah menonjol berdasarkan parameter pemeriksaan awal."
        })

    return recommendations

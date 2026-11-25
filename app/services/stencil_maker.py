import cv2


def stencil_maker(image, options):
    try:
        threshold = int(options.get("threshold", "128"))
    except (ValueError, TypeError):
        raise ValueError("Threshold harus berupa bilangan bulat antara 0 dan 255.") from None
    if not 0 <= threshold <= 255:
        raise ValueError("Threshold harus berada antara 0 dan 255.")
    negative = options.get("negative", "false")
    if negative not in {"true", "false"}:
        raise ValueError("Image negative harus true atau false.")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, result = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    if negative == "true":
        result = cv2.bitwise_not(result)
    return result, {"threshold": threshold, "negative": negative == "true"}

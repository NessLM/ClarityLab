
import cv2
import numpy as np


MAX_FILE_SIZE = 3 * 1024 * 1024
MAX_DIMENSION = 2048
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}


def read_uploaded_image(upload):
    if upload is None or not upload.filename:
        raise ValueError("Silakan pilih gambar terlebih dahulu.")

    extension = upload.filename.rsplit(".", 1)[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Format harus JPG, JPEG, atau PNG.")

    file_bytes = upload.stream.read(MAX_FILE_SIZE + 1)

    if len(file_bytes) > MAX_FILE_SIZE:
        raise ValueError("Ukuran gambar maksimal 3 MB.")

    if not file_bytes:
        raise ValueError("File gambar kosong.")

    array = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("File tidak dapat dibaca sebagai gambar.")

    height, width = image.shape[:2]

    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise ValueError(
            "Resolusi gambar maksimal 2048 x 2048 piksel."
        )

    return image

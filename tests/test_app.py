import io
import unittest
from contextlib import closing

import cv2
import numpy as np
from werkzeug.test import EnvironBuilder

from app import create_app


class AppFlowTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def image(self, extension=".png", shape=(80, 100, 3), value=40):
        ok, encoded = cv2.imencode(extension, np.full(shape, value, dtype=np.uint8))
        self.assertTrue(ok)
        return io.BytesIO(encoded.tobytes())

    def test_pages_share_app_and_assets(self):
        for path in ("/", "/editor"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            for marker in (b'id="homeView"', b'id="editorView"', b'/js/quality.js'):
                self.assertIn(marker, response.data)
        for path in ("/css/style.css", "/js/editor.js", "/js/upload.js", "/js/quality.js", "/assets/logo.svg"):
            with self.client.get(path) as response:
                self.assertEqual(response.status_code, 200)

    def test_png_and_jpeg_quality(self):
        for extension in (".png", ".jpg"):
            response = self.client.post("/api/quality", data={"image": (self.image(extension), "photo" + extension)})
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual((data["width"], data["height"]), (100, 80))
            self.assertEqual(data["quality"]["brightness"]["status"], "Terlalu Gelap")
            self.assertEqual(data["quality"]["contrast"]["status"], "Kontras Rendah")
            self.assertEqual(data["quality"]["sharpness"]["status"], "Berpotensi Buram")
            self.assertTrue(data["recommendations"])

    def test_invalid_uploads(self):
        for upload in ((io.BytesIO(b""), "empty.png"), (io.BytesIO(b"not an image"), "bad.png"), (self.image(), "bad.gif")):
            response = self.client.post("/api/quality", data={"image": upload})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.get_json()["status"], "error")
        self.assertEqual(self.client.post("/api/quality").status_code, 400)

    def test_dimensions_and_size(self):
        large = self.client.post("/api/quality", data={"image": (self.image(shape=(1, 2049, 3)), "wide.png")})
        self.assertEqual(large.status_code, 400)
        self.assertIn("2048", large.get_json()["message"])
        with closing(EnvironBuilder(path="/api/quality", method="POST", data={"image": (io.BytesIO(b"x" * (3 * 1024 * 1024 + 1)), "large.png")})) as builder:
            environ = builder.get_environ()
            try:
                with self.client.open(environ) as oversized:
                    self.assertEqual(oversized.status_code, 400)
                    self.assertIn("3 MB", oversized.get_json()["message"])
            finally:
                environ["wsgi.input"].close()


if __name__ == "__main__":
    unittest.main()

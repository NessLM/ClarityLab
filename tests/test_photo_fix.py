import io
import json
import unittest

import cv2
import numpy as np

from app import create_app
from app.services.photo_fix import photo_fix


class PhotoFixTests(unittest.TestCase):
    def test_manual_neutral_preserves_original_exactly(self):
        image = np.random.default_rng(7).integers(0, 256, (48, 64, 3), dtype=np.uint8)
        result, settings = photo_fix(image, {"mode": "manual"})
        np.testing.assert_array_equal(result, image)
        self.assertIsNot(result, image)
        self.assertEqual(settings["gamma"], 1)

    def test_gamma_and_log_direction_endpoints_and_no_mutation(self):
        image = np.repeat(np.arange(256, dtype=np.uint8)[None, :, None], 3, axis=2)
        original = image.copy()
        brighter, _ = photo_fix(image, {"mode": "manual", "gamma": "2"})
        darker, _ = photo_fix(image, {"mode": "manual", "gamma": "0.5"})
        logarithmic, _ = photo_fix(image, {"mode": "manual", "method": "log"})
        self.assertGreater(int(brighter[0, 64, 0]), 64)
        self.assertLess(int(darker[0, 128, 0]), 128)
        self.assertGreater(int(logarithmic[0, 64, 0]), 64)
        for result in (brighter, darker, logarithmic):
            self.assertEqual(result[0, 0, 0], 0)
            self.assertEqual(result[0, -1, 0], 255)
            self.assertTrue(np.all(np.diff(result[0, :, 0].astype(int)) >= 0))
        np.testing.assert_array_equal(image, original)

    def test_auto_adjusts_dark_and_bright_and_handles_flat_extremes(self):
        for value in (30, 220):
            result, settings = photo_fix(np.full((30, 40, 3), value, np.uint8), {})
            self.assertLess(abs(float(result.mean()) - 128), abs(value - 128))
            self.assertEqual(settings["sharpen"], 0)
        for value in (0, 255):
            image = np.full((1, 1, 3), value, np.uint8)
            result, _ = photo_fix(image, {})
            np.testing.assert_array_equal(image, result)

    def test_stretch_low_contrast_and_flat_guard(self):
        gray = np.tile(np.arange(100, 151, dtype=np.uint8), (30, 1))
        image = np.repeat(gray[:, :, None], 3, axis=2)
        result, settings = photo_fix(image, {})
        self.assertTrue(settings["stretch"])
        self.assertGreater(float(result.std()), float(image.std()))
        flat = np.full((16, 16, 3), 80, np.uint8)
        result, _ = photo_fix(flat, {"mode": "manual", "stretch": "true"})
        np.testing.assert_array_equal(flat, result)

    def test_sharpen_increases_edge_contrast_without_overflow(self):
        image = np.full((40, 40, 3), 90, np.uint8)
        image[:, 20:] = 160
        result, _ = photo_fix(image, {"mode": "manual", "sharpen": "1"})
        self.assertLess(int(result[20, 19, 0]), 90)
        self.assertGreater(int(result[20, 20, 0]), 160)
        self.assertEqual(result.dtype, np.uint8)

    def test_auto_stretch_preserves_sparse_highlight_detail(self):
        image = np.full((100, 100, 3), 45, np.uint8)
        image[20:80, 20:80] = 90
        image[45:48, 35:65] = 160
        result, settings = photo_fix(image, {})
        self.assertTrue(settings["stretch"])
        self.assertGreater(int(result[46, 40, 0]) - int(result[30, 30, 0]), 40)

    def test_api_binary_download_settings_and_validation(self):
        client = create_app().test_client()
        ok, encoded = cv2.imencode(".png", np.full((32, 48, 3), 40, np.uint8))
        self.assertTrue(ok)

        def post(options):
            return client.post("/api/photo-fix", data={"image": (io.BytesIO(encoded.tobytes()), "photo.png"), **options})

        for mode in ("auto", "manual"):
            with post({"mode": mode, "gamma": "1.5", "stretch": "true", "sharpen": "0.4"}) as response:
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.mimetype, "image/jpeg")
                self.assertEqual(response.headers["Cache-Control"], "no-store")
                self.assertIn("attachment", response.headers["Content-Disposition"])
                self.assertEqual(json.loads(response.headers["X-PhotoFix-Settings"])["mode"], mode)
                decoded = cv2.imdecode(np.frombuffer(response.data, np.uint8), cv2.IMREAD_COLOR)
                self.assertEqual(decoded.shape, (32, 48, 3))
        for options in ({"mode": "unknown"}, {"gamma": "nan"}, {"gamma": "inf"}, {"gamma": "0"}, {"gamma": "3.1"}, {"sharpen": "-1"}, {"sharpen": "inf"}, {"gamma": "abc"}, {"method": "unknown"}, {"stretch": "yes"}):
            with post({"mode": "manual", **options}) as response:
                self.assertEqual(response.status_code, 400, options)
                self.assertEqual(response.get_json()["status"], "error")
        self.assertEqual(client.post("/api/photo-fix").status_code, 400)
        with client.post("/api/photo-fix", data={"image": (io.BytesIO(b"corrupt"), "bad.png")}) as response:
            self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()

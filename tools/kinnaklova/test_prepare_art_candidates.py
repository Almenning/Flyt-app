"""Tests for a strict, preview-only Kinnaklova art preparation pipeline."""
import hashlib
import io
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw
from prepare_art_candidates import (
    SIZE, combine_only_allowed, inpaint_preview, save_mask_guide,
    validate_reference,
)
from verify_locked_scene import PROTECTED_SIGNS, allowed_change_mask, channel_exact_difference


class CandidatePreparationTests(unittest.TestCase):
    def test_mask_only_handoff_protects_signs(self):
        with tempfile.TemporaryDirectory() as tmp:
            mask, report = save_mask_guide(
                Path(tmp), {"reference": {"sha256": "0" * 64}}
            )
            self.assertEqual(mask.size, SIZE)
            self.assertGreater(report["allowed_pixel_count"], 10000)
            self.assertFalse(report["candidate_is_approved"])
            self.assertFalse(report["release_approval"])
            for filename in ("allowed-edit-mask.png", "mask-guide.png", "handoff.json"):
                self.assertTrue((Path(tmp) / filename).is_file())
            for rect in PROTECTED_SIGNS.values():
                center = ((rect[0] + rect[2]) // 2, (rect[1] + rect[3]) // 2)
                self.assertEqual(mask.getpixel(center), 0)
            self.assertEqual(mask.getpixel((410, 648)), 255)
            self.assertEqual(mask.getpixel((1597, 636)), 255)

    def test_mismatched_reference_sha_is_rejected_even_for_correct_size(self):
        original = Image.new("RGB", (32, 12), (100, 140, 170))
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "source.png"
            original.save(path, "PNG")
            with self.assertRaisesRegex(ValueError, "Wrong source bytes"):
                validate_reference(path, "0" * 64, expected_size=(32, 12))
            expected = hashlib.sha256(path.read_bytes()).hexdigest()
            self.assertEqual(validate_reference(path, expected, (32, 12)).size, (32, 12))

    def test_composition_cannot_modify_any_disallowed_pixel(self):
        size = (48, 40)
        source = Image.new("RGB", size, (25, 58, 105))
        painted = Image.new("RGB", size, (240, 12, 16))
        mask = Image.new("L", size, 0)
        ImageDraw.Draw(mask).rectangle((11, 11, 25, 29), fill=255)
        result = combine_only_allowed(source, painted, mask)
        self.assertEqual(result.getpixel((10, 20)), (25, 58, 105))
        self.assertEqual(result.getpixel((18, 20)), (240, 12, 16))
        unapproved = ImageChops.multiply(
            channel_exact_difference(source, result), ImageChops.invert(mask)
        )
        self.assertIsNone(unapproved.getbbox())

    def test_real_inpainting_preserves_every_locked_pixel(self):
        try:
            import cv2  # noqa: F401
            import numpy  # noqa: F401
        except ImportError:
            self.skipTest("Install optional OpenCV and NumPy to run this preview integration test")
        size = (88, 64)
        source = Image.new("RGB", size)
        for y in range(size[1]):
            for x in range(size[0]):
                source.putpixel((x, y), (x * 2, y * 2, (x + y) % 240))
        ImageDraw.Draw(source).rectangle((31, 18, 50, 44), fill=(241, 25, 30))
        mask = Image.new("L", size, 0)
        ImageDraw.Draw(mask).rectangle((30, 17, 51, 45), fill=255)
        for method in ("telea", "ns"):
            with self.subTest(method=method):
                result = inpaint_preview(source, mask, method, radius=4)
                outside = ImageChops.multiply(
                    channel_exact_difference(source, result), ImageChops.invert(mask)
                )
                self.assertIsNone(outside.getbbox())
                self.assertNotEqual(result.getpixel((40, 31)), (241, 25, 30))


if __name__ == "__main__":
    unittest.main()

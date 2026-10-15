"""Mechanical outpainting contract tests. A passing synthetic painting is NOT visually approved."""
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageChops

BASE = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("laria_d2_outpaint", BASE / "scripts/laria_d2_outpaint.py")
d2 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(d2)
SOURCE = BASE / "laer-litt-mer"


class PixelExactOutpaintContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.work = Path(self.temp.name)
        self.original = d2.original_image(SOURCE, "math")
        context = self.original.crop((0, 1372, 941, 1672))
        self.candidate = Image.new("RGB", (941, 725))
        self.candidate.paste(context, (0, 0))
        bottom_row = self.original.crop((0, 1671, 941, 1672))
        for y in range(300, 725):
            self.candidate.paste(bottom_row, (0, y))
        self.input = self.work / "candidate.png"
        self.output = self.work / "output"

    def check(self):
        self.candidate.save(self.input)
        return d2.inspect_candidate(SOURCE, "math", self.input, self.output)

    def test_unchanged_anchor_export_is_lossless_but_never_auto_approved(self):
        report = self.check()
        self.assertTrue(report["first43PixelRowsExact"])
        self.assertFalse(report["visualApproval"])
        self.assertEqual(report["contextMAE"], 0)
        self.assertEqual(report["seamMAE"], 0)
        with Image.open(self.output / "tallenga-ground-CANDIDATE.webp") as image:
            exported = image.convert("RGB").crop((0, 0, 941, 43))
        original = self.original.crop((0, 1629, 941, 1672))
        self.assertIsNone(ImageChops.difference(exported, original).getbbox())
        self.assertTrue((self.output / "tallenga-seam-review.png").exists())

    def test_single_changed_pixel_in_original_is_rejected(self):
        self.candidate.putpixel((103, 121), (0, 0, 0))
        with self.assertRaisesRegex(d2.ArtError, "repainted"):
            self.check()

    def test_wrong_dimensions_are_rejected(self):
        self.candidate.crop((0, 0, 940, 725)).save(self.input)
        with self.assertRaisesRegex(d2.ArtError, "Expected 941x725"):
            d2.inspect_candidate(SOURCE, "math", self.input, self.output)

    def test_transparent_unpainted_pixel_is_rejected(self):
        rgba = self.candidate.convert("RGBA")
        rgba.putpixel((200, 500), (0, 0, 0, 0))
        rgba.save(self.input)
        with self.assertRaisesRegex(d2.ArtError, "transparent"):
            d2.inspect_candidate(SOURCE, "math", self.input, self.output)

    def test_obvious_horizontal_seam_is_rejected(self):
        self.candidate.paste(Image.new("RGB", (941, 425), (255, 255, 255)), (0, 300))
        with self.assertRaisesRegex(d2.ArtError, "horizontal seam"):
            self.check()

    def test_source_masks_and_anchors_are_exact_for_all_four_worlds(self):
        folder = self.work / "templates"
        d2.generate_templates(SOURCE, folder)
        for subject, name in d2.SUBJECTS.items():
            original = d2.original_image(SOURCE, subject)
            with Image.open(folder / (name + "-outpaint-exact.png")) as image:
                self.assertEqual(image.size, (941, 725))
                context = image.convert("RGB").crop((0, 0, 941, 300))
            self.assertIsNone(ImageChops.difference(context,
                original.crop((0, 1372, 941, 1672))).getbbox())
            with Image.open(folder / (name + "-43px-exact-anchor.png")) as image:
                self.assertEqual(image.size, (941, 468))
                anchor = image.convert("RGB").crop((0, 0, 941, 43))
            self.assertIsNone(ImageChops.difference(anchor,
                original.crop((0, 1629, 941, 1672))).getbbox())
            with Image.open(folder / (name + "-paint-mask-white.png")) as mask:
                self.assertEqual(mask.getpixel((470, 200)), 0)
                self.assertEqual(mask.getpixel((470, 320)), 255)


if __name__ == "__main__":
    unittest.main()

"""Separate release-mask tests. The older three-troll retouch mask is unchanged."""
import hashlib
import unittest

from PIL import Image, ImageDraw

from prepare_clean_art_previews import (
    LOCKED, checked, make_mask, mark_kinnaklova_painted_trail, source,
)


class PaintedTrailContract(unittest.TestCase):
    size = (1672, 941)
    marks = [(813, 800), (800, 581), (1288, 627), (893, 540), (1336, 688)]
    protected = {
        "between upper dashes": (813, 597),
        "outside left stroke": (813, 812),
        "outside middle stroke": (800, 571),
        "outside right stroke": (1288, 608),
        "untouched grass between strokes": (900, 650),
        "twin peaks": (805, 299),
        "Kinn church": (174, 580),
        "sea": (1600, 475),
    }

    @classmethod
    def setUpClass(cls):
        cls.original, _ = source('kinnaklova')  # exact SHA and native size
        cls.mask = make_mask('kinnaklova')

    def test_native_trail_stencil_is_fixed_and_does_not_add_corridors(self):
        trail = Image.new('L', self.size)
        mark_kinnaklova_painted_trail(ImageDraw.Draw(trail))
        self.assertEqual(trail.getbbox(), (708, 532, 1342, 818))
        self.assertEqual(trail.histogram()[255], 5_782)
        self.assertEqual(hashlib.sha256(trail.tobytes()).hexdigest(),
                         '971b579753e29a7157f5a164749f16b4d26020ab4f9910bf8386dfba3280e3cf')

        legacy = Image.new('L', self.size)
        pen = ImageDraw.Draw(legacy)
        for box in LOCKED['kinnaklova']['ui'].values():
            pen.rectangle(box, fill=255)
        for box in LOCKED['kinnaklova']['landmarks'].values():
            pen.rectangle(box, fill=0)
        self.assertEqual(self.mask.histogram()[255] - legacy.histogram()[255], 5_777)
        for point in self.marks:
            with self.subTest(mark=point):
                self.assertEqual(legacy.getpixel(point), 0)
                self.assertEqual(self.mask.getpixel(point), 255)
        for name, point in self.protected.items():
            with self.subTest(protected=name):
                self.assertEqual(self.mask.getpixel(point), 0)

    def test_even_one_changed_landmark_or_off_trail_pixel_is_rejected(self):
        def change_first_channel(image, point):
            r, g, b = image.getpixel(point)
            image.putpixel(point, (r ^ 1, g, b))

        clean = self.original.copy()
        for point in self.marks:
            change_first_channel(clean, point)
        self.assertEqual(checked(self.original, clean, self.mask), len(self.marks))

        for name, point in self.protected.items():
            with self.subTest(protected=name):
                change_first_channel(clean, point)
                with self.assertRaisesRegex(AssertionError, 'outside UI-only whitelist'):
                    checked(self.original, clean, self.mask)
                change_first_channel(clean, point)


if __name__ == '__main__':
    unittest.main()

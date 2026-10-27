"""Regression checks for exact-edited, composition-locked Kinnaklova artwork."""
import unittest
from PIL import Image
from verify_locked_scene import MASKS, PROTECTED_SIGNS, allowed_change_mask, channel_exact_difference

SIZE=(1672,941)

class KinnaklovaMaskTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.allowed=allowed_change_mask(SIZE)

    def test_rejected_troll_extremities_are_editable(self):
        # These were outside the original polygons, leaving wrong troll pixels.
        self.assertEqual(self.allowed.getpixel((410,648)),255,'Words pointing hand')
        self.assertEqual(self.allowed.getpixel((1597,636)),255,'Reading right foot')
        self.assertEqual(self.allowed.getpixel((1000,453)),255,'Sentences head')
        self.assertEqual(self.allowed.getpixel((1468,568)),255,'Reading face')

    def test_painted_signs_and_scene_are_immutable(self):
        self.assertEqual(len(PROTECTED_SIGNS),3)
        for name,box in PROTECTED_SIGNS.items():
            cx=(box[0]+box[2])//2
            cy=(box[1]+box[3])//2
            with self.subTest(sign=name):
                self.assertEqual(self.allowed.getpixel((cx,cy)),0)
        for name,xy in {
            'top-brand':(800,130),
            'kinnaklova-peaks':(790,290),
            'church-door':(615,670),
            'reading-label':(1504,699),
            'words-label':(527,750),
            'sentences-label':(1176,504),
            'seabirds':(1320,209),
            'approved-blue-sea':(1620,476)
        }.items():
            with self.subTest(scene=name):
                self.assertEqual(self.allowed.getpixel(xy),0)

    def test_mask_count_and_precision(self):
        self.assertEqual(len(MASKS),5,'Three original characters and two narrow outliers')
        self.assertEqual(self.allowed.getpixel((420,648)),255)
        self.assertEqual(self.allowed.getpixel((430,647)),0)
        self.assertEqual(self.allowed.getpixel((1620,645)),0)

    def test_one_channel_pixel_changes_cannot_hide(self):
        before=Image.new('RGB',(2,1),(40,90,150))
        after=before.copy()
        after.putpixel((0,0),(41,90,150))
        diff=channel_exact_difference(before,after)
        self.assertEqual(diff.getpixel((0,0)),1)
        self.assertEqual(diff.getpixel((1,0)),0)

if __name__=='__main__':
    unittest.main()

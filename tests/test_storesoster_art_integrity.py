#!/usr/bin/env python3
"""Prove identity gate rejects substituted trolls and stolen face pixels."""
import sys
from pathlib import Path
import tempfile
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools' / 'rigging'))
from storesoster_art_integrity import verify
from storesoster_arm_layer_study import split_original, SIZE


def run(source):
    original = Image.open(source).convert('RGBA')
    _, arm, _ = split_original(original)
    arm_arr = np.asarray(arm)
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / 'candidate.png'
        # An empty artist layer remains work-in-progress, never approved.
        Image.new('RGBA', SIZE, (0, 0, 0, 0)).save(p)
        report = verify(source, p)
        assert report['geometry_integrity_pass'] is True
        assert report['premium_ready'] is False
        assert report['candidate_painted_pixels'] == 0
        # Masked synthetic paint can preserve identity, but not earn approval.
        safe = Image.new('RGBA', SIZE, (0, 0, 0, 0))
        mask = arm_arr[:, :, 3] == 255
        pixels = np.array(safe)
        pixels[mask] = [30, 40, 50, 255]
        Image.fromarray(pixels).save(p)
        report = verify(source, p)
        assert report['geometry_integrity_pass'] is True
        assert report['candidate_painted_pixels'] > 1000
        assert report['visual_anatomy_approved'] is False
        assert report['safe_to_integrate'] is False
        # Visible face pixels must NEVER be imported from a new character.
        pixels[160, 240] = [200, 80, 20, 255]
        Image.fromarray(pixels).save(p)
        try:
            verify(source, p)
            raise AssertionError('A foreign face pixel must be rejected')
        except ValueError as err:
            assert 'REJECT' in str(err)
        # Reject replacing the entire original with a new cartoon troll.
        Image.new('RGBA', SIZE, (120, 80, 20, 255)).save(p)
        try:
            verify(source, p)
            raise AssertionError('A wholesale alternate troll must be rejected')
        except ValueError as err:
            assert 'REJECT' in str(err)
        # Also reject changed original source bytes even if visually similar.
        Image.new('RGBA', SIZE, (0, 0, 0, 0)).save(p)
        wrong_source = Path(d) / 'source.png'
        original.save(wrong_source)
        try:
            verify(wrong_source, p)
            raise AssertionError('Only the exact approved source is valid')
        except ValueError as err:
            assert 'SHA-256' in str(err)
    print('PASS: approved source intact; face replacement and alternate troll blocked')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: test_storesoster_art_integrity.py /path/to/storesoster.webp')
    run(Path(sys.argv[1]))

#!/usr/bin/env python3
"""Source-pixel and OpenRaster structure guard; NO live app changes."""
import json
import sys
from pathlib import Path
from io import BytesIO
import xml.etree.ElementTree as ET
import zipfile
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools' / 'rigging'))
from storesoster_openraster_layers import create, LOCKED_SHA256, SIZE

def main():
    if len(sys.argv) != 3:
        raise SystemExit('Usage: test_storesoster_openraster_layers.py SOURCE OUTDIR')
    source, outdir = Path(sys.argv[1]), Path(sys.argv[2])
    ora, info = create(source, outdir)
    assert ora.stat().st_size > 100000
    assert info['source_sha256'] == LOCKED_SHA256
    assert info['hidden_anatomy_reconstructed'] is False
    assert info['art_approved'] is False
    assert info['integrated_in_app'] is False
    assert info['experimental_rotations']['0']['unpainted_pixels'] == 0
    assert info['experimental_rotations']['12']['unpainted_pixels'] > 1000
    with zipfile.ZipFile(ora) as z:
        assert z.testzip() is None
        assert z.namelist()[0] == 'mimetype'
        assert z.getinfo('mimetype').compress_type == zipfile.ZIP_STORED
        assert z.read('mimetype') == b'image/openraster'
        root = ET.fromstring(z.read('stack.xml'))
        assert root.attrib['w'] == str(SIZE[0])
        assert root.attrib['h'] == str(SIZE[1])
        layers = list(root.find('stack'))
        assert len(layers) == 6
        assert [l.attrib['visibility'] for l in layers] == [
            'hidden','hidden','visible','visible','visible','hidden'
        ]
        assert json.loads(z.read('source/rig-readiness.json')) == info
        assert z.read('source/approved-storesoster.webp') == source.read_bytes()
        def img(path):
            return Image.open(BytesIO(z.read(path))).convert('RGBA')
        original = img('data/00-original.png')
        body = img('data/01-body.png')
        blank = img('data/02-underpaint.png')
        arm = img('data/03-arm.png')
        neutral = img('mergedimage.png')
        assert blank.getchannel('A').getbbox() is None
        assert arm.getchannel('A').getbbox() is not None
        assert np.array_equal(np.asarray(Image.alpha_composite(body,arm)),np.asarray(neutral))
        before, after = np.asarray(original), np.asarray(neutral)
        assert np.array_equal(before[:,:,3],after[:,:,3])
        visible = before[:,:,3] > 0
        assert np.array_equal(before[:,:,:3][visible],after[:,:,:3][visible])
    print('PASS: editable six-layer OpenRaster, locked pixels, missing art blank')

if __name__ == '__main__':
    main()

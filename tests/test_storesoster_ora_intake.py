#!/usr/bin/env python3
"""Verify artist intake cannot swap a character or mistake zero holes for art."""
import io,sys,tempfile
from pathlib import Path
from zipfile import ZipFile
import numpy as np
from PIL import Image

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'/'rigging'))
from storesoster_ora_intake import verify, Reject

def png(a):
    b=io.BytesIO()
    Image.fromarray(a,'RGBA').save(b,format='PNG')
    return b.getvalue()

def replace(src,out,changes):
    with ZipFile(src) as zi,ZipFile(out,'w') as zo:
        for item in zi.infolist():
            zo.writestr(item,changes.get(item.filename,zi.read(item.filename)))

def run(source,ora):
    with tempfile.TemporaryDirectory(prefix='laria-ora-qa-') as folder:
        path=Path(folder)
        normal=verify(source,ora,path/'original-empty')
        assert normal['neutral_rgba_pixel_identical']
        assert normal['missing_silhouette_pixels_by_pose']['25']>4000
        assert not normal['app_integration_permitted']
        with ZipFile(ora) as z:
            arm=np.asarray(Image.open(io.BytesIO(z.read('data/06-arm.png'))).convert('RGBA'))[:,:,3]
            holes=np.asarray(Image.open(io.BytesIO(z.read('data/07-holes.png'))).convert('RGBA'))[:,:,3]
            blank=np.array(Image.open(io.BytesIO(z.read('data/05-hair.png'))).convert('RGBA'))
            original=np.array(Image.open(io.BytesIO(z.read('data/09-original.png'))).convert('RGBA'))
            embedded=z.read('source/approved-storesoster.webp')
        assert not blank[:,:,3].any()
        # Deliberately ugly magenta fills all measured holes; this is NOT art.
        fake=blank.copy()
        fake[(holes>0)&(arm==255)]=[238,15,140,255]
        candidate=path/'SYNTHETIC-NOT-ART.ora'
        replace(ora,candidate,{'data/05-hair.png':png(fake)})
        report=verify(source,candidate,path/'synthetic-test')
        assert report['measured_holes_closed'] and not report['phase1_approved']
        assert not report['human_visual_approval'] and not report['app_integration_permitted']
        wrong=blank.copy();wrong[190,240]=[0,255,0,255]
        forged=path/'modified-face.ora'
        replace(ora,forged,{'data/05-hair.png':png(wrong)})
        try:
            verify(source,forged,path/'reject-face')
            raise AssertionError('Face overwriting unexpectedly accepted')
        except Reject as err: assert 'outside hidden' in str(err)
        altered=original.copy();altered[190,240]=[0,255,0,255]
        wrong_ref=path/'altered-reference.ora'
        replace(ora,wrong_ref,{'data/09-original.png':png(altered)})
        try:
            verify(source,wrong_ref,path/'reject-reference')
            raise AssertionError('Tampered original unexpectedly accepted')
        except Reject as err: assert 'Original or guide' in str(err)
        wrong_embedded=path/'wrong-source.ora'
        replace(ora,wrong_embedded,{'source/approved-storesoster.webp':embedded[:-1]+bytes([embedded[-1]^1])})
        try:
            verify(source,wrong_embedded,path/'reject-source')
            raise AssertionError('Tampered source unexpectedly accepted')
        except Reject as err: assert 'Embedded source' in str(err)
    print('PASS painted ORA import, original identity, tamper rejection; phase1 remains BLOCKED')

if __name__=='__main__':
    if len(sys.argv)!=3: raise SystemExit('Usage: script SOURCE.webp ARTIST.ora')
    run(sys.argv[1],sys.argv[2])

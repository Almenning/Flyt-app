#!/usr/bin/env python3
"""The artist layer can be previewed ONLY after passing locked-source checks."""
import json
from pathlib import Path
import sys
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'/'rigging'))
from storesoster_pose_lab import build
from storesoster_arm_layer_study import SIZE


def run(source, out):
    source,out=Path(source),Path(out)
    initial=out/'initial-draft'
    original=build(source,initial)
    assert original['neutral_exact'] is True
    assert original['premium_ready'] is False
    assert original['candidate_origin']=='experimental-source-texture-DRAFT'
    imported=out/'artist-import-proof'
    underpaint=initial/'04-hidden-fabric-DRAFT.png'
    report=build(source,imported,underpaint=underpaint)
    assert report['neutral_exact'] is True
    assert report['art_import_passed_identity_gate'] is True
    assert report['candidate_origin']=='imported-layer-only'
    assert report['premium_ready'] is False
    assert report['anatomically_approved'] is False
    assert report['integrated_in_app'] is False
    assert (imported/'review.html').is_file()
    assert (imported/'05-arm-motion-proof-NOT-APPROVED.png').stat().st_size>10000
    for name in ('01-locked-original.png','04-hidden-fabric-DRAFT.png'):
        assert (initial/name).read_bytes()==(imported/name).read_bytes()
    # A brand-new full image is an identity violation, even with correct size.
    foreign=out/'whole-other-troll.png'
    Image.new('RGBA',SIZE,(120,80,55,255)).save(foreign)
    try:
        build(source,out/'must-reject',underpaint=foreign)
        raise AssertionError('Whole alternate character should have been rejected')
    except ValueError as exc:
        assert 'REJECT' in str(exc)
    print('PASS: permitted hidden-art input renders only as DRAFT, wrong character rejected')


if __name__=='__main__':
    if len(sys.argv)!=3:
        raise SystemExit('Usage: test_storesoster_pose_import.py LOCKED_SOURCE OUTPUT')
    run(sys.argv[1],sys.argv[2])

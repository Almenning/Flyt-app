#!/usr/bin/env python3
"""Guard approved Storesoster identity when importing new concealed art.

This does NOT approve anatomical aesthetics or authorize a production merge.
Only pixels that are hidden by the locked arm in the neutral pose may be
introduced by an artist. Neutral compositing must still be pixel-identical.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image
from storesoster_arm_layer_study import LOCKED_SHA256, SIZE, split_original, exposed_pixels


def verify(source, hidden_layer, report_path=None):
    source, hidden_layer = Path(source), Path(hidden_layer)
    sha = hashlib.sha256(source.read_bytes()).hexdigest()
    if sha != LOCKED_SHA256:
        raise ValueError('REJECT: storesoster source does not match approved SHA-256')
    original = Image.open(source).convert('RGBA')
    candidate = Image.open(hidden_layer).convert('RGBA')
    if original.size != SIZE or candidate.size != SIZE:
        raise ValueError('REJECT: layer dimensions must be exactly 512x1024')
    _, arm, body = split_original(original)
    ref = np.asarray(original, dtype=np.uint8)
    art = np.asarray(candidate, dtype=np.uint8)
    arm_alpha = np.asarray(arm.getchannel('A'), dtype=np.uint8)
    candidates = art[:, :, 3] > 0
    # No new art on forehead, dress, hair or any other visible source pixel.
    # Only the original arm's concealed footprint may hold underpainting.
    outside = candidates & (arm_alpha == 0)
    changed_outside = int(outside.sum())
    painted = int(candidates.sum())
    neutral = Image.alpha_composite(Image.alpha_composite(body, candidate), arm)
    neutral_arr = np.asarray(neutral, dtype=np.uint8)
    src_visible = ref[:, :, 3] > 0
    rgba_changed = np.any(ref != neutral_arr, axis=2) & src_visible
    changed_neutral = int(rgba_changed.sum())
    # The transparent silhouette must remain identical as well.
    silhouette_change = int(np.count_nonzero(ref[:, :, 3] != neutral_arr[:, :, 3]))
    coverage = {}
    for angle in (-25, -12, 12, 25):
        _, holes, holes_n, _ = exposed_pixels(original, arm, body, angle)
        covered = int(np.count_nonzero(holes & candidates))
        coverage[str(angle)] = {
            'source_holes': holes_n,
            'painted_within_holes': covered,
            'still_unpainted': holes_n - covered,
        }
    geometry_ok = changed_outside == 0 and changed_neutral == 0 and silhouette_change == 0
    report = {
        'locked_original_sha256': sha,
        'candidate': hidden_layer.name,
        'candidate_painted_pixels': painted,
        'outside_hidden_arm_pixels': changed_outside,
        'neutral_original_visible_changed_pixels': changed_neutral,
        'neutral_alpha_changed_pixels': silhouette_change,
        'geometry_integrity_pass': geometry_ok,
        'coverage_at_original_pose': coverage,
        'visual_anatomy_approved': False,
        'premium_ready': False,
        'safe_to_integrate': False,
        'limitation': 'Pixel identity cannot establish anatomical plausibility, fabric continuity or expression quality.',
    }
    if report_path is not None:
        dest = Path(report_path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    if not geometry_ok:
        raise ValueError('REJECT: candidate changes locked visible artwork or adds paint outside concealed arm area: '
                         + json.dumps({k: report[k] for k in [
                             'outside_hidden_arm_pixels', 'neutral_original_visible_changed_pixels',
                             'neutral_alpha_changed_pixels']}))
    return report


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', required=True)
    p.add_argument('--underpaint', required=True)
    p.add_argument('--report')
    args = p.parse_args()
    print(json.dumps(verify(args.source, args.underpaint, args.report), indent=2))


if __name__ == '__main__':
    main()

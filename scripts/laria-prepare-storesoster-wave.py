#!/usr/bin/env python3
"""Repair video alpha by tracking the locked V1 silhouette, never repainting RGB.

Requires Pillow, numpy, opencv-python-headless and ffmpeg. The immutable source
video is stored under tools/laria_art/inputs. Run from the repository root:
  python scripts/laria-prepare-storesoster-wave.py --output /tmp/wave.webp
The output remains a review candidate until actual-app visual approval.
"""
import argparse
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IDENTITY_SHA = 'b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89'
WIDTH, HEIGHT, FPS = 440, 900, 12
OUTPUT_WIDTH, OUTPUT_HEIGHT = 264, 540  # >2x the 246 CSS-pixel maximum Home actor


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'tools/laria_art/inputs/storesoster-wave-source-20261120.mp4')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--review', type=Path)
    args = parser.parse_args()
    identity = ROOT / 'laer-litt-mer/assets/gangemagi-troll/storesoster.webp'
    if sha(identity) != IDENTITY_SHA:
        raise SystemExit('The locked V1 identity bytes changed; refusing to continue.')
    source = Image.open(identity).convert('RGBA')
    # Resize RGB separately: premultiplying by alpha would blacken its hidden
    # colour pixels and break registration against the original generated video.
    reference_rgb = np.asarray(source.convert('RGB').resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS))
    reference_alpha = np.asarray(source.getchannel('A').resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS))
    reference_gray = cv2.cvtColor(reference_rgb, cv2.COLOR_RGB2GRAY)
    xx, yy = np.meshgrid(np.arange(WIDTH, dtype=np.float32), np.arange(HEIGHT, dtype=np.float32))
    frames, durations, boot_opacity = [], [], []
    cv2.setNumThreads(1)
    with tempfile.TemporaryDirectory(prefix='laria-wave-') as temp:
        subprocess.run([
            'ffmpeg', '-nostdin', '-v', 'error', '-i', str(args.source),
            '-map', '0:v:0', '-an', '-vf', f'fps={FPS},scale={WIDTH}:{HEIGHT}:flags=lanczos',
            str(Path(temp) / 'frame-%03d.png'),
        ], check=True)
        for i, path in enumerate(sorted(Path(temp).glob('frame-*.png'))):
            rgb = np.asarray(Image.open(path).convert('RGB'))
            gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
            # Backward dense correspondence maps current-frame pixels into V1.
            # Only the transparency mask moves; source video RGB is untouched.
            flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM).calc(gray, reference_gray, None)
            alpha = cv2.remap(reference_alpha, xx + flow[:, :, 0], yy + flow[:, :, 1],
                              cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
            frames.append(Image.fromarray(np.dstack((rgb, alpha)), 'RGBA').resize(
                (OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.LANCZOS))
            durations.append(round((i + 1) * 1000 / FPS) - round(i * 1000 / FPS))
            # This small core lies well inside the previously disappearing boot.
            boot_opacity.append(int(alpha[775:790, 125:170].min()))
    if not frames:
        raise SystemExit('No video frames decoded.')
    if min(boot_opacity) < 250:
        raise SystemExit(f'Boot opacity regressed: {min(boot_opacity)}')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(args.output, format='WEBP', save_all=True, append_images=frames[1:],
                   duration=durations, loop=1, lossless=False, quality=88, method=4,
                   alpha_quality=100, exact=True)
    encoded = Image.open(args.output)
    encoded_duration = 0
    encoded_boot = []
    for i in range(encoded.n_frames):
        encoded.seek(i)
        pixels = np.asarray(encoded.convert('RGBA'))
        encoded_duration += encoded.info['duration']
        encoded_boot.append(int(pixels[465:474, 75:102, 3].min()))
    if min(encoded_boot) < 250:
        raise SystemExit('Encoded boot opacity regressed.')
    manifest = {
        'status': 'review-only', 'identity_sha256': IDENTITY_SHA,
        'source_video_sha256': sha(args.source), 'output_sha256': sha(args.output),
        'width': OUTPUT_WIDTH, 'height': OUTPUT_HEIGHT, 'decoded_frames': len(frames),
        'encoded_frames': encoded.n_frames, 'duration_ms': encoded_duration,
        'bytes': args.output.stat().st_size, 'loop_count': 1,
        'minimum_boot_core_alpha': min(encoded_boot),
        'method': 'V1 alpha tracked by backward DIS optical flow; source video RGB retained',
        'versions': {'opencv': cv2.__version__, 'pillow': Image.__version__, 'numpy': np.__version__},
    }
    args.output.with_suffix('.json').write_text(json.dumps(manifest, indent=2) + '\n')
    if args.review:
        args.review.mkdir(parents=True, exist_ok=True)
        y, x = np.indices((OUTPUT_HEIGHT, OUTPUT_WIDTH))
        checker = np.where((x // 16 + y // 16) % 2, 211, 237).astype(np.uint8)
        background = Image.fromarray(np.repeat(checker[:, :, None], 3, 2)).convert('RGBA')
        # Review the decoded delivery, not PIL's encoder-owned source frames.
        samples = [0, encoded.n_frames//4, encoded.n_frames//2, 3*encoded.n_frames//4, encoded.n_frames-1]
        sheet = Image.new('RGB', (OUTPUT_WIDTH * len(samples), OUTPUT_HEIGHT))
        for col, i in enumerate(samples):
            encoded.seek(i)
            sheet.paste(Image.alpha_composite(background, encoded.convert('RGBA')).convert('RGB'), (col * OUTPUT_WIDTH, 0))
        sheet.save(args.review / 'repaired-alpha-review.png')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()

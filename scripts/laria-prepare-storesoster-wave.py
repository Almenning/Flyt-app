#!/usr/bin/env python3
"""Repair video alpha by tracking the locked V1 silhouette, never repainting RGB.

Requires Pillow, numpy, opencv-python-headless and ffmpeg. The immutable source
video is stored under tools/laria_art/inputs. Run from the repository root:
  python scripts/laria-prepare-storesoster-wave.py --output /tmp/wave.webp
The output remains a review candidate until actual-app visual approval.

The optional pinned ground matte removes the ground without repainting the
character. Use --poster-output with it to create a matching neutral poster;
the locked identity is never overwritten.
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
GROUND_MATTE_SHA = 'e8fb4db19462bc4181802be737d894edaab206872d8566eec9ffdfe4eca2e57b'
GROUND_SOURCE_SHA = '554ceabb70e7202a615672311357d740e80466a07467035bdc2deee42db5337a'
GROUND_START_Y = 620
WIDTH, HEIGHT, FPS = 440, 900, 12
OUTPUT_WIDTH, OUTPUT_HEIGHT = 264, 540  # >2x the 246 CSS-pixel maximum Home actor


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_poster(path, source, matte):
    """Keep original RGB and upper alpha exactly; change only lower alpha."""
    original = np.asarray(source)
    alpha = np.asarray(Image.fromarray(matte).resize(source.size, Image.Resampling.LANCZOS)).copy()
    preserved_rows = (GROUND_START_Y * source.height + HEIGHT - 1) // HEIGHT
    alpha[:preserved_rows] = 255
    poster = original.copy()
    poster[:, :, 3] = np.minimum(original[:, :, 3], alpha)
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(poster, 'RGBA').save(path, format='WEBP', lossless=True,
                                       quality=100, method=6, exact=True)
    decoded = np.asarray(Image.open(path).convert('RGBA'))
    visible = decoded[:, :, 3] > 0
    if not np.array_equal(decoded[visible, :3], original[visible, :3]):
        raise SystemExit('Lossless poster changed visible original RGB.')
    if not np.array_equal(decoded[:preserved_rows], original[:preserved_rows]):
        raise SystemExit('Lossless poster changed the protected upper silhouette.')
    if not np.array_equal(decoded[:, :, 3], poster[:, :, 3]):
        raise SystemExit('Lossless poster changed the requested alpha.')
    metadata = {
        'status': 'review-only', 'kind': 'neutral-poster',
        'identity_sha256': IDENTITY_SHA, 'ground_matte_sha256': GROUND_MATTE_SHA,
        'output_sha256': sha(path), 'width': source.width, 'height': source.height,
        'bytes': path.stat().st_size, 'lossless': True,
        'visible_original_rgb_pixel_exact': True,
        'unchanged_original_upper_rows': preserved_rows,
        'method': 'Original identity RGB with registered lower alpha only; immutable identity retained',
    }
    path.with_suffix('.json').write_text(json.dumps(metadata, indent=2) + '\n')
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'tools/laria_art/inputs/storesoster-wave-source-20261120.mp4')
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--review', type=Path)
    parser.add_argument('--ground-matte', type=Path,
                        help='Pinned 440x900 grayscale alpha; removes ground only, never supplies RGB')
    parser.add_argument('--poster-output', type=Path,
                        help='Matching lossless original-RGB WebP poster; requires --ground-matte')
    args = parser.parse_args()
    if args.poster_output and not args.ground_matte:
        parser.error('--poster-output requires --ground-matte')
    identity = ROOT / 'laer-litt-mer/assets/gangemagi-troll/storesoster.webp'
    protected = {identity.resolve(), args.source.resolve()}
    if args.ground_matte:
        protected.add(args.ground_matte.resolve())
    outputs = [p.resolve() for p in (args.output, args.poster_output) if p]
    if any(p in protected for p in outputs) or len(set(outputs)) != len(outputs):
        parser.error('Output paths must be distinct and must not overwrite any source input.')
    if sha(identity) != IDENTITY_SHA:
        raise SystemExit('The locked V1 identity bytes changed; refusing to continue.')
    source = Image.open(identity).convert('RGBA')
    # Resize RGB separately: premultiplying by alpha would blacken its hidden
    # colour pixels and break registration against the original generated video.
    reference_rgb = np.asarray(source.convert('RGB').resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS))
    reference_alpha = np.asarray(source.getchannel('A').resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS))
    original_alpha = reference_alpha
    ground_core = None
    if args.ground_matte:
        if sha(args.ground_matte) != GROUND_MATTE_SHA:
            raise SystemExit('Ground matte SHA-256 mismatch; refusing unreviewed alpha.')
        if sha(args.source) != GROUND_SOURCE_SHA:
            raise SystemExit('Ground matte requires the pinned original source video.')
        matte = Image.open(args.ground_matte)
        if matte.mode != 'L' or matte.size != (WIDTH, HEIGHT):
            raise SystemExit('Ground matte must be a 440x900 grayscale image.')
        reference_alpha = np.asarray(matte)
        if not np.array_equal(reference_alpha[:GROUND_START_Y], original_alpha[:GROUND_START_Y]):
            raise SystemExit('Ground matte changed the protected upper silhouette.')
        if np.any(reference_alpha > original_alpha):
            raise SystemExit('Ground matte added pixels outside the original silhouette.')
        ground_core = ((original_alpha > 250) & (reference_alpha < 5)).astype(np.uint8)
        ground_core[:GROUND_START_Y] = 0
        ground_core = cv2.erode(ground_core, np.ones((5, 5), np.uint8))
    reference_gray = cv2.cvtColor(reference_rgb, cv2.COLOR_RGB2GRAY)
    xx, yy = np.meshgrid(np.arange(WIDTH, dtype=np.float32), np.arange(HEIGHT, dtype=np.float32))
    frames, durations, boot_opacity, right_boot_opacity, ground_removed = [], [], [], [], []
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
            if ground_core is not None:
                previous_alpha = cv2.remap(original_alpha, xx + flow[:, :, 0], yy + flow[:, :, 1],
                                          cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
                if np.any(alpha > previous_alpha):
                    raise SystemExit('Tracked ground matte added alpha to the original video mask.')
                core = cv2.remap(ground_core, xx + flow[:, :, 0], yy + flow[:, :, 1],
                                 cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0
                ground_removed.append(float((alpha[core] <= 5).mean()))
            frames.append(Image.fromarray(np.dstack((rgb, alpha)), 'RGBA').resize(
                (OUTPUT_WIDTH, OUTPUT_HEIGHT), Image.Resampling.LANCZOS))
            durations.append(round((i + 1) * 1000 / FPS) - round(i * 1000 / FPS))
            # This small core lies well inside the previously disappearing boot.
            boot_opacity.append(int(alpha[775:790, 125:170].min()))
            right_boot_opacity.append(int(alpha[770:790, 290:330].min()))
    if not frames:
        raise SystemExit('No video frames decoded.')
    if min(boot_opacity + right_boot_opacity) < 250:
        raise SystemExit(f'Boot opacity regressed: {min(boot_opacity + right_boot_opacity)}')
    if ground_removed and min(ground_removed) < 0.999:
        raise SystemExit('Ground matte did not remove the tracked ground interior.')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(args.output, format='WEBP', save_all=True, append_images=frames[1:],
                   duration=durations, loop=1, lossless=False, quality=88, method=4,
                   alpha_quality=100, exact=True)
    encoded = Image.open(args.output)
    encoded_duration = 0
    encoded_boot, encoded_right_boot = [], []
    for i in range(encoded.n_frames):
        encoded.seek(i)
        pixels = np.asarray(encoded.convert('RGBA'))
        encoded_duration += encoded.info['duration']
        encoded_boot.append(int(pixels[465:474, 75:102, 3].min()))
        encoded_right_boot.append(int(pixels[462:474, 174:198, 3].min()))
    if min(encoded_boot + encoded_right_boot) < 250:
        raise SystemExit('Encoded boot opacity regressed.')
    manifest = {
        'status': 'review-only', 'identity_sha256': IDENTITY_SHA,
        'source_video_sha256': sha(args.source), 'output_sha256': sha(args.output),
        'width': OUTPUT_WIDTH, 'height': OUTPUT_HEIGHT, 'decoded_frames': len(frames),
        'encoded_frames': encoded.n_frames, 'duration_ms': encoded_duration,
        'bytes': args.output.stat().st_size, 'loop_count': 1,
        'minimum_boot_core_alpha': min(encoded_boot),
        'minimum_right_boot_core_alpha': min(encoded_right_boot),
        'method': 'V1 alpha tracked by backward DIS optical flow; source video RGB retained',
        'versions': {'opencv': cv2.__version__, 'pillow': Image.__version__, 'numpy': np.__version__},
    }
    if args.ground_matte:
        manifest.update({
            'ground_matte_sha256': GROUND_MATTE_SHA,
            'unchanged_reference_upper_rows': GROUND_START_Y,
            'source_video_rgb_retained_before_resampling_and_encoding': True,
            'minimum_tracked_ground_core_removed_fraction': min(ground_removed),
            'minimum_source_left_boot_core_alpha': min(boot_opacity),
            'minimum_source_right_boot_core_alpha': min(right_boot_opacity),
            'method': 'Pinned ground-free original alpha tracked by backward DIS flow; source video RGB retained',
        })
    if args.poster_output:
        poster = write_poster(args.poster_output, source, reference_alpha)
        manifest['matching_poster_sha256'] = poster['output_sha256']
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

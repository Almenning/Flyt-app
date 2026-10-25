#!/usr/bin/env python3
"""Source-pixel 2D mesh feasibility. NOT an approved TrollActor or app asset."""
import argparse
import hashlib
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

LOCKED_SHA = "b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89"
MODES = [
    ("Noytral original", 1.25, (0, 0), (0, 0), "neutral"),
    ("Hvile og blunk", 2, (0, 0), (0, 0), "blink"),
    ("Liten handbevegelse", 2, (5, -12), (-1, -5), "micro"),
    ("Tenke", 1.8, (2, -8), (0, -3), "micro"),
    ("Hint - mikrotest", 1.8, (10, -9), (2, -4), "micro"),
    ("Juble - IKKE GODKJENT", 2, (11, -15), (2, -6), "micro"),
]

def create(source, arm, output):
    source, arm, output = map(Path, (source, arm, output))
    if hashlib.sha256(source.read_bytes()).hexdigest() != LOCKED_SHA:
        raise ValueError("STOP: locked Storesoster source hash mismatch")
    original = np.asarray(Image.open(source).convert("RGBA"))
    influence = Image.open(arm).convert("RGBA").getchannel("A")
    if original.shape != (1024, 512, 4) or influence.size != (512, 1024):
        raise ValueError("STOP: incorrect source or arm size")
    alpha = np.asarray(influence.filter(ImageFilter.GaussianBlur(7.2)),
                       dtype=np.float32) / 255
    ys, xs = np.indices((1024, 512), dtype=np.float32)
    def gaussian(cx, cy, sx, sy):
        return np.exp(-0.5 * (((xs-cx)/sx)**2 + ((ys-cy)/sy)**2))
    hand = gaussian(212, 512, 55, 42) * alpha
    wrist = gaussian(153, 483, 40, 42) * alpha
    breath = gaussian(270, 422, 133, 129)
    eye1, eye2 = gaussian(231, 244, 24, 13), gaussian(325, 227, 24, 13)
    neutral = cv2.remap(original, xs, ys, cv2.INTER_LINEAR)
    assert np.array_equal(neutral, original), "Neutral mesh must preserve all source pixels"
    output.mkdir(parents=True, exist_ok=True)
    fps = 16
    video = output / "storesoster-local-mesh-NOT-APPROVED.mp4"
    writer = cv2.VideoWriter(str(video), cv2.VideoWriter_fourcc(*"mp4v"),
                             fps, (512, 1024))
    if not writer.isOpened():
        raise RuntimeError("Unable to create video proof")
    count, maximum = 0, 0.0
    background = np.zeros((1024, 512, 3), np.float32)
    background[:] = (246, 234, 219)
    for name, duration, hand_move, wrist_move, kind in MODES:
        for tick in range(round(duration * fps)):
            t = tick / fps
            envelope = max(0, math.sin(math.pi * min(1, t/duration)))**2
            amount = ((0.5 - 0.5*math.cos(t*math.pi*3))*0.7*envelope
                      if kind == "micro" else 0)
            dx = hand*(hand_move[0]*amount) + wrist*(wrist_move[0]*amount)
            dy = hand*(hand_move[1]*amount) + wrist*(wrist_move[1]*amount)
            maximum = max(maximum, float(np.max(np.hypot(dx, dy))))
            blink = (0.72*max(0, 1-abs(t-1.02)/.16) if kind == "blink"
                     else 0.62*max(0, 1-abs(t-.72)/.13) if kind == "micro"
                     else 0)
            eyes = blink*2.2*((ys-244)*eye1 + (ys-227)*eye2)
            breathing = .6*math.sin(t*2)*envelope if kind != "neutral" else 0
            warped = cv2.remap(
                original, (xs-dx).astype(np.float32),
                (ys-dy+eyes-breathing*breath).astype(np.float32),
                cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT,
                borderValue=(0, 0, 0, 0)).astype(np.float32)
            opacity = warped[:, :, 3:4] / 255
            rgb = np.uint8(np.clip(warped[:, :, :3]*opacity
                                   + background*(1-opacity), 0, 255))
            cv2.rectangle(rgb, (0, 0), (511, 60), (253, 249, 240), -1)
            cv2.putText(rgb, name, (16, 25), cv2.FONT_HERSHEY_SIMPLEX,
                        .55, (45, 42, 42), 1, cv2.LINE_AA)
            cv2.putText(rgb, "KUN TEKNISK TEST - IKKE GODKJENT",
                        (16, 48), cv2.FONT_HERSHEY_SIMPLEX,
                        .44, (90, 70, 160), 1, cv2.LINE_AA)
            writer.write(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
            count += 1
    writer.release()
    report = {
        "source_sha256": LOCKED_SHA,
        "original_untouched": True,
        "neutral_pixel_exact": True,
        "frames": count,
        "fps": fps,
        "max_tested_local_shift_pixels": round(maximum, 2),
        "local_deformation_only": True,
        "new_anatomy_painted": False,
        "full_wave_approved": False,
        "natural_celebration_approved": False,
        "visually_approved": False,
        "safari_or_webkit_verified": False,
        "integrated_in_app": False,
        "premium_ready": False,
        "limitations": "Small local motions only. Full waving and independent "
                       "articulated rig require approved underpaint and anatomy."
    }
    (output / "readiness.json").write_text(json.dumps(report, indent=2) + "\n")
    return report

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--arm", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    print(json.dumps(create(args.source, args.arm, args.output), indent=2))

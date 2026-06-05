# Rotations — the "yep, that's real" proof (real, not placeholder)

Real 3-D turntable clips of actual builds, rendered through our own rig (`prismarine-viewer` + real
`minecraft-assets` textures) — a 360° spin a flat AI picture can't fake. These **replace the earlier
head-on placeholder**.

Each `spin-*.mp4` is a **12 fps, 360°, seamless loop** (30 frames at 12°/frame; frame 30 wraps to frame 0,
so there is no 0°/360° double-count) — a **chainable unit**: concatenate any set of them into a longer
"rotating builds" sequence.

| clip | build | source |
|------|-------|--------|
| `spin-taj-015.mp4` | Taj (champion, "strong") | `runs/015-vRefRevise-designdoc` |
| `spin-horyuji-019.mp4` | Hōryū-ji | `runs/019-vRefRevise-designdoc` |
| `spin-arc-021.mp4` | Arc de Triomphe | `runs/021-vRefRevise-designdoc` |
| `spin-mausoleum-022.mp4` | Sun Yat-sen mausoleum | `runs/022-vRefRevise-designdoc` |
| `rotating-builds-montage.mp4` | all four chained | the montage beat |

Note (honest): these are real voxel builds, so the spin reveals depth — and, at the back, that they are
currently **facades** (flat reverse side). That's on-thesis: it motivates the whole-structure / sculptor
work (E-11). The strongest angles are the front 3/4 sweep.

## Regenerate / chain (reproducible)

```bash
# one build → a 12fps 360° seamless orbit clip (frames + mp4 under render/out/orbit/<id>/)
node render/src/orbit-cli.mjs --artifact benchmarks/temple-facade/runs/015-vRefRevise-designdoc/artifact.json \
  --frames 30 --fps 12 --mp4

# chain any set of orbit clips into one montage (ffmpeg concat, -c copy — they share params)
node render/src/orbit-chain.mjs render/out/orbit/montage.mp4 \
  render/out/orbit/015-*/orbit.mp4 render/out/orbit/019-*/orbit.mp4 ...
```

Requires headless GL (`GL_AVAILABLE`) for `orbit-cli`, and `ffmpeg` on PATH for encoding/chaining.

# Rotations — the "yep, that's real" proof (real, not placeholder)

Real 3-D turntable clips of actual builds, rendered through our own rig (`prismarine-viewer` + real
`minecraft-assets` textures) — a 360° spin a flat AI picture can't fake. These **replace the earlier
head-on placeholder**.

Each `spin-*.mp4` is a **12 fps, 360°, seamless loop** (30 frames at 12°/frame; frame 30 wraps to frame 0,
so there is no 0°/360° double-count) — a **chainable unit**: concatenate any set of them into a longer
"rotating builds" sequence.

There are **two variants**:
- **`spin-*.mp4`** — full 360° turntable (reveals the flat facade back for half the loop).
- **`rock-*.mp4`** — **front-arc oscillation** (a ±40° sine rock around the front): shows depth/parallax
  from both 3/4 sides and **never exposes the flat back**. **Preferred for the hero shot (F10).**

| clip | build | source |
|------|-------|--------|
| `rock-taj-015.mp4` ★ hero | Taj (champion, "strong") — front-arc rock | `runs/015-vRefRevise-designdoc` |
| `rock-horyuji-019.mp4` | Hōryū-ji — rock | `runs/019-vRefRevise-designdoc` |
| `rock-arc-021.mp4` | Arc de Triomphe — rock | `runs/021-vRefRevise-designdoc` |
| `rock-mausoleum-022.mp4` | Sun Yat-sen mausoleum — rock | `runs/022-vRefRevise-designdoc` |
| `rock-builds-montage.mp4` | four rocks chained — the montage beat (no flat back) | — |
| `spin-taj-015.mp4` | Taj — full 360° | `runs/015-vRefRevise-designdoc` |
| `spin-horyuji-019.mp4` | Hōryū-ji — full 360° | `runs/019-vRefRevise-designdoc` |
| `spin-arc-021.mp4` | Arc de Triomphe — full 360° | `runs/021-vRefRevise-designdoc` |
| `spin-mausoleum-022.mp4` | Sun Yat-sen mausoleum — full 360° | `runs/022-vRefRevise-designdoc` |
| `rotating-builds-montage.mp4` | four spins chained | the full-360 montage |

Note (honest): these are real voxel builds, so the rotation reveals depth — and the full-360 `spin-*`
clips reveal that they are currently **facades** (flat reverse side). The **`rock-*` front-arc variant
avoids this** by staying in the front hemisphere. The flat back is on-thesis anyway (it motivates the
whole-structure / sculptor work, E-11) — but for a polished hero shot use the rock.

## Regenerate / chain (reproducible)

```bash
# one build → a 12fps 360° seamless orbit clip (frames + mp4 under render/out/orbit/<id>/)
node render/src/orbit-cli.mjs --artifact benchmarks/temple-facade/runs/015-vRefRevise-designdoc/artifact.json \
  --frames 30 --fps 12 --mp4

# front-arc OSCILLATION variant (±40° rock around the front; never shows the flat back)
node render/src/orbit-cli.mjs --artifact benchmarks/temple-facade/runs/015-vRefRevise-designdoc/artifact.json \
  --oscillate --amplitude 40 --center 0 --frames 30 --fps 12 --mp4

# chain any set of orbit clips into one montage (ffmpeg concat, -c copy — they share params)
node render/src/orbit-chain.mjs render/out/orbit/montage.mp4 \
  render/out/orbit/015-*/orbit.mp4 render/out/orbit/019-*/orbit.mp4 ...
```

Requires headless GL (`GL_AVAILABLE`) for `orbit-cli`, and `ffmpeg` on PATH for encoding/chaining.

## Sculpture set (E-13 / S-038) — `rock-<subject>-<seq>.mp4`

The 12-build sculptural best-of (T-038-01). These rocks were **not re-rendered**: the `vConcept`
sculpture pipeline already saves each build's turntable as 24 rock-mode frames
(`summary.json.turntable` = center 45°, amplitude 40°, mode `rock`), so this set is just those frames
**ffmpeg-encoded** (12 fps, `yuv420p`) — same params as `render/src/orbit-clip.mjs`. The source
`runs/*/turntable/` frames are gitignored; these mp4s are the committed artifacts. Manifest + captions:
`pr/assets/sculptures.md`.

| clip | build | source run |
|------|-------|------------|
| `rock-dancing-man-002.mp4` | dancing man @32 | `sculpture/runs/002-…` |
| `rock-moai-003.mp4` | moai @32 (angular best case) | `sculpture/runs/003-…` |
| `rock-pineapple-004.mp4` | pineapple @32 | `sculpture/runs/004-…` |
| `rock-bow-and-arrow-005.mp4` | bow & arrow @32 (thin stress) | `sculpture/runs/005-…` |
| `rock-heart-006.mp4` | anatomical heart @32 (form loss) | `sculpture/runs/006-…` |
| `rock-sword-007.mp4` | sword @32 | `sculpture/runs/007-…` |
| `rock-mushroom-008.mp4` | mushroom @32 | `sculpture/runs/008-…` |
| `rock-koi-009.mp4` | koi @32 (line loss) | `sculpture/runs/009-…` |
| `rock-moai-010.mp4` · `…-003` · `rock-moai-011.mp4` | moai 16 / 32 / 48 triptych | runs 010 / 003 / 011 |
| `rock-pineapple-012.mp4` · `…-004` · `rock-pineapple-013.mp4` | pineapple 16 / 32 / 48 triptych | runs 012 / 004 / 013 |

Rock (front-arc), not spin: a sculpture's back is **inferred** from one 3/4 concept (single-view
reconstruction), so the front-arc never parades the weaker reverse. No `spin-*` variants generated.

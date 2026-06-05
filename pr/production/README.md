# Production desk

Assembly & distribution for the evolution-showcase video.

**Job:** turn the storyboard + the asset sequence into a deliverable — an output spec, an assembly plan, a
rough cut if tooling allows, and the post copy.

Output:
- `spec.md` — format/aspect/length for LinkedIn (square 1:1 or vertical 4:5; ~30–60s), caption style,
  pacing, music notes.
- `assembly.md` — how it's built; if `ffmpeg` is available, an image-sequence slideshow with captions as
  a **rough cut** (`rough-cut.mp4`), else a precise shot-list a human assembles in a video tool.
- `post.md` — the LinkedIn post copy (hook line, body, CTA, hashtags).

- `turntable.md` — the "yep, that's real" proof: an **orbit render** (sweep camera azimuth around a build's
  voxel world via `prismarine-viewer` + real `minecraft-assets` textures) → rotation clips of the actual
  builds. A small extension of the head-on render harness; also serves E-11's multi-view review.

Final high-production editing (motion graphics, licensed music) is a human/video-tool step — this desk
delivers everything up to and including a rough cut.

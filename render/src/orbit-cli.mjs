// `npm run render:orbit` — the runnable turntable rig (T-032-01; AC #1, #2).
//
// Given a build artifact (a runs/<id>/artifact.json, or a dir containing one), render N
// frames sweeping azimuth 0→360° at fixed elevation/distance, into the gitignored
// render/out/orbit/<id>/. Optionally encode a clip if ffmpeg is on PATH (--gif / --mp4).
//
// Usage:
//   npm run render:orbit -- --artifact <path> [--frames N] [--out DIR] [--start DEG]
//                           [--elevation DEG] [--fov DEG] [--size N] [--gif|--mp4] [--fps N]
//   npm run render:orbit -- <path>              (positional artifact path also accepted)
//
// Mirrors cli.mjs: gate on GL, render, then process.exit (prismarine-viewer holds worker
// threads open).

import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { GL_AVAILABLE, GL_LOAD_ERROR } from './render.mjs'
import { renderOrbit, oscillateAzimuths, defaultOrbitDir } from './orbit.mjs'
import { maybeEncodeClip } from './orbit-clip.mjs'

// --- tiny argv parser (house norm: ad-hoc, see scripts/image-to-grid.mjs) -------
function parseArgs (argv) {
  const out = { frames: 8, startDeg: 0, fps: 12 }
  const rest = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    switch (a) {
      case '--artifact': out.artifact = next(); break
      case '--frames': out.frames = Number(next()); break
      case '--out': out.outDir = next(); break
      case '--start': out.startDeg = Number(next()); break
      case '--elevation': out.elevation = Number(next()); break
      case '--fov': out.fov = Number(next()); break
      case '--size': out.size = Number(next()); break
      case '--fps': out.fps = Number(next()); break
      case '--oscillate': out.oscillate = true; break
      case '--amplitude': out.amplitudeDeg = Number(next()); break
      case '--center': out.centerDeg = Number(next()); break
      case '--gif': out.format = 'gif'; break
      case '--mp4': out.format = 'mp4'; break
      case '--help': case '-h': out.help = true; break
      default:
        if (a.startsWith('--')) { console.error(`unknown flag: ${a}`); process.exit(2) }
        rest.push(a)
    }
  }
  if (!out.artifact && rest.length) out.artifact = rest[0]
  return out
}

const USAGE = `render:orbit — turntable render of a build artifact

  --artifact <path>   a runs/<id>/artifact.json (or a directory containing one)
  --frames N          frame count (default 8)
  --start DEG         starting azimuth (default 0; --start 45 = canonical head-on as frame 0)
  --elevation DEG     camera elevation (default 35)
  --fov DEG           field of view (default 75)
  --size N            square render size in px (default 512)
  --out DIR           output dir (default render/out/orbit/<trial_id>/)
  --gif | --mp4       also encode a clip if ffmpeg is on PATH
  --fps N             clip frame rate (default 12)
  --oscillate         front-arc ping-pong (rock ±amplitude around center) instead of a full 360°
  --amplitude DEG     oscillation swing (default 40)
  --center DEG        oscillation center azimuth (default 0 = head-on front)`

const args = parseArgs(process.argv.slice(2))

if (args.help) {
  console.log(USAGE)
  process.exit(0)
}
if (!args.artifact) {
  console.error('error: --artifact <path> is required\n')
  console.error(USAGE)
  process.exit(2)
}
if (!Number.isInteger(args.frames) || args.frames <= 0) {
  console.error(`error: --frames must be a positive integer, got ${args.frames}`)
  process.exit(2)
}

if (!GL_AVAILABLE) {
  console.error('headless GL is unavailable in this environment, cannot render:')
  console.error('  ' + (GL_LOAD_ERROR && GL_LOAD_ERROR.message))
  console.error('See README.md for the Playwright/Chromium fallback.')
  process.exit(1)
}

// Accept either an artifact.json path or a directory containing one.
let artifactPath = args.artifact
try {
  if (statSync(artifactPath).isDirectory()) artifactPath = join(artifactPath, 'artifact.json')
} catch {
  console.error(`error: cannot read ${artifactPath}`)
  process.exit(1)
}

let artifact
try {
  artifact = JSON.parse(readFileSync(artifactPath, 'utf8'))
} catch (err) {
  console.error(`error: ${artifactPath} is not valid JSON: ${err.message}`)
  process.exit(1)
}

const view = {}
if (Number.isFinite(args.elevation)) view.elevationDeg = args.elevation
if (Number.isFinite(args.fov)) view.fov = args.fov
if (Number.isFinite(args.size)) { view.width = args.size; view.height = args.size }

const idForDir = (artifact?.metadata?.trial_id || 'orbit') + (args.oscillate ? '-rock' : '')
const outDir = args.outDir ?? defaultOrbitDir(idForDir)
const azimuths = args.oscillate
  ? oscillateAzimuths(args.frames, { centerDeg: args.centerDeg, amplitudeDeg: args.amplitudeDeg })
  : undefined

console.log(`rendering ${args.frames} ${args.oscillate ? 'front-arc oscillation' : 'orbit'} frames of ${artifactPath}`)
console.log(`  → ${outDir}`)

const report = await renderOrbit(artifact, {
  frames: args.frames,
  startDeg: args.startDeg,
  azimuths,
  outDir,
  view,
  onFrame: (f) => console.log(`  frame ${f.index + 1}/${args.frames} @ ${f.azimuthDeg}° → ${f.path} (${f.bytes} bytes, ${f.placed} placed)`)
})

console.log(`wrote ${report.frames.length} frames to ${report.dir}`)
console.log(`  azimuths: ${report.azimuths.join(', ')}`)

if (args.format) {
  const clip = await maybeEncodeClip(report.dir, { format: args.format, fps: args.fps })
  if (clip.encoded) console.log(`encoded clip: ${clip.path}`)
  else console.log(`clip skipped: ${clip.reason}`)
}

// prismarine-viewer holds worker threads open; exit explicitly once frames are written.
process.exit(0)

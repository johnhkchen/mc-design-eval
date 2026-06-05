// Chain orbit clips into one montage — the "explosion of rotating builds" beat.
//
// Each orbit.mp4 from orbit-cli is a SEAMLESS 360° loop (frame N wraps to frame 0) at a
// fixed size/fps/codec (h264, yuv420p, even dims), so they concatenate cleanly. This stitches
// a list of them end-to-end via ffmpeg's concat demuxer (`-c copy` — no re-encode, since the
// clips share params). The result is itself chainable into the showcase cut.
//
//   node render/src/orbit-chain.mjs <out.mp4> <clipA.mp4> <clipB.mp4> ...
//
// Requires ffmpeg on PATH (the clips were encoded with it). No npm dependency.

import { writeFileSync, mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const [outPath, ...clips] = process.argv.slice(2)
if (!outPath || clips.length === 0) {
  console.error('usage: node render/src/orbit-chain.mjs <out.mp4> <clip.mp4> [clip.mp4 ...]')
  process.exit(2)
}
for (const c of clips) {
  if (!existsSync(c)) { console.error(`error: clip not found: ${c}`); process.exit(1) }
}

// ffmpeg concat demuxer needs a list file of absolute paths.
const dir = mkdtempSync(join(tmpdir(), 'orbit-chain-'))
const listFile = join(dir, 'list.txt')
writeFileSync(listFile, clips.map((c) => `file '${resolve(c)}'`).join('\n') + '\n')

const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outPath]
const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
let stderr = ''
child.stderr.on('data', (d) => { stderr += d })
child.on('error', (e) => { console.error(`ffmpeg failed to spawn: ${e.message}`); process.exit(1) })
child.on('close', (code) => {
  if (code === 0) { console.log(`chained ${clips.length} clips → ${outPath}`); process.exit(0) }
  // `-c copy` can fail if params differ; surface the tail so the caller can fall back to re-encode.
  console.error(`ffmpeg concat exited ${code}:\n${stderr.split('\n').slice(-4).join('\n')}`)
  process.exit(1)
})

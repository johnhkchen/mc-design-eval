// Optional turntable clip encoding (T-032-01) — best-effort, never load-bearing.
//
// The ticket asks for "optionally an encoded clip IF ffmpeg/gif tooling is available."
// So: probe for ffmpeg on PATH, encode the frame sequence if present, and degrade cleanly
// to "frames only" if absent. No new npm dependency, no throw on a missing encoder. Kept in
// its own module so orbit.mjs stays subprocess-free and the unit tests never spawn anything.

import { spawn } from 'node:child_process'
import { join } from 'node:path'

/** Run a command, resolving { code, stderr }; rejects only if the binary can't be spawned. */
function run (cmd, args) {
  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    } catch (err) {
      reject(err)
      return
    }
    let stderr = ''
    child.stderr.on('data', (d) => { stderr += d })
    child.on('error', reject) // ENOENT etc. — binary not found
    child.on('close', (code) => resolve({ code, stderr }))
  })
}

/**
 * Is ffmpeg on PATH? Best-effort — any spawn failure means "no".
 * @returns {Promise<boolean>}
 */
export async function ffmpegAvailable () {
  try {
    const { code } = await run('ffmpeg', ['-version'])
    return code === 0
  } catch {
    return false
  }
}

/**
 * Encode a rendered orbit frame sequence into a clip, IF ffmpeg is available.
 *
 * @param {string} dir the directory holding the frames
 * @param {{ pattern?: string, outPath?: string, fps?: number, format?: 'mp4'|'gif' }} [opts]
 *   `pattern` — ffmpeg input glob (default 'frame.%03d.png').
 *   `outPath` — where to write (default `<dir>/orbit.<format>`).
 *   `fps`     — playback rate (default 12).
 *   `format`  — 'mp4' (default) or 'gif'.
 * @returns {Promise<{ encoded: boolean, path?: string, reason?: string }>}
 *   Never throws for a missing encoder; `encoded:false` + `reason` instead.
 */
export async function maybeEncodeClip (dir, opts = {}) {
  const { pattern = 'frame.%03d.png', fps = 12, format = 'mp4' } = opts
  const outPath = opts.outPath ?? join(dir, `orbit.${format}`)

  if (!(await ffmpegAvailable())) {
    return { encoded: false, reason: 'ffmpeg not on PATH — frames written, clip skipped' }
  }

  const input = join(dir, pattern)
  const args = format === 'gif'
    ? ['-y', '-framerate', String(fps), '-i', input,
        '-vf', `fps=${fps},scale=trunc(iw/2)*2:-1:flags=lanczos`, outPath]
    : ['-y', '-framerate', String(fps), '-i', input,
        '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', outPath]

  try {
    const { code, stderr } = await run('ffmpeg', args)
    if (code === 0) return { encoded: true, path: outPath }
    return { encoded: false, reason: `ffmpeg exited ${code}: ${stderr.split('\n').slice(-3).join(' ').trim()}` }
  } catch (err) {
    return { encoded: false, reason: `ffmpeg failed: ${err.message}` }
  }
}

// The comparable-framing primitive (Design decision B + E; AC #2).
//
// Pure math — no THREE, no GL, no prismarine-viewer, no files. The ONE place the
// "fixed angle, derived distance" camera lives, isolated here so the comparability
// invariant is unit-testable WITHOUT a GPU (three@0.128.0 is WebGL1-only and GL may be
// absent on CI). render.mjs feeds these numbers to viewer.camera; this file decides them.
//
// Comparability is the whole point: every build is photographed from the SAME viewing
// direction at a distance scaled to its bounding sphere, so a 3³ build and a 30³ build
// fill the SAME fraction of the frame. A constant camera offset (the scaffold's
// fallback) cannot do that — the big build overflows, the small one is a speck.

import { Vec3 } from 'vec3'

/**
 * The fixed, configurable view contract. Defaults reproduce the scaffold's proven 3/4
 * vantage (offset (7,8,7) ≈ azimuth 45°, elevation 39°) as clean fixed values, so the
 * canonical render is continuous with the sample the scaffold already validated.
 */
export const DEFAULT_VIEW = {
  width: 512,
  height: 512,
  fov: 75, // vertical field of view, degrees (matches prismarine-viewer's PerspectiveCamera)
  azimuthDeg: 45, // around +Y, measured from +Z toward +X
  elevationDeg: 35, // above the horizon
  margin: 1.18 // ~18% padding around the bounding sphere
}

const deg2rad = (d) => (d * Math.PI) / 180

/** Merge a partial view over the defaults and validate the numeric contract. */
function mergeView (view = {}) {
  const v = { ...DEFAULT_VIEW, ...view }
  if (!(v.fov > 0 && v.fov < 180)) throw new Error(`view.fov must be in (0,180), got ${v.fov}`)
  if (!(v.margin >= 1)) throw new Error(`view.margin must be >= 1, got ${v.margin}`)
  for (const k of ['width', 'height', 'azimuthDeg', 'elevationDeg']) {
    if (!Number.isFinite(v[k])) throw new Error(`view.${k} must be finite, got ${v[k]}`)
  }
  if (!(v.width > 0 && v.height > 0)) throw new Error('view.width/height must be > 0')
  return v
}

/**
 * World-space box for an integer voxel bounds. A voxel at integer coordinate `p`
 * occupies the unit cube `[p, p+1]`, so the build's true extent is `max + 1` on the
 * high side — getting this right is what keeps the framing block-size-accurate.
 * @param {{min:number[], max:number[]}} bounds
 * @returns {{lo:number[], hi:number[]}}
 */
export function boxOf (bounds) {
  if (!bounds || !bounds.min || !bounds.max) {
    throw new Error('boxOf: bounds {min,max} required (empty build has no box)')
  }
  return {
    lo: [bounds.min[0], bounds.min[1], bounds.min[2]],
    hi: [bounds.max[0] + 1, bounds.max[1] + 1, bounds.max[2] + 1]
  }
}

/**
 * Bounding SPHERE of the build (center + radius). Using the sphere — half the space
 * diagonal of the world-space box — rather than per-axis extents makes the fit
 * rotation-independent: the same build frames identically from any azimuth.
 * @param {{min:number[], max:number[]}} bounds
 * @returns {{center: Vec3, radius: number}}
 */
export function boundingSphere (bounds) {
  const { lo, hi } = boxOf(bounds)
  const center = new Vec3((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2)
  const dx = hi[0] - lo[0]
  const dy = hi[1] - lo[1]
  const dz = hi[2] - lo[2]
  const radius = 0.5 * Math.sqrt(dx * dx + dy * dy + dz * dz)
  return { center, radius }
}

/**
 * THE primitive: everything a renderer needs to place a comparable camera for a build.
 *
 * Fixed direction (azimuth/elevation), distance derived so the bounding sphere fits the
 * perspective frustum on BOTH axes:
 *   d = R / sin( min(vHalf, hHalf) ) · margin,  tan(hHalf) = aspect · tan(vHalf)
 * `min(...)` picks the narrower half-angle (the binding constraint → larger distance),
 * so a wide-or-tall frame still contains the whole sphere.
 *
 * @param {{min:number[], max:number[]}} bounds the build's integer voxel bounds
 * @param {Partial<typeof DEFAULT_VIEW>} [view]
 * @returns {{eye: Vec3, target: Vec3, up: Vec3, fov: number, distance: number, radius: number}}
 */
export function framedCamera (bounds, view = {}) {
  const v = mergeView(view)
  const { center, radius } = boundingSphere(bounds)

  const aspect = v.width / v.height
  const vHalf = deg2rad(v.fov) / 2
  const hHalf = Math.atan(aspect * Math.tan(vHalf))
  const fitHalf = Math.min(vHalf, hHalf)
  const distance = (radius / Math.sin(fitHalf)) * v.margin

  // Unit direction from target toward the eye. θ azimuth around +Y from +Z to +X,
  // φ elevation above the horizon.
  const theta = deg2rad(v.azimuthDeg)
  const phi = deg2rad(v.elevationDeg)
  const dir = new Vec3(
    Math.cos(phi) * Math.sin(theta),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(theta)
  )

  const eye = center.plus(dir.scaled(distance))
  return { eye, target: center, up: new Vec3(0, 1, 0), fov: v.fov, distance, radius }
}

/**
 * Chunk-streaming radius (in 16-block chunks) that always covers the framed build, so
 * far voxels are meshed before the snapshot. Without this, a large build's far side is
 * never streamed in and renders blank.
 * @param {number} distance camera distance from the build center
 * @param {number} radius the build's bounding-sphere radius
 * @param {number} [min] floor (the scaffold's default view distance)
 * @returns {number}
 */
export function viewDistanceFor (distance, radius, min = 4) {
  return Math.max(min, Math.ceil((distance + radius) / 16) + 1)
}

#!/usr/bin/env node
// Render a structure .nbt to PNGs, headless (no game, no server).
//
//   node render.mjs <in.nbt> <outDir> [--views exterior,cutaway,eye] [--cut <y>]
//                   [--eye x,y,z --look x,y,z] [--prefix before]
//
// Views:
//   exterior  two framed 3/4 views (azimuth 45 and 225)
//   cutaway   the build with every layer y >= cut removed (default cut = top layer), seen from above:
//             shows interiors (rooms, hallways) the exterior hides
//   eye       a player's-eye perspective. Default: standing at one end of the longest horizontal axis,
//             eyes 1.6 above the lowest walkable floor, looking down the length. Override with --eye/--look
//             (structure-local coordinates). Keep --look INSIDE the build (e.g. mid-room): chunks are
//             streamed around the look point, so a look point at the far edge can drop the near chunk.
//             Interiors must be judged from HERE, not from outside.
// Note: the renderer is full-bright (no light engine), so light sources show as blocks but not as glow.
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadStructure } from "./nbt.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RENDER = join(HERE, "..", "..", "..", "render", "src");
const { buildWorldFromVoxels } = await import(join(RENDER, "world.mjs"));
const { renderWorldToPng } = await import(join(RENDER, "render.mjs"));

function parseArgs(argv) {
  const [inPath, outDir, ...rest] = argv;
  if (!inPath || !outDir) {
    console.error("usage: render.mjs <in.nbt> <outDir> [--views exterior,cutaway,eye] [--cut y] [--eye x,y,z --look x,y,z] [--prefix p]");
    process.exit(2);
  }
  const o = { inPath, outDir, views: ["exterior", "cutaway", "eye"], prefix: "" };
  for (let i = 0; i < rest.length; i++) {
    const k = rest[i], v = rest[i + 1];
    if (k === "--views") (o.views = v.split(",")), i++;
    else if (k === "--cut") (o.cut = Number(v)), i++;
    else if (k === "--eye") (o.eye = v.split(",").map(Number)), i++;
    else if (k === "--look") (o.look = v.split(",").map(Number)), i++;
    else if (k === "--prefix") (o.prefix = v + "-"), i++;
  }
  return o;
}

function boundsOf(voxels) {
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const v of voxels) for (let i = 0; i < 3; i++) (min[i] = Math.min(min[i], v.pos[i])), (max[i] = Math.max(max[i], v.pos[i]));
  return { min, max };
}

/** Default eye: one end of the long axis, centred on the short axis, 1.6 above the lowest walkable floor. */
function defaultEye(grid) {
  const [sx, sy, sz] = grid.size;
  const longZ = sz >= sx;
  const cx = (sx - 1) / 2, cz = (sz - 1) / 2;
  // lowest air cell above a solid cell along the centre line = floor level
  let floorY = 1;
  const [px, pz] = longZ ? [Math.round(cx), 1] : [1, Math.round(cz)];
  for (let y = 1; y < sy; y++) if (grid.isAir(px, y, pz) && !grid.isAir(px, y - 1, pz)) { floorY = y; break; }
  const eyeY = floorY + 0.62;
  return longZ
    ? { eye: [cx + 0.5, eyeY + 1, 0.3], look: [cx + 0.5, eyeY + 0.9, sz / 2] }
    : { eye: [0.3, eyeY + 1, cz + 0.5], look: [sx / 2, eyeY + 0.9, cz + 0.5] };
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const grid = await loadStructure(resolve(o.inPath));
  const all = grid.voxels();
  const out = [];
  const shoot = async (voxels, name, opts) => {
    const { world, unmapped } = await buildWorldFromVoxels(voxels);
    const path = join(o.outDir, `${o.prefix}${name}.png`);
    await renderWorldToPng(world, opts.center ?? { x: 0, y: 0, z: 0 }, { ...opts, outPath: path });
    out.push(path);
    if (unmapped?.length) console.error(`  ${name}: ${unmapped.length} unmapped (e.g. ${unmapped[0].block}: ${unmapped[0].reason})`);
  };
  if (o.views.includes("exterior")) {
    const bounds = boundsOf(all);
    for (const az of [45, 225]) await shoot(all, `exterior-${az}`, { bounds, view: { azimuthDeg: az, elevationDeg: 30 } });
  }
  if (o.views.includes("cutaway")) {
    const cut = o.cut ?? grid.size[1] - 1;
    const kept = all.filter((v) => v.pos[1] < cut);
    if (kept.length) await shoot(kept, `cutaway-y${cut}`, { bounds: boundsOf(kept), view: { azimuthDeg: 35, elevationDeg: 55 } });
  }
  if (o.views.includes("eye")) {
    const d = o.eye && o.look ? { eye: o.eye, look: o.look } : defaultEye(grid);
    const [ex, ey, ez] = d.eye, [lx, ly, lz] = d.look;
    await shoot(all, "eye", { center: { x: lx, y: ly, z: lz }, cameraOffset: { x: ex - lx, y: ey - ly, z: ez - lz }, fov: 70, viewDistance: 3 });
  }
  console.log(JSON.stringify({ size: grid.size, blocks: all.length, renders: out }, null, 1));
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});

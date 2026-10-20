import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 國家藝術館 (National Art Museum, Taipei): a stone-clad civic museum of the late 1990s.
// A four-storey plinth carries a ten-storey tower with a one-tier setback, a parapet
// at 64 blocks, and a centre mast. Pale quartz, polished granite base and pilasters,
// tinted glass, a framed entrance portal on the street face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw344689942";
const W = 91, D = 52, H = 76;
const STOREY = 5;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const key = (x, z) => x * D + z;
const G = new Array(W * D).fill(-1);
for (const c of cells) {
  const [x, z, gr] = c;
  if (x >= 0 && x < W && z >= 0 && z < D) G[key(x, z)] = Math.max(0, Math.round(gr));
}
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && G[key(x, z)] >= 0;
const ground = (x, z) => G[key(x, z)];

// Inset distance from the footprint edge (0 = edge cell), multi-source BFS.
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const INF = 1e9;
const dist = new Array(W * D).fill(INF);
const queue = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp(x, z)) continue;
  if (NB.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
    dist[key(x, z)] = 0;
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist[key(x, z)];
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && dist[key(nx, nz)] > d + 1) {
      dist[key(nx, nz)] = d + 1;
      queue.push([nx, nz]);
    }
  }
}
const insetOf = (x, z) => dist[key(x, z)];

// Outward direction: neighbour one step closer to the edge.
function outwardOf(x, z) {
  const d = insetOf(x, z);
  for (const [dx, dz] of NB) {
    if (inFp(x + dx, z + dz) && insetOf(x + dx, z + dz) === d - 1) return [dx, dz];
  }
  for (const [dx, dz] of NB) if (!inFp(x + dx, z + dz)) return [dx, dz];
  return [0, 0];
}

const g = new Voxels([W, H, D]);

// Set a block only above the ground of its column and inside the volume.
function put(x, y, z, id, props) {
  if (!inFp(x, z)) return;
  if (y <= ground(x, z) || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const cellsList = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFp(x, z)) cellsList.push([x, z]);

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z] of cellsList) {
  for (let y = 0; y <= ground(x, z); y++) g.set(x, y, z, "stone");
}

// Floor level rules.
// Podium (walls 0..15) covers the full footprint; podium roof slab at 20.
// Tower A (walls 20..40) is inset 10; its roof slab is at 45.
// Tower B (walls 45..55) is inset 18; its roof slab is at 60.
const slabInset = (B) => (B <= 20 ? 0 : B <= 45 ? 10 : 18);
const wallInset = (B) => (B <= 15 ? 0 : B <= 40 ? 10 : 18);

// 2. Floor slabs, one per storey, over each tier.
for (let B = STOREY; B <= 60; B += STOREY) {
  const e = slabInset(B);
  for (const [x, z] of cellsList) {
    if (insetOf(x, z) >= e) put(x, B, z, "smooth_quartz");
  }
}

// 3. Entrance on the z-minimum face, centred on that face.
const faceZmin = cellsList.filter(([x, z]) => {
  const [ox, oz] = outwardOf(x, z);
  return insetOf(x, z) === 0 && ox === 0 && oz === -1;
});
const xs = faceZmin.map(([x]) => x).sort((a, b) => a - b);
const ex = xs.length ? xs[Math.floor(xs.length / 2)] : -999;
const isEntrance = (x, z) => insetOf(x, z) === 0 && Math.abs(x - ex) <= 2 && outwardOf(x, z)[1] === -1 && outwardOf(x, z)[0] === 0;
const isJamb = (x, z) => insetOf(x, z) === 0 && Math.abs(x - ex) === 3 && outwardOf(x, z)[1] === -1 && outwardOf(x, z)[0] === 0;

// 4. Walls: window grid, pilaster bays, mullions, spandrels, base course, shopfront.
const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (let B = 0; B <= 55; B += STOREY) {
  const e = wallInset(B);
  for (const [x, z] of cellsList) {
    if (insetOf(x, z) !== e) continue;
    const [ox, oz] = outwardOf(x, z);
    if (ox === 0 && oz === 0) continue;
    const alongX = oz !== 0;            // face runs along x
    const u = alongX ? x : z;
    const entrance = e === 0 && isEntrance(x, z);
    const pilaster = !entrance && (u % 8 === 0);
    for (let r = 1; r <= 4; r++) {
      const y = B + r;
      if (y > 60) continue;
      let id, props;
      if (r === 4) {
        id = "smooth_quartz";                       // spandrel / storey line
      } else if (entrance) {
        id = "glass";                               // entrance glazing
      } else if (pilaster) {
        id = "polished_granite";                    // stone pilaster bay
      } else if (B === 0 && r === 1) {
        id = "polished_granite";                    // base course
      } else if (u % 4 === 0) {
        id = "polished_andesite";                   // mullion
      } else if (B === 0) {
        id = "glass";                               // shopfront glass
      } else {
        id = "light_blue_stained_glass_pane";       // window
        props = paneProps(alongX);
      }
      put(x, y, z, id, props);
    }

    // Warm lights behind some upper-floor windows (air-gap cell inside the glass).
    if (B > 0 && B !== 20 && ((B / STOREY) % 2 === 0) && !pilaster && u % 8 === 2) {
      const ix = x - ox, iz = z - oz;
      if (inFp(ix, iz)) put(ix, B + 2, iz, "shroomlight");
    }
  }
}

// 5. Projecting fins in front of each setback tier's pilaster bays, so the tiers
//    show relief. Each fin is a continuous column standing on the slab below.
for (let B = 20; B <= 55; B += STOREY) {
  const e = wallInset(B);
  if (e === 0) continue;
  for (const [x, z] of cellsList) {
    if (insetOf(x, z) !== e) continue;
    const [ox, oz] = outwardOf(x, z);
    if (ox === 0 && oz === 0) continue;
    const u = oz !== 0 ? x : z;
    if (u % 8 !== 0) continue;
    const fx = x + ox, fz = z + oz;               // one cell toward the edge
    if (!inFp(fx, fz) || insetOf(fx, fz) !== e - 1) continue;
    for (let r = 0; r <= 4; r++) put(fx, B + r, fz, "polished_granite");
  }
}

// 6. Entrance portal: stone jambs framing the glass, lintel at storey line, lanterns in the hall.
for (const [x, z] of cellsList) {
  if (!isJamb(x, z)) continue;
  for (let y = 1; y <= 5; y++) put(x, y, z, "polished_granite");
}
for (const [x, z] of cellsList) {
  if (!isEntrance(x, z)) continue;
  const [ox, oz] = outwardOf(x, z);
  const ix = x - ox, iz = z - oz;                 // one cell back, inside the hall
  if (inFp(ix, iz) && insetOf(ix, iz) === 1 && (x === ex || Math.abs(x - ex) === 2)) {
    put(ix, 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 7. Podium parapet and cornice around the plinth roof (y 21..22).
for (const [x, z] of cellsList) {
  if (insetOf(x, z) !== 0) continue;
  put(x, 21, z, "polished_granite");
  put(x, 22, z, "smooth_quartz");
}

// 8. Tower A terrace parapet on the setback edge (y 46).
for (const [x, z] of cellsList) {
  if (insetOf(x, z) === 10) put(x, 46, z, "polished_granite");
}

// 9. Tower B roof parapet at 61..64 with a cornice band.
for (const [x, z] of cellsList) {
  if (insetOf(x, z) !== 18) continue;
  put(x, 61, z, "smooth_quartz");
  put(x, 62, z, "smooth_quartz");
  put(x, 63, z, "polished_granite");
  put(x, 64, z, "smooth_quartz");
}

// 10. Roof plant pavilion on the tower B roof, near the centre.
const towerB = cellsList.filter(([x, z]) => insetOf(x, z) >= 18);
if (towerB.length) {
  const cx = towerB.reduce((s, [x]) => s + x, 0) / towerB.length;
  const cz = towerB.reduce((s, [, z]) => s + z, 0) / towerB.length;
  for (const [x, z] of towerB) {
    if (insetOf(x, z) >= 22 && Math.abs(x - cx) <= 6 && Math.abs(z - cz) <= 4) {
      put(x, 61, z, "light_gray_concrete");
      put(x, 62, z, "light_gray_concrete");
    }
  }
  // Centre mast on the most central tier-B cell.
  let best = towerB[0], bestD = -1;
  for (const [x, z] of towerB) {
    const d = insetOf(x, z);
    if (d > bestD) { bestD = d; best = [x, z]; }
  }
  const [mx, mz] = best;
  for (let y = 61; y <= 67; y++) put(mx, y, mz, "iron_bars");
  put(mx, 68, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

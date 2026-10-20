import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE96-0555-14F";
const W = 53, H = 81, D = 22;
const STOREYS = 14;
const ROOF = 70;          // roof deck level
const SETBACK_K = 10;     // storeys from this index are set back
const RING = 2;           // outer rings (distance <= RING) are cut back above SETBACK_K

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inFp = (x, z) => G.has(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Distance (in cells) from the footprint edge, via BFS from the boundary
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (!inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1)) {
    dist.set(`${x},${z}`, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(`${x},${z}`);
  for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
    const k = `${nx},${nz}`;
    if (inFp(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dOf = (x, z) => dist.get(`${x},${z}`) ?? 99;

// Whether a cell is part of the building envelope at storey k
const solidAt = (x, z, k) => inFp(x, z) && (k < SETBACK_K || dOf(x, z) > RING);

const faceOf = (x, z, k) => ({
  xn: !solidAt(x - 1, z, k),
  xp: !solidAt(x + 1, z, k),
  zn: !solidAt(x, z - 1, k),
  zp: !solidAt(x, z + 1, k),
});

const g = new Voxels([W, H, D]);
const put = (x, y, z, id) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  g.set(x, y, z, id);
};

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Storeys
for (let k = 0; k < STOREYS; k++) {
  const base = 5 * k;

  for (const [x, z, gr] of cells) {
    const d = dOf(x, z);

    // Terrace on the cut-back ring at the first setback level
    if (k === SETBACK_K && d <= RING && base >= gr) {
      put(x, base, z, "light_gray_concrete");
      if (d === 1) put(x, base + 1, z, "white_concrete");
    }

    if (!solidAt(x, z, k)) continue;

    // Floor slab across the envelope
    if (base >= gr) put(x, base, z, "light_gray_concrete");

    const f = faceOf(x, z, k);
    const edge = f.xn || f.xp || f.zn || f.zp;
    if (!edge) continue;

    const corner = (f.xn || f.xp) && (f.zn || f.zp);
    const idx = (f.zn || f.zp) ? x : z;      // index along the face
    const mullion = !corner && idx % 3 === 0;
    const onFront = k === 0 && f.zn && !corner;
    const inEntrance = onFront && Math.abs(x - cx) <= 2;
    const onSurround = onFront && Math.abs(x - cx) === 3;

    for (let r = 0; r <= 4; r++) {
      const y = base + r;
      if (y < gr || y >= ROOF) continue;

      if (inEntrance) {
        if (r === 0) put(x, y, z, "polished_granite");   // threshold
        else if (r === 4) put(x, y, z, "polished_granite"); // lintel
        continue;                                          // r 1..3 open
      }
      if (onSurround && r >= 1 && r <= 3) {
        put(x, y, z, "polished_granite");
        continue;
      }

      let id;
      if (r === 0) {
        id = "white_concrete";                                  // floor edge band
      } else if (r === 4) {
        id = corner ? "white_concrete" : "light_gray_concrete"; // spandrel
      } else if (k === 0 && r === 1) {
        id = "polished_granite";                                // base course
      } else if (corner || mullion) {
        id = "white_concrete";                                  // pilaster / mullion
      } else {
        const bay = Math.floor(idx / 3);
        id = (bay % 5 === 2) ? "cyan_stained_glass" : "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }

    // Warm light just behind some windows
    const r2 = base + 2;
    if (r2 >= gr && r2 < ROOF && !corner && !mullion && !inEntrance && !onSurround) {
      const bay = Math.floor(idx / 3);
      if ((k + bay) % 2 === 0) {
        let dx = 0, dz = 0;
        if (f.zn) dz = 1; else if (f.zp) dz = -1;
        else if (f.xn) dx = 1; else if (f.xp) dx = -1;
        if (inFp(x + dx, z + dz)) put(x + dx, r2, z + dz, "glowstone");
      }
    }
  }
}

// Lamps inside the lobby behind the recessed entrance
for (const dx of [-1, 1]) {
  if (inFp(cx + dx, minZ + 1)) put(cx + dx, 2, minZ + 1, "glowstone");
}

// 3. Roof deck and parapet on the upper envelope only
for (const [x, z] of cells) {
  const d = dOf(x, z);
  if (d < RING + 1) continue;
  put(x, ROOF, z, d === RING + 1 ? "white_concrete" : "light_gray_concrete");
  if (d === RING + 1) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "smooth_quartz");
  }
}

// 4. Rooftop plant room, centred on the footprint
const px0 = cx - 6, px1 = cx + 6, pz0 = cz - 3, pz1 = cz + 3;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!inFp(x, z)) continue;
    const ring = x === px0 || x === px1 || z === pz0 || z === pz1;
    if (ring) {
      put(x, 71, z, "polished_andesite");
      put(x, 72, z, "iron_bars");
      put(x, 73, z, "iron_bars");
      put(x, 74, z, "polished_andesite");
      put(x, 75, z, "polished_andesite");
    }
    put(x, 76, z, "smooth_stone");
  }
}

// 5. Entrance lamp inside the lobby
if (inFp(cx, minZ + 3)) put(cx, 2, minZ + 3, "glowstone");

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588114357";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 36, D = 105;
const g = new Voxels([W, H, D]);

// Five storeys, 1990s Xinyi office block: granite plinth, pale tile-clad
// concrete frame, smooth quartz pilasters, tinted glass, parapet roof.
const starts = [0, 5, 9, 14, 18];   // storey floor lines (relative to ground)
const ends   = [5, 9, 14, 18, 23];  // next floor line / top of storey
const TOP = 23;                     // cornice + roof deck level
const PARA = 24;                    // parapet level
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isPerim = (x, z) => NB.some(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Pass 1: foundations, floor slabs, deck, walls, parapet, lanterns
for (const [x, z, b] of cells) {
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  const miss = NB.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (miss.length === 0) {
    // interior: floor slabs per storey and the roof deck, air otherwise
    for (const s of starts) put(x, b + s, z, "light_gray_concrete");
    put(x, b + TOP, z, "light_gray_concrete");
    continue;
  }

  const mx = miss.find(([dx]) => dx !== 0);
  const mz = miss.find(([, dz]) => dz !== 0);
  const corner = !!(mx && mz);
  const face = mx ?? mz;          // outward normal used for facade detail
  const xFace = !!mx;             // facade plane runs along z
  const along = xFace ? z : x;
  const pil = corner || along % 4 === 0;

  for (let r = 0; r <= PARA; r++) {
    let id, props;
    if (r === 0) id = "granite";
    else if (r === TOP) id = "smooth_quartz";
    else if (r === PARA) id = "white_concrete";
    else if (pil) id = "smooth_quartz";
    else if (starts.includes(r) || ends.includes(r + 1)) id = "light_gray_concrete";
    else {
      id = "light_blue_stained_glass_pane";
      props = xFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    }
    put(x, b + r, z, id, props);
  }

  // warm lights behind some windows, one per three bays on alternate storeys
  if (!pil && !corner) {
    for (let i = 0; i < starts.length; i++) {
      if (i % 2 !== 0) continue;
      const r = starts[i] + 1;
      if (along % 3 !== 1) continue;
      const ix = x - face[0], iz = z - face[1];
      if (has(ix, iz) && !isPerim(ix, iz)) {
        put(ix, b + r, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// Pass 2: structural columns through the interior (carry the floor slabs)
for (const [x, z, b] of cells) {
  if (isPerim(x, z)) continue;
  if ((x - minX) % 7 === 3 && (z - minZ) % 8 === 4) {
    for (let r = 0; r < TOP; r++) put(x, b + r, z, "smooth_quartz");
  }
}

// Pass 3: entrance on the minimum-z end, middle bay
{
  const cands = cells.filter(([x, z]) => !has(x, z - 1));
  if (cands.length > 0) {
    cands.sort((a, b) => a[0] - b[0]);
    const [dx, dz, db] = cands[Math.floor(cands.length / 2)];
    const props = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
    put(dx, db + 1, dz, "dark_oak_door", props("lower"));
    put(dx, db + 2, dz, "dark_oak_door", props("upper"));
  }
}

// Pass 4: rooftop plant room on the central deck, with a lightning rod
{
  const zc = Math.round((minZ + maxZ) / 2);
  const x0 = minX + 4, x1 = maxX - 4, z0 = zc - 6, z1 = zc + 6;
  for (const [x, z, b] of cells) {
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    if (isPerim(x, z)) continue;
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    put(x, b + 24, z, ring ? "white_concrete" : "light_gray_concrete");
    put(x, b + 25, z, ring ? "white_concrete" : "light_gray_concrete");
    put(x, b + 26, z, "smooth_stone");
    if (x === Math.round((x0 + x1) / 2) && z === zc) {
      put(x, b + 27, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

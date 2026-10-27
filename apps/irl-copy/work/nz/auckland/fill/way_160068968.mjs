// The Docks: a late-20th-century waterfront office block on a podium. Read from the lidar record: a tower core
// at roof 32 (about 27 m, eight storeys of 4 blocks), a 3-4 storey podium and lower wings, the roof edge set back
// two cells at the tower. Solid massing, a 1-deep air gap behind every window, a floor slab (spandrel) per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 69, D = 66, H = 46;
const cells = JSON.parse(readFileSync(`${DIR}/way_160068968.cells.json`, "utf8"));

const K = (x, z) => `${x},${z}`;
const XZ = (key) => key.split(",").map(Number);
const fp = new Map();                                     // "x,z" -> { g: ground, r: lidar roof }
for (const [x, z, g, r] of cells) fp.set(K(x, z), { g, r });
const inFp = (x, z) => fp.has(K(x, z));
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// 1. Roof: the 3x3 median of the lidar roof (zeros left out), rounded to whole storeys of 4 blocks.
const NB = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const top = new Map();
for (const [key, c] of fp) {
  const [x, z] = XZ(key);
  const vals = NB.map(([dx, dz]) => fp.get(K(x + dx, z + dz))?.r ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
  const med = vals.length ? vals[vals.length >> 1] : c.r;
  top.set(key, Math.max(4, Math.round(med / 4) * 4));
}

// 2. Distance in cells from the outside edge: the tower's top storey steps in by two cells at its rim.
const dist = new Map();
let frontier = [];
for (const key of fp.keys()) {
  const [x, z] = XZ(key);
  if (Object.values(DIRS).some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist.set(key, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of Object.values(DIRS)) {
    const k = K(x + dx, z + dz);
    if (fp.has(k) && !dist.has(k)) { dist.set(k, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}
for (const [key, t] of top) if (t === 32 && dist.get(key) <= 2) top.set(key, 28);

// Which outward faces of the cell at (x, z) are open at height y.
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d];
  const k = K(x + dx, z + dz);
  return !fp.has(k) || top.get(k) <= y;
});

// The entrance: a pair of cells on the south (+z) face, the southmost run nearest the middle of the footprint.
function pickEntrance() {
  let best = null;
  for (const [key, c] of fp) {
    const [x, z] = XZ(key);
    if (top.get(key) < 12 || !exposed(x, z, c.g).includes("south")) continue;
    const k2 = K(x + 1, z);
    if (!fp.has(k2) || top.get(k2) < 12 || !exposed(x + 1, z, c.g).includes("south")) continue;
    const score = z * 100 - Math.abs(x - 34);
    if (!best || score > best.score) best = { score, x, z, d: "south" };
  }
  return best;
}
const ent = pickEntrance();

const g = new Voxels([W, H, D]);
const carve = [];                       // air behind the glass, or a warm light there
const lamp = (x, y, z) => ((x * 31 + y * 17 + z * 13) % 17 === 0);

// 3. Solid massing, then the facade: base course, spandrel per storey, window rows with mullions, corners, parapet.
for (const [key, c] of fp) {
  const [x, z] = XZ(key);
  const T = top.get(key);
  for (let y = 0; y < T; y++) {
    let m = y < c.g ? "stone_bricks" : y === T - 1 ? "stone" : "white_concrete";
    let st;
    const ex = y >= c.g ? exposed(x, z, y) : [];
    if (ex.length) {
      if (y === T - 1) m = "light_gray_concrete";                       // parapet
      else if (y === c.g) m = "polished_andesite";                      // base course
      else if (ex.length >= 2) m = "light_gray_concrete";               // corner pilaster
      else if (y % 4 === 0) m = "light_gray_concrete";                  // floor slab line (spandrel)
      else {
        const d = ex[0];
        const [dx, dz] = DIRS[d];
        const u = d === "north" || d === "south" ? x : z;
        const behind = K(x - dx, z - dz);
        if (u % 3 === 0 || !fp.has(behind) || top.get(behind) <= y) {
          m = "gray_concrete";                                          // mullion frame
        } else {
          m = "light_blue_stained_glass_pane";
          st = (d === "north" || d === "south")
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
          carve.push([x - dx, y, z - dz, lamp(x, y, z) && y % 4 === 2 ? (x % 2 ? "glowstone" : "shroomlight") : null]);
        }
      }
    }
    g.set(x, y, z, m, st);
  }
}

// 4. The air gap behind the glass (a warm light in some of them), and the carved recess of the entrance.
for (const [x, y, z, light] of carve) {
  if (light) g.set(x, y, z, light); else g.set(x, y, z, "air");
}
if (ent) {
  const [dx, dz] = DIRS[ent.d];
  const hinge = { [ent.x]: "left", [ent.x + 1]: "right" };
  for (const x of [ent.x, ent.x + 1]) {
    const c = fp.get(K(x, ent.z));
    for (let y = c.g; y <= c.g + 2; y++) g.set(x - dx, y, ent.z - dz, "air");   // the recess, one cell deep
    g.set(x, c.g, ent.z, "dark_oak_door", { facing: ent.d, half: "lower", hinge: hinge[x], open: "false", powered: "false" });
    g.set(x, c.g + 1, ent.z, "dark_oak_door", { facing: ent.d, half: "upper", hinge: hinge[x], open: "false", powered: "false" });
    g.set(x, c.g + 2, ent.z, "lantern", { hanging: "true", waterlogged: "false" });
    g.set(x, c.g + 3, ent.z, "light_gray_concrete");                          // the lintel over the doors
  }
}

// 5. Roof: a plant room on the tower core (louvres at mid height), and planters on the podium roofs.
const core = new Set([...top].filter(([k, t]) => t === 32 && dist.get(k) >= 3).map(([k]) => k));
const cx = [...core].reduce((s, k) => s + XZ(k)[0], 0) / core.size;
const cz = [...core].reduce((s, k) => s + XZ(k)[1], 0) / core.size;
let box = null;
for (let ox = 0; ox + 10 <= W; ox++) for (let oz = 0; oz + 8 <= D; oz++) {
  let ok = true;
  for (let x = ox; x < ox + 10 && ok; x++) for (let z = oz; z < oz + 8 && ok; z++) ok = core.has(K(x, z));
  if (!ok) continue;
  const score = Math.abs(ox + 5 - cx) + Math.abs(oz + 4 - cz);
  if (!box || score < box.score) box = { score, ox, oz };
}
const louvre = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
if (box) {
  for (let x = box.ox; x < box.ox + 10; x++) for (let z = box.oz; z < box.oz + 8; z++) {
    const edge = x === box.ox || x === box.ox + 9 || z === box.oz || z === box.oz + 7;
    for (let y = 32; y < 36; y++) {
      if (y === 35) g.set(x, y, z, "stone");
      else if (edge && (y === 33 || y === 34)) g.set(x, y, z, "iron_bars", louvre);
      else g.set(x, y, z, "light_gray_concrete");
    }
  }
}
for (const [key, t] of top) {
  if (t > 16) continue;
  const [x, z] = XZ(key);
  if ((x * 7 + z * 13) % 9 === 0) g.set(x, t, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
}

const out = `${DIR}/way_160068968.nbt`;
const r = g.save(out);
const tops = [...top.values()];
console.log(`footprint ${fp.size} cells, roof tiers ${[...new Set(tops)].sort((a, b) => a - b).join("/")}, entrance ${ent ? `${ent.x},${ent.z}` : "none"}, plant ${box ? "yes" : "no"}`);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);

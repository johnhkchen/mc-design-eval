import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456416";
const W = 17, H = 23, D = 26;
const ROOF = 11;      // parapet top, about 11 blocks above lowest ground
const DECK = 10;      // second-storey roof deck
const STOREY = 5;     // storey line between floors

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, Math.max(0, Math.round(gr)));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward directions: name, dx, dz, facing word, pane connection props
const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};

// Per-cell exposure
const info = new Map();
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const faces = [];
  for (const [name, d] of Object.entries(DIRS)) {
    if (!G.has((x + d.dx) + "," + (z + d.dz))) faces.push(name);
  }
  info.set(key, { x, z, gr, faces });
}

// Choose the front: the outward face with the most exposed cells
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const v of info.values()) for (const f of v.faces) faceCount[f]++;
const front = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
let doorKey = null;
{
  const cand = [...info.values()].filter(v => v.faces.includes(front));
  if (cand.length) {
    const horiz = front === "N" || front === "S";
    cand.sort((a, b) => horiz ? a.x - b.x : a.z - b.z);
    const m = cand[Math.floor(cand.length / 2)];
    doorKey = m.x + "," + m.z;
  }
}

for (const v of info.values()) {
  const { x, z, gr, faces } = v;
  const key = x + "," + z;
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr > ROOF) continue;

  if (!perimeter) {
    // Interior: floor slabs only, air between
    for (const y of [gr, STOREY, DECK]) {
      if (y >= gr && y <= DECK) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }
    if (y === DECK) { put(x, y, z, "smooth_stone"); continue; }     // cornice
    if (y === STOREY) { put(x, y, z, "smooth_stone"); continue; }   // storey line
    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }  // base course

    if (corner) { put(x, y, z, "smooth_quartz"); continue; }

    const f = faces[0];
    const d = DIRS[f];
    const windowBand = (y >= gr + 1 && y <= 3) || (y >= 6 && y <= 8);
    const windowable = windowBand && (x + z) % 3 !== 0 && key !== doorKey;
    if (windowable) {
      const pane = (f === "N" || f === "S")
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", pane);
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// Warm shroomlights just inside some upper-storey windows
for (const v of info.values()) {
  const { x, z, gr, faces } = v;
  if (faces.length !== 1 || gr > 6) continue;
  if ((x + z) % 3 === 0 || (x + z) % 2 !== 0) continue;
  const d = DIRS[faces[0]];
  const ix = x - d.dx, iz = z - d.dz;
  if (G.has(ix + "," + iz)) put(ix, 7, iz, "shroomlight");
}

// Shopfront-level entrance door on the front face
if (doorKey) {
  const v = info.get(doorKey);
  const d = DIRS[front];
  const gr = v.gr;
  if (gr + 1 <= 4) {
    const facing = d.facing;
    put(v.x, gr, v.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(v.x, gr + 1, v.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Rooftop plant: a 3x3 penthouse on the deck, only if the footprint allows it
{
  const cs = [...info.values()];
  const cx = cs.reduce((s, v) => s + v.x, 0) / cs.length;
  const cz = cs.reduce((s, v) => s + v.z, 0) / cs.length;
  let best = null;
  for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
    const bx = Math.round(cx) + ox * 2, bz = Math.round(cz) + oz * 2;
    let ok = true;
    for (let i = -1; i <= 1 && ok; i++) for (let j = -1; j <= 1 && ok; j++) {
      const k = (bx + i) + "," + (bz + j);
      const v = G.has(k) ? info.get(k) : null;
      if (!v || v.faces.length || v.gr > DECK) ok = false;
    }
    if (ok && !best) best = { bx, bz };
  }
  if (best) {
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      for (let y = DECK + 1; y <= DECK + 3; y++) {
        put(best.bx + i, y, best.bz + j, "light_gray_concrete");
      }
      put(best.bx + i, DECK + 4, best.bz + j, "smooth_stone_slab", { type: "bottom" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

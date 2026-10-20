import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001340";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1816 Federal-era brick walk-up: stone foundation, brick walls, stone string
// courses, smooth stone cornice and roof deck, glass windows with air pockets,
// a few warm lamps, and a stone-surrounded entrance under a canopy.
const W = 10, H = 24, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { g: Math.round(gr), r: Math.round(roof) });
}
const inFp = (x, z) => map.has(key(x, z));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const normalsOf = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const facingOf = (dx, dz) =>
  dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";

let gMax = 0;
for (const c of map.values()) gMax = Math.max(gMax, c.g);
const floorLines = [0, 1, 2, 3].map((k) => gMax + 3 * k);

// ---- Pass 1: solid massing, foundation, cornice, parapet, string courses ----
const roofOf = new Map();
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.g;
  const R = Math.min(Math.max(c.r, gr + 7), H - 3);
  roofOf.set(k, R);
  const perim = normalsOf(x, z).length > 0;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");        // foundation
  for (let y = gr; y < R - 1; y++) g.set(x, y, z, "bricks");          // brick walls
  g.set(x, R - 1, z, perim ? "smooth_stone" : "smooth_stone");        // cornice / roof deck
  if (perim) {
    g.set(x, R, z, "bricks");                                          // parapet
    for (const f of floorLines) {
      if (f > gr && f < R - 2) g.set(x, f, z, "stone_bricks");        // string courses
    }
  }
}

// ---- Pass 2: window pockets, glass and warm lamps ----
const faceCells = [];
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  const R = roofOf.get(k);
  const ns = normalsOf(x, z);
  if (ns.length !== 1) continue;
  const [nx, nz] = ns[0];
  const along = nx !== 0 ? z : x;
  const ix = -nx, iz = -nz;
  const inward = inFp(x + ix, z + iz);
  faceCells.push({ x, z, nx, nz, along, g: c.g, R });

  if (along % 2 !== 0) continue; // windows on even cells, solid piers between

  floorLines.forEach((f, idx) => {
    for (const y of [f + 1, f + 2]) {
      if (y < c.g || y > R - 2) continue;
      g.set(x, y, z, "glass");
      if (inward) {
        const warm = y === f + 1 && idx <= 2 && (along + idx) % 3 === 0;
        g.set(x + ix, y, z + iz, warm ? "glowstone" : "air");
      }
    }
  });
}

// ---- Pass 3: entrance on the street face (low z preferred), mid-run ----
let street = faceCells.filter((f) => f.nz === -1);
if (street.length === 0) street = faceCells.slice();
street.sort((a, b) => a.x - b.x || a.z - b.z);
if (street.length > 0) {
  const d = street[Math.floor(street.length / 2)];
  const facing = facingOf(d.nx, d.nz);
  const gy = d.g;
  const alongOf = (o) => ({ x: d.nx !== 0 ? d.x : d.x + (o * (d.nz !== 0 ? 1 : 0)), z: d.nx !== 0 ? d.z + o : d.z });
  // door surround: stone piers flanking the door on the same face
  for (const o of [-1, 1]) {
    const p = alongOf(o);
    if (inFp(p.x, p.z)) {
      g.set(p.x, gy, p.z, "polished_andesite");
      g.set(p.x, gy + 1, p.z, "polished_andesite");
      g.set(p.x, gy + 2, p.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // door
  g.set(d.x, gy, d.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(d.x, gy + 1, d.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy over the door, supported by the surround
  g.set(d.x, gy + 2, d.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

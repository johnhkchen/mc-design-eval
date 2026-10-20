import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 7 x 21 footprint, roof ~21 blocks above lowest ground.
// Read as a late-1980s four-storey commercial block: cream quartz-clad
// facade with a stone base, a glazed window grid with piers, a shopfront
// at street level, a cornice and parapet, and rooftop water tank and AC units.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280254";

const W = 7, H = 33, D = 21;
const STOREY = 5;          // 3.5 m storey at 1.4 blocks per metre
const ROOF = 20;           // roof deck layer (~21 blocks above lowest ground)
const PARAPET = 21;        // parapet course sits on the roof deck

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint: "x,z" -> ground height (clamped so there is always a wall to build)
const G = new Map();
for (const [x, z, g] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  G.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(g))));
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// Pending blocks, resolved in one pass so glass panes can see their neighbours
const B = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, id, props = null) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  B.set(k3(x, y, z), { id, props });
};
const at = (x, y, z) => B.get(k3(x, y, z));

const walls = [];   // exterior wall cells, used for the lighting pass

for (const [key, g] of G) {
  const [x, z] = key.split(",").map(Number);
  const nW = has(x - 1, z), nE = has(x + 1, z);
  const nN = has(x, z - 1), nS = has(x, z + 1);
  const exterior = !(nW && nE && nN && nS);
  const longFace = !nW || !nE;                 // normal along x: the 21-block sides
  const shortFace = !longFace && !(nN && nS);  // normal along z: the 7-block ends
  const t = longFace ? z : x;                  // position along the face
  const pier = t % 3 === 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // Body from ground up to the roof deck
  for (let y = g; y < ROOF; y++) {
    const k = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (!exterior) {
      // Interior: floor slab per storey, air otherwise (no interiors)
      if (r === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    if (k === 0 && y === g) { put(x, y, z, "stone_bricks"); continue; } // base course
    if (r === 0) { put(x, y, z, "quartz_block"); continue; }            // floor band
    if (r === 4) { put(x, y, z, "quartz_block"); continue; }            // lintel / sill

    if (pier) {
      put(x, y, z, "quartz_block");
    } else {
      put(x, y, z, "glass_pane");
      const ix = longFace ? (!nW ? x + 1 : x - 1) : x;
      const iz = longFace ? z : (!nN ? z + 1 : z - 1);
      walls.push({ x, y, z, ix, iz, t, k, r });
    }
  }

  // Roof deck and parapet
  if (exterior) {
    put(x, ROOF, z, "quartz_block");                 // cornice
    put(x, PARAPET, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, ROOF, z, "smooth_stone");
  }

  // Street entrance on a short face, centre-left bay (x = 2), ground level only
  if (exterior && shortFace && !longFace && x === 2 && g <= 1) {
    const outward = !nN ? "north" : "south";
    if (!nN || !nS) {
      put(x, 1, z, "oak_door", { facing: outward, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 2, z, "oak_door", { facing: outward, half: "upper", hinge: "left", open: "false", powered: "false" });
      // Hood over the door
      for (const xx of [1, 2, 3]) {
        if (has(xx, z)) put(xx, 4, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      }
    }
  }
}

// Warm light behind some windows (glowstone on the inside, in the air gap)
for (const w of walls) {
  if (w.r !== 2 || w.k < 1 || ((w.t + w.k) % 4) !== 1) continue;
  if (!has(w.ix, w.iz)) continue;
  if (gnd(w.ix, w.iz) > w.y) continue;
  if (at(w.ix, w.y, w.iz)) continue;
  put(w.ix, w.y, w.iz, "glowstone");
}

// Rooftop water tank (3 x 3 with cut corners) and two AC units
for (let x = 2; x <= 4; x++) {
  for (let z = 15; z <= 17; z++) {
    if (!has(x, z)) continue;
    const corner = (x === 2 || x === 4) && (z === 15 || z === 17);
    if (corner) continue;
    for (let y = PARAPET; y <= PARAPET + 2; y++) put(x, y, z, "iron_block");
  }
}
if (has(5, 4)) put(5, PARAPET, 4, "light_gray_concrete");
if (has(1, 10)) {
  put(1, PARAPET, 10, "light_gray_concrete");
  put(1, PARAPET + 1, 10, "light_gray_concrete");
}

// Resolve glass pane connections against the final layout
const paneProps = (x, y, z) => {
  const conn = (dx, dz) => {
    const e = at(x + dx, y, z + dz);
    return e && ["glass_pane", "quartz_block", "stone_bricks", "smooth_stone"].includes(e.id) ? "true" : "false";
  };
  return {
    north: conn(0, -1),
    south: conn(0, 1),
    west: conn(-1, 0),
    east: conn(1, 0),
    waterlogged: "false",
  };
};

const g = new Voxels([W, H, D]);
for (const [k, { id, props }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (id === "glass_pane") {
    g.set(x, y, z, id, paneProps(x, y, z));
  } else if (props) {
    g.set(x, y, z, id, props);
  } else {
    g.set(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);

// Auckland, Mt Eden / Eden Terrace side of the CBD: a two-storey interwar commercial block (about 1925-40), the kind
// Queen Street and Mt Eden Road had before the high-rise: plastered (smooth_quartz) walls, a stone base and string
// course, a shopfront storey with dark timber fascia and glazed bays, upper windows in stone reveals, and a flat roof
// behind a stone parapet. Heights from the lidar: 7 blocks above y 0 everywhere (the roof's top layer is y 7), flat.
// The walls are a one-block shell with air behind the glass; floor slabs at y 0 and y 4 and a roof deck at y 7.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269468265.cells.json`, "utf8"));

const X = 37, Z = 38, Y = 20;
const TOP = 7;                                       // the lidar roof height, the same on every cell
const ground = 0;

const fpSet = new Set(cells.map(([x, z]) => `${x},${z}`));
const fp = (x, z) => fpSet.has(`${x},${z}`);
// a cell's outside faces: xm = west, xp = east, zm = north, zp = south
const exposed = (x, z) => ({ xm: !fp(x - 1, z), xp: !fp(x + 1, z), zm: !fp(x, z - 1), zp: !fp(x, z + 1) });
const isRing = (x, z) => { const e = exposed(x, z); return e.xm || e.xp || e.zm || e.zp; };
const dirs = [["xm", "west", -1, 0], ["xp", "east", 1, 0], ["zm", "north", 0, -1], ["zp", "south", 0, 1]];

const v = new Voxels([X, Y, Z]);
const ring = [], interior = [];
for (const [x, z] of cells) (isRing(x, z) ? ring : interior).push([x, z]);

// ground-level stone base, floor slabs, the storey string course and the roof deck
for (const [x, z] of ring) {
  v.set(x, 0, z, "stone_bricks");
  v.set(x, 4, z, "stone_bricks");
  v.set(x, 7, z, "stone_bricks");
}
for (const [x, z] of interior) {
  v.set(x, 0, z, "smooth_stone");
  v.set(x, 4, z, "smooth_stone");
  v.set(x, TOP, z, "gray_concrete");
}

// facade bays: each ring cell's position along its facade, and which outside face(s) it has
const bayOf = (x, z) => {
  const e = exposed(x, z);
  const xE = e.xm || e.xp, zE = e.zm || e.zp;
  const along = zE && !xE ? x : xE && !zE ? z : x + z;   // along a run, or x+z on a diagonal step
  return { along, a: along % 4, bay: Math.floor(along / 4), single: xE !== zE ? (e.xm ? "xm" : e.xp ? "xp" : e.zm ? "zm" : "zp") : null };
};

// the entrance: a plain (single-face) cell on the longest facade run, glazed bay (a = 1 or 2), nearest the middle
const plain = ring.map(([x, z]) => ({ x, z, ...bayOf(x, z) })).filter((c) => c.single && (c.a === 1 || c.a === 2));
const faceCount = {};
for (const c of plain) faceCount[c.single] = (faceCount[c.single] || 0) + 1;
const face = Object.entries(faceCount).sort((p, q) => q[1] - p[1])[0][0];
const onFace = plain.filter((c) => c.single === face).sort((p, q) => p.along - q.along);
const door = onFace[Math.floor(onFace.length / 2)];
const doorFacing = dirs.find((d) => d[0] === face)[1];

// shopfront: stone piers and glazing at y 1-2, dark timber fascia at y 3 (the entrance bay's awning in red)
// upper storeys: glazing in bays 1-2 of each four, smooth_quartz walls between, stone reveals at y 4 and y 7
const panes = [];
const glow = new Set();
for (const [x, z] of ring) {
  const { along, a, bay, single } = bayOf(x, z);
  const isGlass = (a === 1 || a === 2) && !!single;      // glazing only on plain facades; diagonal steps stay solid
  const doorBay = door && face === single && Math.abs(along - door.along) <= 1;
  // shopfront storey
  if (door && x === door.x && z === door.z) {
    v.set(x, 1, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    v.set(x, 2, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    if (isGlass) {
      for (const y of [1, 2]) { v.set(x, y, z, "light_blue_stained_glass_pane"); panes.push([x, y, z]); }
    } else {
      for (const y of [1, 2]) v.set(x, y, z, "stone_bricks");
    }
  }
  v.set(x, 3, z, doorBay && single ? "red_terracotta" : "dark_oak_planks");
  // upper storeys: glazing in the same bays, quartz walls between
  for (const y of [5, 6]) {
    if (isGlass) { v.set(x, y, z, "light_blue_stained_glass_pane"); panes.push([x, y, z]); }
    else v.set(x, y, z, "smooth_quartz");
  }
  // warm light behind some panes: a lantern on the shop floor, a glowstone on the upper floor slab
  if (single && isGlass) {
    const d = dirs.find((q) => q[0] === single);
    const ix = x - d[2], iz = z - d[3];                    // one step inward
    if (fp(ix, iz) && !isRing(ix, iz)) {
      if (bay % 2 === 0) v.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      if (bay % 3 === 1) glow.add(`${ix},${iz}`);
    }
  }
}
for (const k of glow) { const [x, z] = k.split(",").map(Number); v.set(x, 5, z, "glowstone"); }

// roof plant: three 2x2 units on the deck, clear of the parapet by at least 3 cells
const fits = (x, z) => { for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) if (!fp(x + dx, z + dz)) return false; return true; };
const cand = interior.filter(([x, z]) => fits(x, z)).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
const unitAt = [];
for (const f of [0.2, 0.5, 0.8]) {
  const c = cand[Math.floor(cand.length * f)];
  if (c && !unitAt.some(([x, z]) => Math.abs(x - c[0]) < 5 && Math.abs(z - c[1]) < 5)) unitAt.push(c);
}
for (const [x, z] of unitAt) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) v.set(x + dx, TOP + 1, z + dz, "light_gray_concrete");

// a pane joins its neighbours: connect to glass or any block along the facade, never to air or across the air gap
const has = (x, y, z) => v.get(x, y, z) !== null;
for (const [x, y, z] of panes) {
  const st = {
    north: has(x, y, z - 1) ? "true" : "false",
    south: has(x, y, z + 1) ? "true" : "false",
    east: has(x + 1, y, z) ? "true" : "false",
    west: has(x - 1, y, z) ? "true" : "false",
  };
  v.set(x, y, z, "light_blue_stained_glass_pane", st);
}

const info = v.save(`${DIR}/way_269468265.nbt`);
console.log(JSON.stringify({ footprint: cells.length, ring: ring.length, entrance: door && [door.x, door.z, face, doorFacing], roofUnits: unitAt.length, ...info }));

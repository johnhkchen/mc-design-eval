// FR245184630: a 1900 Haussmann-style residential block of nine storeys in cream limestone, on the lidar footprint.
// Storeys are 4 blocks (a string course, two window rows, a lintel), so nine storeys reach y = 36, the lidar's roof.
// The lidar tiers are snapped to multiples of 4 (setbacks step in as the roof rises); every column is solid from its
// ground up to its tier, so each storey and roof stands on the one below. The facade is a one-cell skin with windows:
// behind each pane a one-cell air gap (some lit with glowstone), and the floor slab is the string course row.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184630.cells.json`, "utf8"));

const W = 26, H = 52, D = 18;
const STOREY = 4;

const fp = new Map();                                   // "x,z" -> { g: ground, lidar, T: tier top }
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, lidar: r, T: 0 });
const at = (x, z) => fp.get(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;

// Smooth the lidar: 3x3 median over the footprint, then snap to a whole storey (at least one).
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) vals.push(n.lidar); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.T = Math.max(STOREY, Math.round(med / STOREY) * STOREY);
}

// A column is solid below its tier (its foundation is part of that), air outside the footprint.
const solid = (x, y, z) => { const n = at(x, z); return !!n && y < n.T; };
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const exposed = (x, y, z) => NEI.filter(([, dx, dz]) => !solid(x + dx, y, z + dz)).map(([n]) => n);

// The front door: the middle of the south face's street-side cells at their lowest ground.
const southRow = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([, z]) => z === D - 1).sort((a, b) => a[0] - b[0]);
const doorAt = southRow[Math.floor(southRow.length / 2)];
const doorCell = doorAt ? { x: doorAt[0], z: doorAt[1], y: at(doorAt[0], doorAt[1]).g } : null;

// Window plan, pass one: each facade cell that faces one way and sits in a window row (1 or 2 of its storey) gets glass
// unless it is a pier (every third cell along the face). The cell inside it is the air gap behind the pane.
const glass = new Map(), gap = new Set();
const isGlassSpot = (x, y, z) => {
  const ex = exposed(x, y, z);
  if (ex.length !== 1 || y >= at(x, z).T - 1 || y < at(x, z).g) return null;
  const r = y % STOREY;
  if (r !== 1 && r !== 2) return null;
  const face = ex[0];
  const along = face === "north" || face === "south" ? x : z;
  if (along % 3 === 0) return null;
  if (doorCell && doorCell.x === x && doorCell.z === z && (y === doorCell.y || y === doorCell.y + 1)) return null;
  const [, dx, dz] = NEI.find(([n]) => n === OPP[face]);
  const ix = x + dx, iz = z + dz;
  if (!solid(ix, y, iz)) return null;
  if (exposed(ix, y, iz).length) return null;             // the gap must sit inside the building
  return { face, ix, iz };
};
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g; y < c.T - 1; y++) {
    const s = isGlassSpot(x, y, z);
    if (s) { glass.set(key(x, y, z), s.face); gap.add(key(s.ix, y, s.iz)); }
  }
}

const g = new Voxels([W, H, D]);
const lamps = [...gap].sort();
const LAMP = new Set(lamps.filter((_, i) => i % 4 === 0));   // one gap in four is lit

// Pass two: the building, column by column.
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { g.set(x, y, z, "stone_bricks"); continue; }      // the foundation: solid from y 0 to the ground
    const ex = exposed(x, y, z);
    const kk = key(x, y, z);
    if (!ex.length) {                                               // inside the building
      if (y === c.T - 2) g.set(x, y, z, "deepslate_tiles");        // a flat roof, one below the parapet
      else if (y === c.T - 1) continue;
      else if (gap.has(kk)) { if (LAMP.has(kk) && y % STOREY === 1) g.set(x, y, z, "glowstone"); }   // air, lit behind a pane
      else g.set(x, y, z, "stone");
      continue;
    }
    if (y === c.T - 1) { g.set(x, y, z, "smooth_stone"); continue; }   // parapet cap on the outer edge
    if (doorCell && doorCell.x === x && doorCell.z === z && (y === doorCell.y || y === doorCell.y + 1)) {
      g.set(x, y, z, "oak_door", { facing: "south", half: y === doorCell.y ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === c.g) { g.set(x, y, z, "stone_bricks"); continue; }      // a plinth course at the ground
    const r = y % STOREY;
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }         // string course, the storey's floor line
    const face = glass.get(kk);
    if (face) {
      const ns = face === "north" || face === "south";
      g.set(x, y, z, "glass_pane", { north: ns ? "false" : "true", south: ns ? "false" : "true", east: ns ? "true" : "false", west: ns ? "true" : "false", waterlogged: "false" });
    } else g.set(x, y, z, "calcite");
  }
}

// Roof plant: two brick chimney stacks on the deepest flat stretch of the top tier.
const top = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => at(x, z).T === 36 &&
  NEI.concat([["", 1, 1], ["", -1, -1], ["", 1, -1], ["", -1, 1]]).every(([, dx, dz]) => at(x + dx, z + dz)?.T === 36));
for (const [x, z] of [top[Math.floor(top.length / 3)], top[Math.floor((2 * top.length) / 3)]].filter(Boolean)) {
  for (let y = 35; y <= 37; y++) g.set(x, y, z, "bricks");
}

g.save(`${DIR}/FR245184630.nbt`);

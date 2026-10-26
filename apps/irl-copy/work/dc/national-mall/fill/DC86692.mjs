// 1325 Massachusetts Ave NW: a 1920s Classical Revival office block in brick with pale stone trim.
// Ground floor is a shopfront under a 3-block base, three storeys of window grids, a stone cornice; the
// core (lidar 12) steps up over 10-high wings, with a 1-block setback ring between. Floor slabs at each
// storey line, air behind the glass, a few lanterns in the window bays, and a double entrance on the north face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC86692.cells.json`, "utf8"));

const X = 15, Y = 24, Z = 11;
const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const has = (x, z) => foot.has(key(x, z));

// Smooth the lidar roof heights: a 3x3 mean over footprint cells, rounded, then clamped to the three tiers 10, 11, 12.
const tier = new Map();
for (const [x, z] of foot.keys().map((k) => k.split(",").map(Number))) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!has(x + dx, z + dz)) continue;
    s += foot.get(key(x + dx, z + dz)).roof; n++;
  }
  tier.set(key(x, z), Math.min(12, Math.max(10, Math.round(s / n))));
}
const R = (x, z) => tier.get(key(x, z));

// The outward faces of a footprint cell: the sides with no neighbour in the footprint.
const faces = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push({ dx: 0, dz: -1, axis: "z" });   // north
  if (!has(x, z + 1)) out.push({ dx: 0, dz: 1, axis: "z" });    // south
  if (!has(x - 1, z)) out.push({ dx: -1, dz: 0, axis: "x" });   // west
  if (!has(x + 1, z)) out.push({ dx: 1, dz: 0, axis: "x" });    // east
  return out;
};
const perim = (x, z) => faces(x, z).length > 0;

// Front door: the 2-cell notch in the north row (x 7..8, z 1), flanked by pilasters at x 6 and x 9.
const isDoor = (x, z) => z === 1 && (x === 7 || x === 8);
const isPilaster = (x, z) => z === 1 && (x === 6 || x === 9);

const g = new Voxels([X, Y, Z]);

for (const [x, z] of foot.keys().map((k) => k.split(",").map(Number))) {
  const r = R(x, z);
  const p = perim(x, z);
  const fz = faces(x, z).find((f) => f.axis === "z") ?? null;
  const u = fz ? x : z;                        // position along the face the cell is on
  const inward = p ? { dx: -faces(x, z)[0].dx, dz: -faces(x, z)[0].dz } : null;

  for (let y = 0; y < r; y++) {
    // roof cap / cornice
    if (y === r - 1) { g.set(x, y, z, p ? "calcite" : "stone"); continue; }
    // base course and floor slabs
    if (y === 0) { g.set(x, y, z, p ? "stone_bricks" : "smooth_stone"); continue; }
    if (y % 3 === 0) { g.set(x, y, z, p ? "calcite" : "smooth_stone"); continue; }
    // interior storey air
    if (!p) continue;

    // entrance: doors on the two notch cells, pilasters flanking
    if (isDoor(x, z) && y <= 2) {
      const hinge = x === 7 ? "left" : "right";
      const st = { facing: "north", hinge, open: "false", powered: "false", half: y === 1 ? "lower" : "upper" };
      g.set(x, y, z, "dark_oak_door", st);
      continue;
    }
    if (isPilaster(x, z) && y <= 2) { g.set(x, y, z, "calcite"); continue; }

    const ground = y < 3;
    const pier = u % 2 === 0;
    if (pier) { g.set(x, y, z, "bricks"); continue; }          // brick piers between the stone bands

    if (ground) { g.set(x, y, z, "glass"); continue; }

    // upper-floor windows: glass panes, joined to the neighbouring panes or piers along the face
    // along a z-face the run is east/west; along an x-face it is north/south
    const run = fz ? [[1, 0, "east"], [-1, 0, "west"]] : [[0, 1, "south"], [0, -1, "north"]];
    const arms = { north: "false", south: "false", east: "false", west: "false" };
    for (const [dx, dz, name] of run) if (perim(x + dx, z + dz) && has(x + dx, z + dz)) arms[name] = "true";
    g.set(x, y, z, "glass_pane", arms);
  }

  // warm lights: a lantern standing on a floor slab two cells in from some upper-floor windows
  if (p && !isDoor(x, z) && u % 2 === 1 && inward) {
    for (let y = 1; y < r - 1; y += 3) {
      if (y < 4) continue;                                    // ground-floor shopfronts stay open
      if ((u * 7 + y * 3) % 11 !== 0) continue;
      const ix = x + 2 * inward.dx, iz = z + 2 * inward.dz;
      if (has(ix, iz) && !perim(ix, iz) && y < R(ix, iz) - 1) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Roof plant on the wings: a few vent boxes standing on the 10-high cap.
let vents = 0;
for (const [x, z] of foot.keys().map((k) => k.split(",").map(Number))) {
  if (perim(x, z) || R(x, z) !== 10) continue;
  if ((x * 3 + z) % 7 === 0 && vents < 4) { g.set(x, 10, z, "iron_block"); vents++; }
}

const out = g.save(`${dir}/DC86692.nbt`);
console.log(JSON.stringify({ built: out, tiers: { 10: [...tier.values()].filter((v) => v === 10).length, 11: [...tier.values()].filter((v) => v === 11).length, 12: [...tier.values()].filter((v) => v === 12).length }, vents }));

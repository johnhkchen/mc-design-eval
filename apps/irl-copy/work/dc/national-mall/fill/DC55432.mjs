// DC55432: a 9 x 7 block footprint on the Mall's north side, read from lidar as a three-storey limestone office block
// (Federal Triangle manner) with a seventh-block tower over its north-east corner. Plinth, two window storeys with
// calcite piers and a glass ribbon, a smooth-quartz cornice, a flat roof with two brick plant boxes. The south front
// has a recessed iron door between chiselled pilasters. Interiors are air, with a floor slab per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC55432.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 9, Z = 7, Y = 9;
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => F.has(`${x},${z}`);

// the walls face outward where the neighbour cell is off the footprint
const exposure = (x, z) => {
  const d = [];
  if (!inF(x, z - 1)) d.push("north");
  if (!inF(x, z + 1)) d.push("south");
  if (!inF(x - 1, z)) d.push("west");
  if (!inF(x + 1, z)) d.push("east");
  return d;
};

// the roof tiers: the lidar's 7 is the tower, 5 and 6 are one flat body (lidar noise smoothed away)
const topOf = (c) => (c.roof >= 7 ? 7 : 6);

// the pane joins the wall on its in-plane sides and stands clear on the outward ones
const paneState = (x, z, dirs) => {
  const ns = dirs.includes("north") || dirs.includes("south");
  return ns
    ? { north: "false", south: "false", east: inF(x + 1, z) ? "true" : "false", west: inF(x - 1, z) ? "true" : "false" }
    : { east: "false", west: "false", north: inF(x, z - 1) ? "true" : "false", south: inF(x, z + 1) ? "true" : "false" };
};

const g = new Voxels([X, Y, Z]);
const DOOR = [3, 5];                                  // south front, recessed between the pilasters at 2 and 4
const pier = (x, z) => (z === 5 && (x === 2 || x === 4) ? "chiseled_stone_bricks" : "calcite");

for (const [x, z] of [...F.keys()].map((k) => k.split(",").map(Number))) {
  const c = F.get(`${x},${z}`);
  const dirs = exposure(x, z);
  const shell = dirs.length > 0;
  const bay = dirs.length === 1 && (x + z) % 2 === 1;   // single-face cells alternate pane and pier along each run
  const onDoor = x === DOOR[0] && z === DOOR[1];
  const top = topOf(c);

  // base course, solid under every cell (ground is 0 across the footprint, so nothing to fill below it)
  g.set(x, 0, z, "stone_bricks");

  // storey 1 (y1-2) and the storey-2 glass ribbon (y4)
  if (shell) {
    for (const y of [1, 2, 4]) {
      if (onDoor && y <= 2) continue;
      if (bay) g.set(x, y, z, "glass_pane", paneState(x, z, dirs));
      else g.set(x, y, z, pier(x, z));
    }
  }
  if (onDoor) {
    g.set(x, 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // floor slab per storey, the cornice course and the roof
  g.set(x, 3, z, "smooth_quartz");
  g.set(x, 5, z, shell ? "smooth_quartz" : "smooth_stone");
  if (top === 7) g.set(x, 6, z, shell ? "smooth_quartz" : "smooth_stone");
}

// warm light behind the glass: lanterns hang from each storey's slab; a few glowstone blocks stand on the plinth
for (const [x, z] of [...F.keys()].map((k) => k.split(",").map(Number))) {
  if (exposure(x, z).length > 0) continue;               // interior cells only
  if ((x + z) % 3 === 0) g.set(x, 2, z, "lantern", { hanging: "true" });
  if ((x * 2 + z) % 4 === 1) g.set(x, 4, z, "lantern", { hanging: "true" });
  if ((x + 2 * z) % 7 === 3) g.set(x, 1, z, "glowstone");
}

// plant boxes on the body roof, standing on the roof slab
g.set(2, 6, 4, "bricks");
g.set(6, 6, 4, "bricks");

const out = g.save(`${HERE}/DC55432.nbt`);
console.log(JSON.stringify(out));

// DC80159: a three-storey red-brick Federal / Beaux-Arts civic block on the Mall. Its footprint is an L: a 6-wide wing
// (x 1..6, z 0..6) running back from a full-width 8-wide front (z 7..9). Lidar's roof runs 6..8 over it, median-smoothed
// to one clean cornice line at 7, with a 3x3 cupola (lidar 8) over the wing's core. Walls are a 1-block shell, floor
// slabs at y 1, 3, 5, a roof deck at y 7, and air behind the glass. Trim is pale limestone-look smooth quartz.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80159.cells.json", "utf8"));
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);

const LEVEL = 7;                                  // the cornice / roof deck (lidar 6..8, median-smoothed)
const CUPOLA = { x0: 2, x1: 4, z0: 2, z1: 4, top: 8 };
const BRICK = "bricks", TRIM = "smooth_quartz", BASE = "stone_bricks", FLOOR = "smooth_stone", ROOF = "stone";

const g = new Voxels([8, 20, 10]);

// Which outside faces each footprint cell has (N = -z, S = +z, W = -x, E = +x).
const exposed = (x, z, face) => {
  const d = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }[face];
  return !inFp(x + d[0], z + d[1]);
};
// A window bay sits between the two ends of its run of exposed cells along one wall; the ends are piers.
const isWindowBay = (x, z, face) => {
  if (face === "N" || face === "S") {
    let a = x, b = x; while (inFp(a - 1, z) && exposed(a - 1, z, face)) a--; while (inFp(b + 1, z) && exposed(b + 1, z, face)) b++;
    return x > a && x < b;
  }
  let a = z, b = z; while (inFp(x, a - 1) && exposed(x, a - 1, face)) a--; while (inFp(x, b + 1) && exposed(x, b + 1, face)) b++;
  return z > a && z < b;
};
const faceOf = (x, z) => ["N", "S", "W", "E"].filter((f) => exposed(x, z, f));

// Pane states: a pane joins the wall it sits in (along x on N/S walls, along z on W/E walls).
const paneOn = (alongX) => ({ east: String(alongX), west: String(alongX), north: String(!alongX), south: String(!alongX), waterlogged: "false" });

// The front door: double doors centred on the south front, the two doors' hinges on the outside edges.
const DOORS = [{ x: 3, hinge: "left" }, { x: 4, hinge: "right" }];
const isDoor = (x, y, z) => z === 9 && y >= 2 && y <= 3 && DOORS.some((d) => d.x === x);
const isEntrancePier = (x, y, z) => z === 9 && ((y === 2 && (x === 2 || x === 5)) || (y === 4 && x >= 2 && x <= 5));

// Warm light behind some windows (in the air gap, one cell in from the glass).
const LIGHTS = new Set(["3,4,1", "5,2,1", "3,6,8", "5,4,3"]);

for (const [x, z] of cells) {
  const faces = faceOf(x, z);
  const facade = faces.length > 0;
  const inCupola = x >= CUPOLA.x0 && x <= CUPOLA.x1 && z >= CUPOLA.z0 && z <= CUPOLA.z1;

  // ground: the base course on the front and sides, floor slabs inside
  g.set(x, 1, z, facade ? BASE : FLOOR);

  for (const y of [3, 5]) {
    // storey lines: smooth-quartz bands on the facade, floor slabs inside
    g.set(x, y, z, facade ? TRIM : FLOOR);
  }

  // the roof deck and the cornice on top of every cell
  g.set(x, LEVEL, z, facade ? TRIM : ROOF);

  if (!facade) {
    if (inCupola) continue;   // cupola walls above
    continue;
  }

  for (const y of [2, 4, 6]) {
    if (isDoor(x, y, z)) continue;   // doors placed below
    if (isEntrancePier(x, y, z)) { g.set(x, y, z, TRIM); continue; }
    // every facade cell takes the first of its exposed faces for the glass decision
    const face = faces[0];
    const bay = faces.some((f) => isWindowBay(x, z, f));
    if (bay && y >= 2) {
      // windows: glass in the bay, pier brick at the ends
      const alongX = face === "N" || face === "S";
      g.set(x, y, z, "glass_pane", paneOn(alongX));
    } else {
      g.set(x, y, z, BRICK);
    }
  }
}

// Interior: an air gap behind each window row is kept clear, except for the warm lights: lanterns hung from the floor
// slab above each lit window, so they read as lamps through the glass rather than blobs.
for (const key of LIGHTS) { const [x, y, z] = key.split(",").map(Number); if (inFp(x, z)) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); }

// Front doors on the south face (opening outward), with pale quartz pilasters and a lintel above.
for (const d of DOORS) {
  g.set(d.x, 2, 9, "dark_oak_door", { facing: "south", half: "lower", hinge: d.hinge, open: "false", powered: "false" });
  g.set(d.x, 3, 9, "dark_oak_door", { facing: "south", half: "upper", hinge: d.hinge, open: "false", powered: "false" });
}

// The cupola: a 3x3 crown at y 8 standing on the roof deck, quartz corners, glass on each side, a lantern in the middle.
for (let x = CUPOLA.x0; x <= CUPOLA.x1; x++) for (let z = CUPOLA.z0; z <= CUPOLA.z1; z++) {
  const corner = (x === CUPOLA.x0 || x === CUPOLA.x1) && (z === CUPOLA.z0 || z === CUPOLA.z1);
  const mid = (x === 3 && (z === CUPOLA.z0 || z === CUPOLA.z1)) || (z === 3 && (x === CUPOLA.x0 || x === CUPOLA.x1));
  if (corner) g.set(x, CUPOLA.top, z, TRIM);
  else if (mid) g.set(x, CUPOLA.top, z, "glass_pane", paneOn(z === CUPOLA.z0 || z === CUPOLA.z1));
  else g.set(x, CUPOLA.top, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Rooftop plant: two copper-clad units on the wing's roof deck, clear of the cupola.
g.set(5, 8, 5, "copper_block");
g.set(2, 8, 5, "copper_block");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80159.nbt");
console.log(JSON.stringify(out));

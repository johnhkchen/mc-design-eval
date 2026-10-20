import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001345";
const W = 16, H = 29, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { gr, roof });
const isIn = (x, z) => map.has(key(x, z));
const isPerim = (x, z) => !isIn(x - 1, z) || !isIn(x + 1, z) || !isIn(x, z - 1) || !isIn(x, z + 1);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);
const zm = Math.floor((zmin + zmax) / 2);

// Flat roof at the median lidar height; downhill cells gain storeys.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const T = Math.round(roofs[Math.floor(roofs.length / 2)]);

// Column records
const colMap = new Map();
for (const [x, z, gr] of cells) {
  const G = Math.max(0, Math.min(H - 10, Math.round(gr)));
  let n = Math.max(2, Math.round((T - G) / 2));
  n = Math.min(n, Math.floor((H - 6 - G) / 2));
  const faces = { w: !isIn(x - 1, z), e: !isIn(x + 1, z), n: !isIn(x, z - 1), s: !isIn(x, z + 1) };
  const perim = faces.w || faces.e || faces.n || faces.s;
  colMap.set(key(x, z), { x, z, G, n, top: G + 2 * n, faces, perim });
}

const glassProps = (axisX) => axisX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: centred on the north face (low z), three cells wide.
const DOOR_X = 8;
const DOOR_Z = zmin;
const isEntrance = (x, z) => z === DOOR_Z && Math.abs(x - DOOR_X) <= 1 && isIn(x, z);

// Main massing: foundation, storeys, floor slabs, cornice, parapet
for (const c of colMap.values()) {
  const { x, z, G, n, top, faces, perim } = c;

  // Foundation up to the ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  for (let s = 0; s < n; s++) {
    const b = G + 2 * s;

    // Floor slab on every storey (interior)
    if (!perim) {
      g.set(x, b, z, "smooth_stone");
      continue;
    }

    const corner = (faces.w || faces.e) && (faces.n || faces.s);
    const axisX = faces.n || faces.s;
    const along = axisX ? x - xmin : z - zmin;
    const pier = corner || along % 3 === 0;

    // Spandrel / base row
    g.set(x, b, z, s <= 1 ? "stone_bricks" : "bricks");

    if (s === 0 && isEntrance(x, z)) {
      // Stone portico: solid stone surround, door set later
      g.set(x, b + 1, z, "stone_bricks");
      continue;
    }

    // Window / pier row
    if (pier) {
      g.set(x, b + 1, z, s === 0 ? "stone_bricks" : "bricks");
    } else {
      g.set(x, b + 1, z, "glass_pane", glassProps(axisX));

      // Warm light behind some glass
      if (s % 2 === 0 && along % 6 === 2) {
        let ix = x, iz = z;
        if (faces.w) ix = x + 1;
        else if (faces.e) ix = x - 1;
        else if (faces.n) iz = z + 1;
        else if (faces.s) iz = z - 1;
        if (isIn(ix, iz) && !isPerim(ix, iz)) g.set(ix, b + 1, iz, "glowstone");
      }
    }
  }

  // Roof level
  if (perim) {
    g.set(x, top, z, "stone_bricks");      // cornice
    g.set(x, top + 1, z, "bricks");        // parapet
  } else {
    g.set(x, top, z, "smooth_stone");      // roof deck
  }
}

// Entrance door, transom and warm light above the stone surround
const entCol = colMap.get(key(DOOR_X, DOOR_Z));
if (entCol && entCol.faces.n) {
  const G = entCol.G;
  g.set(DOOR_X, G, DOOR_Z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(DOOR_X, G + 1, DOOR_Z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Sidelights of glass at the door's flanks
  for (const px of [DOOR_X - 1, DOOR_X + 1]) {
    if (isIn(px, DOOR_Z)) g.set(px, G, DOOR_Z, "glass_pane", glassProps(true));
  }
  // Warm lantern light in the recess behind the door
  if (isIn(DOOR_X, DOOR_Z + 1) && !isPerim(DOOR_X, DOOR_Z + 1)) {
    g.set(DOOR_X, G + 1, DOOR_Z + 1, "glowstone");
  }
}

// Rooftop bulkhead (stair/elevator enclosure), solid brick box on the roof
let bulkOk = true;
for (let x = 6; x <= 9; x++) {
  for (let z = zm - 2; z <= zm + 1; z++) {
    const c = colMap.get(key(x, z));
    if (!c || c.perim || c.top + 3 > H - 2) bulkOk = false;
  }
}
if (bulkOk) {
  for (let x = 6; x <= 9; x++) {
    for (let z = zm - 2; z <= zm + 1; z++) {
      const c = colMap.get(key(x, z));
      g.set(x, c.top + 1, z, "bricks");
      g.set(x, c.top + 2, z, "bricks");
      g.set(x, c.top + 3, z, "stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

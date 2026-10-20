import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988118";
const W = 15, H = 23, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and ground levels
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const L = Math.min(...ground.values());

// Roof: about 11 blocks above lowest ground (two storeys of ~5 blocks plus cornice and parapet)
const roofY = Math.min(L + 11, H - 2);

// Outward normals of the four faces
const faces = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const exposedFaces = (x, z) => faces.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerim = (x, z) => exposedFaces(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pick the entrance: prefer the north (z-min) street frontage, middle of its run
const faceCells = [];
for (const [x, z] of cells) {
  for (const [dx, dz, fc] of faces) {
    if (!has(x + dx, z + dz)) faceCells.push({ x, z, dx, dz, fc });
  }
}
let pref = faceCells.filter((f) => f.dz === -1);
if (!pref.length) pref = faceCells.filter((f) => f.dz === 1);
if (!pref.length) pref = faceCells;
pref.sort((a, b) => a.x - b.x || a.z - b.z);
const doorCell = pref[Math.floor(pref.length / 2)];
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;
const doorFacing = doorCell ? doorCell.fc : null;

for (const [x, z] of cells) {
  const gg = gnd(x, z);
  const ex = exposedFaces(x, z);
  const perim = ex.length > 0;
  const upperOK = gg + 9 <= roofY - 2;
  const storeyLineOK = gg + 5 <= roofY - 2;

  // Foundation fill from y 0 up to the cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: ground slab, storey slab, roof deck; air between (no interiors)
    put(x, gg, z, "smooth_stone");
    if (storeyLineOK) put(x, gg + 5, z, "smooth_stone");
    if (gg < roofY - 1) put(x, roofY - 1, z, "gray_concrete");
    continue;
  }

  // Perimeter
  const corner = ex.some(([dx]) => dx !== 0) && ex.some(([, dz]) => dz !== 0);
  const [pdx, pdz, pfc] = ex[0];
  const alongX = pdz !== 0; // wall runs along x (north/south face)
  const t = alongX ? x : z;
  const pane = !corner && t % 3 !== 0;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Base course
  put(x, gg, z, "stone_bricks");

  const isDoor = doorKey === `${x},${z}` && pfc === doorFacing;

  for (let y = gg + 1; y <= roofY - 2; y++) {
    const rel = y - gg;
    let id = "white_concrete";
    let props;

    if (isDoor && (rel === 1 || rel === 2)) {
      id = "dark_oak_door";
      props = {
        facing: doorFacing,
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
    } else if (rel >= 1 && rel <= 3 && !isDoor) {
      if (pane) { id = "light_blue_stained_glass_pane"; props = paneProps; }
      else id = "gray_concrete";
    } else if (rel === 4) {
      id = "stone_bricks"; // ground-floor lintel
    } else if (rel === 5) {
      id = "smooth_stone"; // storey line
    } else if (upperOK && rel >= 6 && rel <= 8) {
      if (pane) { id = "light_blue_stained_glass_pane"; props = paneProps; }
      else id = "gray_concrete";
    } else if (upperOK && rel === 9) {
      id = "stone_bricks"; // upper spandrel
    }

    put(x, y, z, id, props);
  }

  // Cornice and parapet
  if (gg < roofY - 1) put(x, roofY - 1, z, "stone_bricks");
  put(x, roofY, z, "white_concrete");

  // Warm light just inside the glazing on some bays (lantern standing on the slab below)
  if (pane && t % 6 === 1) {
    const ix = x - pdx, iz = z - pdz;
    if (has(ix, iz) && !isPerim(ix, iz) && gnd(ix, iz) === gg) {
      put(ix, gg + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      if (upperOK) put(ix, gg + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Entrance door (drawn after the wall pass so it overrides the wall columns)
if (doorCell) {
  const { x, z, fc } = doorCell;
  const gg = gnd(x, z);
  g.set(x, gg + 1, z, "dark_oak_door", { facing: fc, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gg + 2, z, "dark_oak_door", { facing: fc, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant: small light-grey units on interior roof cells
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  const gg = gnd(x, z);
  if (gg >= roofY - 1) continue;
  if (x % 5 === 2 && z % 6 === 3 && roofY + 1 <= H - 1) {
    put(x, roofY, z, "light_gray_concrete");
    put(x, roofY + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

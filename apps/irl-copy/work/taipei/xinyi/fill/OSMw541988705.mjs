import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988705";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (rounded to whole blocks)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const list = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

// Datum for the building: top of the highest ground so every floor sits on solid
const B = Math.max(...list.map((c) => c.gr));

// Perimeter = cell with a missing 4-neighbour
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Facade orientation for a perimeter cell
const zFace = (x, z) => !has(x, z - 1) || !has(x, z + 1); // wall runs along x
const xFace = (x, z) => !has(x - 1, z) || !has(x + 1, z); // wall runs along z
const isCorner = (x, z) => zFace(x, z) && xFace(x, z);

// Piers every 3 cells along each facade, corners always piers
const isPier = (x, z) => {
  if (isCorner(x, z)) return true;
  if (zFace(x, z)) return ((x % 3) + 3) % 3 === 0;
  return ((z % 3) + 3) % 3 === 0;
};

const paneProps = (horizontalWall) =>
  horizontalWall
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation: solid from y 0 up to each cell's ground, then plinth up to the datum
for (const c of list) {
  for (let y = 0; y < B; y++) g.set(c.x, y, c.z, "gray_concrete");
}

// 2. Floor slabs: base at B, storey lines at B+5, roof deck at B+10 (whole footprint)
for (const c of list) {
  const per = isPerim(c.x, c.z);
  g.set(c.x, B, c.z, per ? "stone_bricks" : "smooth_stone");
  g.set(c.x, B + 5, c.z, "light_gray_concrete");
  g.set(c.x, B + 10, c.z, "light_gray_concrete");
}

// 3. Entrance: middle of the cells on the lowest-z (street) side
const front = list.filter((c) => !has(c.x, c.z - 1)).sort((a, b) => a.x - b.x);
const entrance = front.length ? front[Math.floor(front.length / 2)] : null;
const isEntrance = (x, z) => entrance && entrance.x === x && entrance.z === z;

// 4. Facade walls on the perimeter
for (const c of list) {
  const { x, z } = c;
  if (!isPerim(x, z)) continue;
  const zf = zFace(x, z);
  const pier = isPier(x, z);
  const pane = paneProps(zf);

  if (isEntrance(x, z)) {
    // Door: lower and upper halves on the street face, lintel above
    g.set(x, B + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, B + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, B + 3, z, "white_concrete");
  } else {
    // Ground floor shopfront: piers and glass
    for (let y = B + 1; y <= B + 3; y++) {
      if (pier) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "gray_stained_glass_pane", pane);
    }
  }

  // Ground-floor lintel band
  g.set(x, B + 4, z, "light_gray_concrete");

  // Upper floor: frames at B+6 and B+9, glass at B+7..B+8
  for (let y = B + 6; y <= B + 9; y++) {
    if (pier || y === B + 6 || y === B + 9) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "gray_stained_glass_pane", pane);
  }

  // Cornice cap at roof deck level, parapet on top
  g.set(x, B + 11, z, "white_concrete");
}

// 5. Warm light behind some windows (inside the air gap, never on the facade)
const inwardOf = (x, z) => {
  const dx = !has(x - 1, z) ? 1 : !has(x + 1, z) ? -1 : 0;
  const dz = !has(x, z - 1) ? 1 : !has(x, z + 1) ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) return null;
  return [ix, iz];
};

for (const c of list) {
  const { x, z } = c;
  if (!isPerim(x, z) || isPier(x, z) || isEntrance(x, z)) continue;
  const inward = inwardOf(x, z);
  if (!inward) continue;
  if ((x + z) % 4 === 0) g.set(inward[0], B + 2, inward[1], "glowstone");
  if ((x + z) % 3 === 0) g.set(inward[0], B + 7, inward[1], "shroomlight");
}

// 6. Roof equipment: a few cooling units on the roof deck (interior cells only)
for (const c of list) {
  const { x, z } = c;
  if (isPerim(x, z)) continue;
  if (((x * 3 + z * 5) % 11) !== 0) continue;
  if (B + 12 >= H) continue;
  g.set(x, B + 11, z, "iron_block");
  g.set(x, B + 12, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);

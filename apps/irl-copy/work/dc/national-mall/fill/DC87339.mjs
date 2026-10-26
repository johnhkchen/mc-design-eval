import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87339.cells.json`, "utf8"));

const W = 7, D = 18, H = 31;
const g = new Voxels([W, H, D]);

// Footprint lookup: ground b, lidar roof r (clamped to a sane storey count).
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const b = Math.max(0, Math.round(gr));
  const r = Math.min(H - 6, Math.max(b + 4, Math.round(rf)));
  map.set(`${x},${z}`, { b, r });
}
const at = (x, z) => map.get(`${x},${z}`);

const ENTRY_X = 3;
const ENTRY_Z = D - 1;

for (const [key, { b, r }] of map) {
  const [x, z] = key.split(",").map(Number);
  const top = r - 1;                     // roof deck level
  const onNS = z === 0 || z === D - 1;
  const onWE = x === 0 || x === W - 1;
  const perim = onNS || onWE;
  const corner = onNS && onWE;

  let idx = 0, maxIdx = 0;
  if (onNS) { idx = x; maxIdx = W - 1; }
  else if (onWE) { idx = z; maxIdx = D - 1; }
  const pier = corner || idx % 3 === 0 || idx === maxIdx;

  // Foundation and base course.
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, b, z, "light_gray_concrete");

  // Storeys: 4-block module (3 window rows + floor line).
  for (let y = b + 1; y < top; y++) {
    const rel = (y - b) % 4;
    if (rel === 0) {
      g.set(x, y, z, perim ? "light_gray_concrete" : "white_concrete");
    } else if (perim) {
      if (pier) g.set(x, y, z, "white_concrete");
      else if (rel === 3) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Roof deck over every cell.
  g.set(x, top, z, "white_concrete");

  // Cornice on the perimeter.
  if (perim) {
    g.set(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Standing lanterns on the interior floor slabs, just behind some windows.
for (const [key, { b, r }] of map) {
  const [x, z] = key.split(",").map(Number);
  const onNS = z === 0 || z === D - 1;
  const onWE = x === 0 || x === W - 1;
  if (!(onNS || onWE) || (onNS && onWE)) continue;
  const idx = onNS ? x : z;
  const dx = onWE ? (x === 0 ? 1 : -1) : 0;
  const dz = onNS ? (z === 0 ? 1 : -1) : 0;
  if (!at(x + dx, z + dz)) continue;
  if (idx % 3 === 0 || idx === (onNS ? W - 1 : D - 1)) continue;
  for (let k = 0; b + 4 * k + 1 < r - 1; k++) {
    if (k > 2) break;
    if ((idx + k) % 3 !== 1) continue;
    g.set(x + dx, b + 4 * k + 1, z + dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Framed entrance bay on the street face (z = D-1), centred on x = ENTRY_X.
{
  const e = at(ENTRY_X, ENTRY_Z);
  if (e) {
    const b = e.b;
    // Stone jambs and lintel framing the door.
    for (const dx of [-1, 1]) {
      const xx = ENTRY_X + dx;
      if (!at(xx, ENTRY_Z)) continue;
      for (let y = b + 1; y <= b + 3; y++) g.set(xx, y, ENTRY_Z, "stone_bricks");
    }
    g.set(ENTRY_X, b + 3, ENTRY_Z, "stone_bricks");
    // Door: lower and upper halves.
    g.set(ENTRY_X, b + 1, ENTRY_Z, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(ENTRY_X, b + 2, ENTRY_Z, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Warm lanterns at the entry bay, standing on the floor just inside.
    if (at(ENTRY_X, ENTRY_Z - 1)) {
      g.set(ENTRY_X, b + 1, ENTRY_Z - 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Glazed penthouse on the roof, set back from the street face, with a parapet.
{
  let roofMax = 0;
  for (const [, c] of map) roofMax = Math.max(roofMax, c.r);
  const ph = [];
  for (let x = 1; x <= W - 2; x++) {
    for (let z = 6; z <= 11; z++) {
      const c = at(x, z);
      if (c) ph.push([x, z, c.r]);
    }
  }
  for (const [x, z, rr] of ph) {
    const edge = x === 1 || x === W - 2 || z === 6 || z === 11;
    for (let y = rr; y <= rr + 2; y++) {
      if (edge) {
        g.set(x, y, z, y === rr + 2 ? "light_gray_concrete" : "light_blue_stained_glass");
      }
    }
    // Penthouse roof cap.
    g.set(x, rr + 3, z, "white_concrete");
    if (edge) g.set(x, rr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC87339.nbt`);

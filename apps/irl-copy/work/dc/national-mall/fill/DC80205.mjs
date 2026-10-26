import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC80205";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 27, D = 19;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(`${x},${z}`, { g: gr, r: rf });
const has = (x, z) => cellMap.has(`${x},${z}`);
const topOf = (c) => Math.min(H - 1, Math.max(c.g + 3, Math.round(c.r))) - 1;

// Street face: smallest z; door on the cell nearest the centre line.
let frontZ = Infinity;
for (const [, z] of cells) frontZ = Math.min(frontZ, z);
let doorX = null, doorBest = Infinity;
for (const [x, z] of cells) {
  if (z !== frontZ) continue;
  const d = Math.abs(x - (W - 1) / 2);
  if (d < doorBest) { doorBest = d; doorX = x; }
}
const doorCell = doorX !== null ? cellMap.get(`${doorX},${frontZ}`) : null;

const GLASS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const CORNICE = "smooth_sandstone";
const PARAPET_SLAB = { type: "bottom", waterlogged: "false" };

const windowsToLight = [];

for (const [x, z, gr, rf] of cells) {
  const ground = gr;
  const R = Math.min(H - 1, Math.max(ground + 3, Math.round(rf)));
  const top = R - 1;

  // Plinth below own ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const isEdge = !nN || !nS || !nW || !nE;

  let face = null, idx = 0, lim = 0;
  if (!nN) { face = "n"; idx = x; lim = W - 1; }
  else if (!nS) { face = "s"; idx = x; lim = W - 1; }
  else if (!nW) { face = "w"; idx = z; lim = D - 1; }
  else if (!nE) { face = "e"; idx = z; lim = D - 1; }

  if (!isEdge) {
    // Solid core so every roof and tier is supported; lights added later
    for (let y = ground; y < top; y++) g.set(x, y, z, "stone");
    if (x >= 4 && x <= 6 && z >= 7 && z <= 11) g.set(x, top, z, "glass");
    else g.set(x, top, z, "deepslate_tiles");
    continue;
  }

  for (let y = ground; y <= top; y++) {
    if (y === top) {
      g.set(x, y, z, "stone_brick_slab", PARAPET_SLAB);
    } else if (y === top - 1) {
      g.set(x, y, z, CORNICE); // cornice course
    } else if (y === ground) {
      g.set(x, y, z, "stone_bricks"); // base course
    } else if (y % 3 === 0) {
      g.set(x, y, z, CORNICE); // storey string course
    } else {
      const isWindowRow = y % 3 === 1 || y % 3 === 2;
      const isWindowCol = idx % 2 === 1 && idx > 0 && idx < lim;
      if (isWindowRow && isWindowCol && face) {
        g.set(x, y, z, "glass_pane", GLASS);
        if ((idx * 7 + y * 3 + x + z) % 5 === 0) {
          let dx = 0, dz = 0;
          if (face === "n") dz = 1;
          else if (face === "s") dz = -1;
          else if (face === "w") dx = 1;
          else dx = -1;
          windowsToLight.push([x + dx, y, z + dz]);
        }
      } else {
        g.set(x, y, z, "bricks");
      }
    }
  }
}

// Warm light behind some windows, in the solid core cell just inside the glass
for (const [lx, ly, lz] of windowsToLight) {
  if (!has(lx, lz)) continue;
  const c = cellMap.get(`${lx},${lz}`);
  if (ly > c.g && ly < topOf(c) - 1) g.set(lx, ly, lz, "glowstone");
}

// Entrance: double door on the street face, lintel, lantern in a cleared vestibule
if (doorCell && doorX !== null) {
  const dg = doorCell.g;
  const dTop = topOf(doorCell);
  g.set(doorX, dg, frontZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, dg + 1, frontZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  if (dg + 2 < dTop) g.set(doorX, dg + 2, frontZ, CORNICE);

  // Flanking glazing in the entrance bay
  for (const dx of [-1, 1]) {
    const lx = doorX + dx;
    if (has(lx, frontZ)) {
      const lc = cellMap.get(`${lx},${frontZ}`);
      g.set(lx, lc.g + 1, frontZ, "glass_pane", GLASS);
      g.set(lx, lc.g + 2, frontZ, "glass_pane", GLASS);
    }
  }

  // Vestibule: clear the two cells behind the door and hang a lantern
  if (has(doorX, frontZ + 1)) {
    const vc = cellMap.get(`${doorX},${frontZ + 1}`);
    const vTop = topOf(vc);
    for (let y = dg; y <= Math.min(dg + 2, vTop); y++) g.set(doorX, y, frontZ + 1, "air");
    g.set(doorX, dg + 1, frontZ + 1, "glowstone");
    if (dg + 2 < vTop) g.set(doorX, dg + 2, frontZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

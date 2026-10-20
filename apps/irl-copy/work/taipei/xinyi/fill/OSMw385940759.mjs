import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw385940759";
const W = 29, H = 47, D = 33;
const ROOF = 35;
const PARAPET_TOP = 37;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const gmap = new Map();
for (const [x, z, y0] of raw) gmap.set(`${x},${z}`, Math.round(y0));
const has = (x, z) => gmap.has(`${x},${z}`);

const cells = raw.map(([x, z, y0]) => {
  const outs = Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);
  return { x, z, gr: Math.round(y0), outs, perim: outs.length > 0 };
});

// Entrance: centred door on the south (street-side) edge, else nearest perimeter cell.
const perim = cells.filter((c) => c.perim);
const cx = perim.reduce((s, c) => s + c.x, 0) / perim.length;
let cand = perim.filter((c) => c.outs.includes("south"));
if (!cand.length) cand = perim;
const doorCell = cand.reduce((b, c) => (Math.abs(c.x - cx) < Math.abs(b.x - cx) ? c : b));
const door = {
  x: doorCell.x,
  z: doorCell.z,
  gr: doorCell.gr,
  facing: doorCell.outs.includes("south") ? "south" : doorCell.outs[0],
};

// Facade: pale-grey piers, white spandrel bands, blue glazing, a few lit bays.
function facade(c, y) {
  const s = Math.floor(y / 5);
  const ly = y % 5;
  const corner = c.outs.length > 1;
  const pier = corner || (c.x + c.z) % 3 === 0;

  // Entrance column: two-high glazed door, granite lintel, glass above.
  if (c.x === door.x && c.z === door.z && y - door.gr <= 4) {
    const k = y - door.gr;
    if (k === 0) return ["dark_oak_door", { facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (k === 1) return ["dark_oak_door", { facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (k === 2) return ["polished_granite"];
    if (k === 3) return ["glass"];
    return ["white_concrete"];
  }

  if (y === 34) return ["smooth_stone_slab", { type: "top", waterlogged: "false" }];

  if (s === 0) {
    if (ly === 0) return ["polished_granite"];
    if (ly === 4) return ["white_concrete"];
    return pier ? ["polished_granite"] : ["glass"];
  }

  if (ly === 0 || ly === 4) return ["white_concrete"];
  if (pier) return ["light_gray_concrete"];
  // Lit bays only in a sparse diagonal pattern, so they read as occupied rooms, not noise.
  const lit = (c.x + 2 * c.z + 3 * s) % 17 === 0 && s >= 1;
  return lit ? ["glowstone"] : ["light_blue_stained_glass"];
}

for (const c of cells) {
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");

  if (!c.perim) {
    for (let y = c.gr; y <= ROOF; y++) {
      if (y % 5 === 0) g.set(c.x, y, c.z, "light_gray_concrete");
    }
    if (c.x % 6 === 3 && c.z % 6 === 3) {
      for (let y = c.gr; y < ROOF; y++) g.set(c.x, y, c.z, "light_gray_concrete");
    }
    for (let s = 0; s <= 6; s++) {
      const y = 5 * s + 1;
      if (y < c.gr || y > 34) continue;
      if (c.x % 6 === 3 && c.z % 6 === 3) continue;
      if ((c.x * 5 + c.z * 3 + s) % 9 === 0) {
        g.set(c.x, y, c.z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  } else {
    for (let y = c.gr; y <= 34; y++) {
      const [id, props] = facade(c, y);
      g.set(c.x, y, c.z, id, props);
    }
    // Cornice band and roof edge, then parapet with a stone cap.
    g.set(c.x, ROOF, c.z, "smooth_stone");
    for (let y = ROOF + 1; y <= PARAPET_TOP; y++) g.set(c.x, y, c.z, "white_concrete");
    g.set(c.x, PARAPET_TOP + 1, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant room on the deck, centred in the footprint, with a louvred top.
const pcx = Math.round((W - 1) / 2), pcz = Math.round((D - 1) / 2);
for (const c of cells) {
  if (c.perim) continue;
  if (Math.abs(c.x - pcx) > 5 || Math.abs(c.z - pcz) > 4) continue;
  for (let y = 36; y <= 39; y++) g.set(c.x, y, c.z, "gray_concrete");
  g.set(c.x, 40, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

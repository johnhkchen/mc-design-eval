// 1900 K Street NW, Commercial-Office-Large: a 1970s-80s pale stone and glass office block on a granite plinth.
// Three massing tiers from the lidar roof heights: a core tower to 20 blocks (x 4..15, z 3..18), a 18-block podium
// around it, and a lower 15-block wing along the east edge. Storey lines sit at absolute heights (y 4, 7, 10 ...) so
// every column lines up, and each column stands on its own ground (foundation below y ground, plinth at ground).
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78621.cells.json`, "utf8"));
const W = 20, D = 23, H = 32;

const PANE = "light_blue_stained_glass_pane";
const FULL = new Set(["quartz_pillar", "smooth_quartz", "polished_andesite", "chiseled_quartz_block", "stone_bricks", "gray_concrete", "glowstone"]);

// Footprint: ground G and top layer T (the lidar roof height minus one), with the tiers cleaned up.
const foot = new Map();
const tier = (x, z) => {
  if (x >= 4 && x <= 15 && z >= 3 && z <= 18) return 20;   // core tower
  if (x === 19 && z >= 4 && z <= 21) return 15;           // lower east wing
  return 18;                                              // podium
};
for (const [x, z, g] of cells) foot.set(`${x},${z}`, { G: g, T: tier(x, z) - 1 });
const topOf = (x, z) => foot.get(`${x},${z}`)?.T ?? -1;
const openSide = (x, z, dx, dz) => topOf(x + dx, z + dz) < topOf(x, z);   // missing or lower neighbour: exposed
const faces = (x, z) => ({ fx: openSide(x, z, -1, 0) || openSide(x, z, 1, 0), fz: openSide(x, z, 0, -1) || openSide(x, z, 0, 1) });
const ringOf = (x, z) => { const f = faces(x, z); return f.fx || f.fz; };

const g = new Voxels([W, H, D]);
const panes = new Map();   // "x,y,z" -> the axis the pane runs along
const lamps = [];

for (const [key, { G, T }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const ring = ringOf(x, z), { fx, fz } = faces(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");                       // foundation under the plinth
  g.set(x, G, z, "polished_andesite");                                             // plinth course
  for (let y = G + 1; y <= T; y++) {
    const slab = y >= 4 && (y - 4) % 3 === 0;
    if (y === T) { g.set(x, y, z, ring ? "smooth_quartz" : "gray_concrete"); continue; }   // parapet ring, roof deck
    if (y === T - 1 && ring) { g.set(x, y, z, "chiseled_quartz_block"); continue; }      // cornice
    if (slab) { g.set(x, y, z, "smooth_quartz"); continue; }                              // floor slab per storey
    if (!ring) continue;                                                                  // interior air
    if (y <= 3) {                                                                         // ground floor: shopfront
      if (fx && fz) g.set(x, y, z, "polished_andesite");
      else if (fx) { if (z % 3 === 0) g.set(x, y, z, "polished_andesite"); else { g.set(x, y, z, PANE); panes.set(`${x},${y},${z}`, "z"); } }
      else if (x % 3 === 0) g.set(x, y, z, "polished_andesite");
      else { g.set(x, y, z, PANE); panes.set(`${x},${y},${z}`, "x"); }
      continue;
    }
    // upper storey windows: a mullion each third bay, pillars at the corners
    if (fx && fz) g.set(x, y, z, "quartz_pillar");
    else if (fx) { if (z % 3 === 0) g.set(x, y, z, "quartz_pillar"); else { g.set(x, y, z, PANE); panes.set(`${x},${y},${z}`, "z"); } }
    else if (x % 3 === 0) g.set(x, y, z, "quartz_pillar");
    else { g.set(x, y, z, PANE); panes.set(`${x},${y},${z}`, "x"); }
  }
}

// The main entrance: a double door on the north face (z 0) under a stone lintel, with a lobby lamp behind it.
for (const x of [7, 8]) {
  const hinge = x === 7 ? "left" : "right";
  g.set(x, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  g.set(x, 3, 0, "chiseled_quartz_block");
}

// Warm light: a lamp on the floor behind some windows (upper storeys: glowstone, ground floor: lanterns), never on a wall.
for (const [key, axis] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const ground = y <= 3;
  const bottomRow = ground ? y === foot.get(`${x},${z}`).G + 1 : (y - 4) % 3 === 2;   // the row above a storey slab
  if (!bottomRow || (x * 7 + z * 3 + y) % 4 !== 0) continue;
  // the inward neighbour: away from the exposed face
  const dx = axis === "x" ? (openSide(x, z, -1, 0) ? 1 : -1) : 0;
  const dz = axis === "z" ? (openSide(x, z, 0, -1) ? 1 : -1) : 0;
  const ix = x + dx, iz = z + dz;
  if (topOf(ix, iz) < y || ringOf(ix, iz)) continue;
  if (g.get(ix, y, iz)) continue;
  if (ground) lamps.push([ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" }]);
  else lamps.push([ix, y, iz, "glowstone"]);
}
for (const [x, y, z, b, s] of lamps) g.set(x, y, z, b, s);

// Roof plant: a stone-brick unit on the podium roof, east of the core.
for (let x = 16; x <= 17; x++) for (let z = 6; z <= 9; z++) if (topOf(x, z) === 17) g.set(x, 18, z, "stone_bricks");

// Panes connect in-plane to their neighbours (a pillar, a pane or a solid), so the glass reads as framed.
for (const [key, axis] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const side = (dx, dz) => { const b = g.get(x + dx, y, z + dz); return !!b && (b.block.endsWith("_pane") || FULL.has(b.block) || b.block.endsWith("_block")); };
  const state = axis === "z"
    ? { north: String(side(0, -1)), south: String(side(0, 1)), east: "false", west: "false" }
    : { north: "false", south: "false", east: String(side(1, 0)), west: String(side(-1, 0)) };
  g.set(x, y, z, PANE, { ...state, waterlogged: "false" });
}

console.log(g.save(`${DIR}/DC78621.nbt`));

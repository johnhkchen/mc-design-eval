// A two-storey red-brick commercial block of about 1920 (the Edwardian-Georgian shop-and-flat terrace of Eden Terrace and
// Newton): a stone plinth, a shopfront ground storey with a dark fascia, a first floor of sash-style windows with
// stone headers, a stone cornice and a brick parapet. The lidar's roof heights (9 to 11 blocks above y 0) are smoothed
// into three flat tiers; the south wing is the lower one. Walls are a one-block shell with an air gap behind the glass,
// and a solid floor slab at each storey line (y 4) and on the roof deck (y 8).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_162651881.cells.json`, "utf8"));   // [x, z, ground, roof]

const g = new Voxels([12, 24, 31]);
const F = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => F.has(`${x},${z}`);

// Lidar roof heights, averaged over a 5 x 5 patch of the footprint and clamped to three flat tiers (9, 10, 11 blocks)
const tierOf = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = F.get(`${x + dx},${z + dz}`); if (c) { s += c.roof; n++; } }
  return Math.min(11, Math.max(9, Math.round(s / n)));
};

const put = (x, y, z, [block, state]) => g.set(x, y, z, block, state);
const glassAcross = (ew) => (ew ? { north: "true", south: "true", east: "false", west: "false" }   // a pane along a W/E wall runs north-south
  : { north: "false", south: "false", east: "true", west: "true" });                          // a pane along a N/S wall runs east-west

// What a wall cell is at height y: the dressing of its face (u runs along the face: z on W/E, x on N/S)
const wallAt = (y, u, corner, ew) => {
  const pier = corner || u % 4 === 0;                        // brick or stone piers every 4 blocks, glass in the bays between
  const mullion = u % 4 === 2;                               // white timber frame between the two panes of each bay
  if (y === 3) return ["dark_oak_planks"];                   // shopfront fascia
  if (y <= 2) {                                              // shopfront: glass panes in dark frames, andesite piers
    if (pier) return ["polished_andesite"];
    return mullion ? ["white_concrete"] : ["glass_pane", glassAcross(ew)];
  }
  if (y === 7) return pier ? ["bricks"] : ["smooth_stone"];  // first-floor window headers in stone
  if (pier) return ["bricks"];
  return mullion ? ["white_concrete"] : ["glass_pane", glassAcross(ew)];
};

// The street is the west face; the door sits on the middle of it
const westOnly = [...F.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !inF(x - 1, z) && inF(x + 1, z) && inF(x, z - 1) && inF(x, z + 1));
const doorZ = westOnly.reduce((best, [, z]) => (Math.abs(z - 15) < Math.abs(best - 15) ? z : best), westOnly[0][1]);

for (const [key, { ground }] of F) {
  const [x, z] = key.split(",").map(Number);
  const T = tierOf(x, z);
  const faces = { W: !inF(x - 1, z), E: !inF(x + 1, z), N: !inF(x, z - 1), S: !inF(x, z + 1) };
  const names = Object.keys(faces).filter((f) => faces[f]);
  const edge = names.length > 0;
  const corner = names.length > 1;
  const f = names.includes("W") ? "W" : names[0];
  const ew = f === "W" || f === "E";
  const u = ew ? z : x;

  // foundation below the lowest ground, the plinth, and the floor slab and roof deck (solid across the footprint)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, 0, z, "stone_bricks");
  g.set(x, 4, z, "smooth_stone");
  g.set(x, 8, z, "smooth_stone");

  if (!edge) {
    // roof plant on the middle of the higher tiers; no interiors otherwise (air)
    if (T >= 10 && (x === 4 || x === 5) && z >= 9 && z <= 12) g.set(x, 9, z, "iron_block");
    continue;
  }

  // the street's middle bay carries the entrance: door at ground, its fascia above
  if (f === "W" && !corner && z === doorZ) {
    g.set(x, 1, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "dark_oak_planks");
  } else {
    for (const y of [1, 2, 3]) { const b = wallAt(y, u, corner, ew); g.set(x, y, z, b[0], b[1]); }
  }
  for (const y of [5, 6, 7]) { const b = wallAt(y, u, corner, ew); g.set(x, y, z, b[0], b[1]); }

  // cornice on the perimeter at y 8; brick parapet above it up to the tier's height, coped in stone
  for (let y = 9; y < T; y++) g.set(x, y, z, y === T - 1 ? "smooth_stone" : "bricks");

  // warm light behind some glass: glowstone at ground, shroomlight upstairs, on the inward side of the face
  const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] }[f];
  const [ix, iz] = [x + inward[0], z + inward[1]];
  const interiorCell = inF(ix, iz) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inF(ix + dx, iz + dz));
  if (!corner && interiorCell && u % 4 !== 0 && u % 4 !== 2) {   // a glass bay, not a pier or a mullion
    if (u % 8 === 1) g.set(ix, 2, iz, "glowstone");
    if (u % 8 === 5) g.set(ix, 6, iz, "shroomlight");
  }
}

const out = `${FILL}/way_162651881.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);

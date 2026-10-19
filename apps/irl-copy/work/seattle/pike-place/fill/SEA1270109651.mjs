// Pier 62 & 63 Park pavilion (Park, Public: Zoo/Arbor; 1901 Alaskan Way). One storey of red brick on a stone
// plinth, sandstone quoins and storey band, timber sash windows in brick piers, a flat built-up roof with a
// brick parapet and stone cap, a recessed timber entrance, a skylight, and a roof vent with a flue.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270109651.cells.json", "utf8"));   // [x, z, ground] per footprint cell, x 0..9, z 0..10

const g = new Voxels([10, 16, 11]);
const ground = new Map(cells.map(([x, z, gy]) => [`${x},${z}`, gy]));
const has = (x, z) => ground.has(`${x},${z}`);
const interior = (x, z) => has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);
const slab = { type: "bottom", waterlogged: "false" };
const lantern = (hanging) => ({ hanging: String(hanging), waterlogged: "false" });

// Entrance: door on the south wall, opening into an entrance hall lit by a hanging lantern.
const DOOR = "5,10", DOOR_HALL = "5,9", DOOR_CHEEK = "6,10";

for (const [x, z, gy] of cells) {
  const key = `${x},${z}`;
  const out = [!has(x, z - 1) && "N", !has(x, z + 1) && "S", !has(x - 1, z) && "W", !has(x + 1, z) && "E"].filter(Boolean);
  const boundary = out.length > 0;
  const corner = out.length >= 2;

  // Foundation under the cell up to its ground, then the floor slab at ground level.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gy, z, boundary ? "stone_bricks" : "smooth_stone");

  if (!boundary) {
    // Interior: air gap above the floor slab, roof field as the ceiling and roof deck.
    g.set(x, gy + 4, z, "stone");
    continue;
  }

  // Facade index along the wall: piers every fourth cell, timber sash in the bays between. The stepped footprint
  // makes most edge cells two-face corners, so only the piers are quoins; the bays still carry the windows.
  const along = out.includes("N") || out.includes("S") ? x : z;
  const pier = along % 4 === 0;
  const frame = along % 4 === 1 || along % 4 === 3;

  g.set(x, gy + 0, z, pier ? "stone_bricks" : "smooth_sandstone");                              // plinth and sills
  for (const k of [1, 2]) {
    if (pier) g.set(x, gy + k, z, corner ? "smooth_sandstone" : "bricks");
    else if (frame) g.set(x, gy + k, z, "white_terracotta");                                    // painted sash
    else g.set(x, gy + k, z, "glass_pane");
  }
  g.set(x, gy + 3, z, "smooth_sandstone");                                                      // storey band
  g.set(x, gy + 4, z, pier && corner ? "smooth_sandstone" : "bricks");                          // parapet
  g.set(x, gy + 5, z, "stone_brick_slab", slab);                                               // cap
}

// Entrance: door (two halves), a timber hood over it, brick cheek, and the lantern in the hall.
const [dx, dz] = DOOR.split(",").map(Number);
g.set(dx, ground.get(DOOR) + 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, ground.get(DOOR) + 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(dx, ground.get(DOOR) + 3, dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
const [cx, cz] = DOOR_CHEEK.split(",").map(Number);
g.set(cx, ground.get(DOOR_CHEEK) + 1, cz, "bricks");
g.set(cx, ground.get(DOOR_CHEEK) + 2, cz, "bricks");
g.set(cx, ground.get(DOOR_CHEEK) + 3, cz, "dark_oak_slab", { type: "top", waterlogged: "false" });
const [hx, hz] = DOOR_HALL.split(",").map(Number);
g.set(hx, ground.get(DOOR_HALL) + 3, hz, "lantern", lantern(true));

// Warm light behind some windows: glowstone or a standing lantern on the floor inside the glass.
for (const [x, z, gy] of cells) {
  const out = [!has(x, z - 1) && "N", !has(x, z + 1) && "S", !has(x - 1, z) && "W", !has(x + 1, z) && "E"].filter(Boolean);
  if (!out.length || out.length >= 2) continue;
  const along = out.includes("N") || out.includes("S") ? x : z;
  if (along % 4 !== 2 || `${x},${z}` === DOOR) continue;
  const [ix, iz] = out[0] === "N" ? [x, z + 1] : out[0] === "S" ? [x, z - 1] : out[0] === "W" ? [x + 1, z] : [x - 1, z];
  if (!interior(ix, iz)) continue;
  const ig = ground.get(`${ix},${iz}`);
  if ((x + z) % 4 === 0) g.set(ix, ig + 1, iz, "glowstone");
  else if ((x + z) % 4 === 2) g.set(ix, ig + 1, iz, "lantern", lantern(false));
}

// Roof: a skylight of glass with a dark-oak curb, and a plant unit with a brick flue at the back of the roof.
for (const [x, z] of [[4, 4], [5, 4], [4, 5], [5, 5]]) g.set(x, ground.get(`${x},${z}`) + 4, z, "glass");
for (const [x, z] of [[3, 4], [3, 5], [6, 4], [6, 5], [4, 3], [5, 3], [4, 6], [5, 6]]) {
  g.set(x, ground.get(`${x},${z}`) + 5, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, z] of [[7, 7], [8, 7]]) {
  const gy = ground.get(`${x},${z}`);
  g.set(x, gy + 5, z, "iron_block");
  g.set(x, gy + 6, z, "iron_bars");
}
const [fx, fz] = [2, 5], fg = ground.get(`${fx},${fz}`);
g.set(fx, fg + 5, fz, "bricks");
g.set(fx, fg + 6, fz, "bricks");
g.set(fx, fg + 7, fz, "stone_brick_slab", slab);

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270109651.nbt");
console.log(`SEA1270109651: ${stats.blocks} blocks, ${stats.palette} palette entries`);

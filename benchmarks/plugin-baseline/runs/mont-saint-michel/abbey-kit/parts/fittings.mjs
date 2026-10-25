// Part P5 "Windows, doors, cloister": glazing in the openings the shell left as air, the west door, the
// Merveille lancets, the logis mullions, the Belle Chaise lancets, the turret slits, and the cloister colonnade
// and garth. Every write goes only into air (a cell the shell filled is left alone).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { onFootprint } from "../vocab/base.mjs";
import { lancet, tracery_window, round_window, mullion_window, colonnade_bay } from "../vocab.mjs";

// Place a block only where the shell left air (undefined or "air" in the grid).
const isAir = (g, x, y, z) => { const b = g.get(x, y, z); return !b || b === "air" || b === "cave_air"; };
const put = (g, x, y, z, b, st) => {
  if (y > 151 || !onFootprint(x, z) || !isAir(g, x, y, z)) return false;
  if (st === undefined) g.set(x, y, z, b); else g.set(x, y, z, b, st);
  return true;
};

// A rectangle of gray glass in a wall opening: panes on the side columns, a stone_brick_wall mullion down the
// middle column (when the opening is three or more wide). axis "x" = the opening runs along x in a z wall.
function glazeRect(g, x0, x1, y0, y1, z0, z1) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    const mid = (x1 - x0) >= 2 && x > x0 && x < x1 && (z1 - z0) >= 0;
    put(g, x, y, z, mid ? "stone_brick_wall" : "gray_stained_glass_pane", mid ? undefined : {
      east: "true", west: "true", north: "true", south: "true", waterlogged: "false",
    });
  }
}

export function build(g) {
  // ---- nave: aisle tier (y 47..51) and clerestory (y 58..60), both sides, four bays x 18+8k ----
  for (let k = 0; k < 4; k++) {
    const x = 18 + 8 * k;
    tracery_window(g, x, 47, 52, "north");
    tracery_window(g, x, 47, 76, "south");
    // clerestory: three lancets (one per cell column) fill the 3 x 3 opening
    for (let i = 0; i < 3; i++) {
      lancet(g, x + i, 58, 58, "north", 3);
      lancet(g, x + i, 58, 70, "south", 3);
    }
  }

  // ---- west front: round-arched door (x 15, z 63..65), glazed window above ----
  g.set(15, 44, 64, ...B.door("dark_oak", "west", "lower", "left"));
  g.set(15, 45, 64, ...B.door("dark_oak", "west", "upper", "left"));
  glazeRect(g, 15, 15, 52, 58, 63, 65);

  // ---- south transept door, from the Grand Degré landing (x 62, z 83..84): faces east onto the stair ----
  g.set(62, 44, 83, ...B.door("dark_oak", "east", "lower", "left"));
  g.set(62, 45, 83, ...B.door("dark_oak", "east", "upper", "left"));
  put(g, 62, 44, 84, "stone_bricks");
  put(g, 62, 45, 84, "stone_bricks");
  glazeRect(g, 62, 62, 46, 47, 83, 84);

  // ---- logis terrace door onto SAUT-G (x 57, z 90..91): faces west ----
  g.set(57, 41, 90, ...B.door("dark_oak", "west", "lower", "left"));
  g.set(57, 42, 90, ...B.door("dark_oak", "west", "upper", "left"));
  put(g, 57, 41, 91, "stone_bricks");
  put(g, 57, 42, 91, "stone_bricks");
  glazeRect(g, 57, 57, 43, 43, 90, 91);

  // ---- Merveille north face (z 7): 1x4 lancets every 6 along the sheer wall ----
  for (let x = 66; x <= 102; x += 6) lancet(g, x, 14, 7, "north", 4);
  // MERV-W paired lancets 2 wide x 6 tall, storey 2
  for (const x of [66, 72, 78]) { lancet(g, x, 29, 7, "north", 6); lancet(g, x + 1, 29, 7, "north", 6); }
  // MERV-E single lancets 1 x 7, storey 2
  for (const x of [90, 96, 102]) lancet(g, x, 28, 7, "north", 7);
  // refectory slits 1 x 7, storey 3
  for (const x of [86, 90, 92, 96, 98, 102, 104]) lancet(g, x, 41, 7, "north", 7);
  // MERV-W cloister outer wall: small lancets 1 x 3
  for (const x of [66, 72, 78]) lancet(g, x, 43, 7, "north", 3);

  // ---- Belle Chaise: three tall pointed windows, 2 wide, y 30..35 (z 62, south face) ----
  for (const x of [105, 109, 113]) { lancet(g, x, 30, 62, "south", 6); lancet(g, x + 1, 30, 62, "south", 6); }

  // ---- Châtelet turret slits: 1 x 3 round-arched, y 20 and 26 ----
  for (const x of [118, 127]) for (const y of [20, 26]) round_window(g, x, y, 50, "south");

  // ---- logis south windows: mullioned 2 wide x 3 tall, 6 apart (see shell winS) ----
  const winS = (x0, x1, zf, floors, step = 6) => {
    for (let x = x0 + 3; x + 1 <= x1 - 1; x += step) for (const f of floors) mullion_window(g, x, f + 1, zf, "south");
  };
  winS(18, 47, 92, [44, 49]);
  winS(57, 71, 98, [31, 36, 41, 46]);
  winS(72, 86, 104, [26, 31, 36, 41]);
  winS(48, 68, 116, [26, 31, 36, 41]);

  // ---- cloister (garth x 64..76, z 15..25): stylobate ring y 40, double colonnade of quartz pillars y 41..44 ----
  // Outer row: x 62 and 78 (z 13..27 ends), z 13 and 27 (x 62..78). Inner row: x 63 / 77, z 14 / 26. Each run is
  // tiled in bays of 3 that share their end columns, so the pillars sit at every second coordinate.
  for (let x = 62; x <= 75; x += 2) {
    colonnade_bay(g, x, 40, 13, "x", 3, 4);
    colonnade_bay(g, x, 40, 27, "x", 3, 4);
  }
  for (let z = 13; z <= 25; z += 2) {
    colonnade_bay(g, 62, 40, z, "z", 3, 4);
    colonnade_bay(g, 78, 40, z, "z", 3, 4);
  }
  // garth: grass at the cloister floor (y 40) inside the ring
  for (let x = 64; x <= 76; x++) for (let z = 15; z <= 25; z++) put(g, x, 40, z, "grass_block");
}

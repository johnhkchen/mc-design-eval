import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001544";

// Cells: [x, z, ground, roof] per footprint cell (tolerate object form too)
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = (Array.isArray(raw) ? raw : raw.cells).map((c) =>
  Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]
);

const W = 10, H = 26, D = 20;
const g = new Voxels([W, H, D]);

// Materials: Federal / Greek Revival brick walk-up of 1832
const BRICK = "bricks";
const TRIM = "smooth_stone";
const FOUND = "stone_bricks";
const GLASS = "glass_pane";
const CANOPY = "dark_oak_planks";

const has = new Set(rows.map(([x, z]) => `${x},${z}`));

// Which exterior face a perimeter cell sits on (street = z 0)
function faceOf(x, z) {
  if (z === 0) return ["front", x];
  if (z === D - 1) return ["back", x];
  if (x === 0) return ["west", z];
  if (x === W - 1) return ["east", z];
  return null;
}

for (const [x, z, gr, rf] of rows) {
  const top = rf - 1;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const f = faceOf(x, z);

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;
    const r = rel % 3;             // position within storey (0 = floor/belt course)
    const k = Math.floor(rel / 3); // storey index

    // Ground-level base course and floor slab
    if (y === gr) { g.set(x, y, z, TRIM); continue; }

    if (!f) {
      // Interior: floor slabs per storey and roof cap only
      if ((r === 0 && y < top) || y === top) g.set(x, y, z, TRIM);
      continue;
    }

    // Perimeter: cornice and parapet
    if (y >= rf - 2) { g.set(x, y, z, TRIM); continue; }

    const [side, u] = f;
    const isFB = side === "front" || side === "back";
    const inZ = side === "front" ? z + 1 : side === "back" ? z - 1 : null;

    // Entrance canopy over the street door, with a lantern under it
    if (side === "front" && y === gr + 3 && u >= 3 && u <= 6) {
      g.set(x, y, z, CANOPY);
      if (has.has(`${x},${z + 1}`)) g.set(x, y, z + 1, CANOPY);
      continue;
    }
    if (side === "front" && y === gr + 2 && u === 4 && has.has(`${x},${z + 1}`)) {
      // lantern just inside the door, under the canopy: warm entrance light
      // (handled below on the interior cell)
    }

    let win = false;
    let door = false;
    if (isFB) {
      if (u % 3 !== 0 && r >= 1 && r <= 2 && y <= rf - 4) win = true;
      if (side === "front" && k === 0 && u === 4 && r >= 1 && r <= 2) door = true;
    } else {
      // Party-style side walls: sparse windows
      if (r >= 1 && r <= 2 && y <= rf - 4 && (u % 6 === 3 || u % 6 === 4)) win = true;
    }

    if (door) {
      const half = r === 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      // Lantern on the interior side of the door head, lighting the entrance
      if (r === 2 && inZ !== null && has.has(`${x},${inZ}`)) {
        g.set(x, y, inZ, "lantern", { hanging: "false", waterlogged: "false" });
      }
      continue;
    }

    if (win) {
      g.set(x, y, z, GLASS);
      // Warm light behind street and rear windows: ground floor and upper floors
      if (isFB && inZ !== null && has.has(`${x},${inZ}`)) {
        if (r === 1 && k === 0 && (u === 1 || u === 5 || u === 8)) {
          g.set(x, y, inZ, "glowstone");
        } else if (r === 1 && k >= 1 && u % 3 === 2) {
          g.set(x, y, inZ, "shroomlight");
        }
      }
      continue;
    }

    // Brick body with stone belt course at each storey line
    g.set(x, y, z, r === 0 ? TRIM : BRICK);
  }
}

g.save(`${DIR}/${ID}.nbt`);

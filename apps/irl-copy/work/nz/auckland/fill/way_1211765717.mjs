import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 1211765717, Mt Eden / Eden Terrace fringe: a two-storey Edwardian brick shop-house on a slope.
// Lidar roof heights are smoothed into three tiers (top 8 = two storeys + parapet, 6, 4). The street
// (shopfront) is the west face; the uphill east side carries the tall tier. Interior is solid except
// a one-cell air pocket behind each window, so glass and lights sit in a real gap and nothing hangs.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1211765717.cells.json`, "utf8"));

const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const has = (x, z) => at.has(`${x},${z}`);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));
const tierTop = (r) => (r >= 7 ? 8 : r === 6 ? 6 : 4);
const DOOR = [1, 4];                                  // west entrance, ground floor
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];

// glass rows on a single-face cell: the street (W) glazes its ground floor; upper windows on every other cell
const glassRows = (x, z, g, T, f) => {
  if (f.length !== 1) return [];
  const parity = (x + z) % 2 === 0, rows = [];
  if (f[0] === "W" || parity) rows.push(g + 1, g + 2);
  if (parity) rows.push(g + 5, g + 6);
  return rows.filter((y) => y < T - 1);
};

// air pockets behind the glass (the inward cell, if interior), each with a warm light on some
const pockets = new Map();                            // "x,y,z" -> block name or null
for (const [x, z, g, r] of cells) {
  const T = tierTop(r), f = exposed(x, z);
  if (f.length !== 1) continue;
  const [dx, dz] = DIRS[f[0]], ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || exposed(ix, iz).length) continue;
  const { g: gi, r: ri } = at.get(`${ix},${iz}`), Ti = tierTop(ri);
  for (const y of glassRows(x, z, g, T, f)) {
    if (y < gi || y >= Ti - 1) continue;
    const k = `${ix},${y},${iz}`, lit = (x * 2 + z + y) % 4;
    if (y === g + 1) pockets.set(k, lit === 0 ? "glowstone" : lit === 2 ? "lantern" : null);
    else pockets.set(k, pockets.get(k) ?? null);
  }
}

const g3 = new Voxels([6, 21, 8]);
const panes = [];
for (const [x, z, g, r] of cells) {
  const T = tierTop(r), f = exposed(x, z), shell = f.length > 0, corner = f.length > 1;
  const glass = new Set(glassRows(x, z, g, T, f));
  for (let y = 0; y < g; y++) g3.set(x, y, z, "cobblestone");     // foundation to lowest-ground-up
  for (let y = g; y < T; y++) {
    if (!shell) {                                                  // interior: solid floors and mass, air pockets
      if (!pockets.has(`${x},${y},${z}`)) g3.set(x, y, z, y === T - 1 ? "smooth_stone" : "bricks");
      continue;
    }
    if (isDoor(x, z) && y === g) g3.set(x, y, z, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
    else if (isDoor(x, z) && y === g + 1) g3.set(x, y, z, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    else if (y === g) g3.set(x, y, z, "stone_bricks");              // base course
    else if (y === T - 1) g3.set(x, y, z, "stone_bricks");          // cap course under the parapet
    else if (corner) g3.set(x, y, z, "smooth_quartz");              // quoins
    else if (glass.has(y) && f[0] === "W" && y <= g + 2) g3.set(x, y, z, "glass");   // shopfront
    else if (glass.has(y)) { g3.set(x, y, z, "glass_pane"); panes.push([x, y, z]); }
    else if (f[0] === "W" && y === g + 3) g3.set(x, y, z, "dark_oak_planks");        // shop fascia
    else if (y === g + 4) g3.set(x, y, z, "smooth_quartz");         // storey line
    else g3.set(x, y, z, "bricks");
  }
  if (shell) g3.set(x, T, z, "stone_brick_slab", { type: "bottom" }); // parapet coping
}
// the roof-top water tank (corrugated iron) on the two interior cells of the tall tier
for (const y of [8, 9]) for (const z of [3, 4]) g3.set(3, y, z, "iron_block");

// lights and panes last: a pane connects to whatever solid or pane is beside it in the built volume
for (const [k, block] of pockets) if (block) { const [x, y, z] = k.split(",").map(Number); g3.set(x, y, z, block, block === "lantern" ? { hanging: "false" } : undefined); }
for (const [x, y, z] of panes) {
  const st = Object.fromEntries(Object.entries(DIRS).map(([d, [dx, dz]]) => [{ W: "west", E: "east", N: "north", S: "south" }[d], g3.get(x + dx, y, z + dz) ? "true" : "false"]));
  g3.set(x, y, z, "glass_pane", st);
}

const out = `${DIR}/way_1211765717.nbt`;
console.log(g3.save(out));

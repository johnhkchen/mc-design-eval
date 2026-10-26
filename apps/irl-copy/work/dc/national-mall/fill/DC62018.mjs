// 1100 L St NW, Commercial-Office Large: a pale precast office block of the 1960s-70s on a granite base. The lidar
// gives a 19-block podium with a 21-block tower in its middle; the tower's outer ring steps down to the podium, so the
// upper block sets back. Storeys are 2 blocks (a glass row over a spandrel row), a 3-block shopfront on the ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC62018.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const g = new Voxels([25, 33, 27]);
const key = (x, z) => `${x},${z}`;
const NEI = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { g: ground, r: roof, T: 0 }]));
const at = (x, z) => cell.get(key(x, z));
// a column is solid from y 0 up to its top T (foundation below the cell's ground, then the body)
const present = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.T; };

// Tiers from the lidar: the north notch is a low pavilion (16); the wings stop at 19; the core (21) rises inside a
// ring that steps down to 19, so the tower sets back from its podium.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at(x, z);
  if (z === 0) c.T = 16;
  else if (c.r >= 21) c.T = NEI.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.r < 21; }) ? 19 : 21;
  else c.T = 19;
}

// Each body block: exposed faces get the facade (granite base, glass rows with frames, spandrels, cornice, parapet);
// interior blocks are floor slabs on even rows, and an air gap behind the glass on odd rows.
const panes = new Map();   // "x,y,z" -> { plane, inward } for the glass panes, joined to their neighbours below
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = at(x, z);
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { g.set(x, y, z, "polished_granite"); continue; }
    const exp = NEI.filter(([dx, dz]) => !present(x + dx, y, z + dz));
    if (y === c.T - 1) { g.set(x, y, z, exp.length ? "polished_granite" : "stone"); continue; }
    if (!exp.length) {
      if (y % 2 === 1 && y < c.T - 2) continue;   // air behind the glass (y 1 is the basement row on the downhill side)
      g.set(x, y, z, "light_gray_concrete"); continue;
    }
    const xFace = exp.some(([dx]) => dx !== 0), zFace = exp.some(([, dz]) => dz !== 0);
    if (y === 0 || y === 2) g.set(x, y, z, "polished_granite");
    else if (y === c.T - 2) g.set(x, y, z, "smooth_quartz");
    else if (xFace && zFace) g.set(x, y, z, "smooth_quartz");
    else if (y % 2 === 0) g.set(x, y, z, "white_concrete");
    else {
      const plane = xFace ? "x" : "z", col = xFace ? z : x;
      if (col % 3 === 0) g.set(x, y, z, "gray_concrete");
      else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
        const [dx, dz] = exp.find(([a, b]) => (plane === "x" ? a : b) !== 0);
        panes.set(`${x},${y},${z}`, { plane, inward: [-dx, -dz] });
      }
    }
  }
}

// Entrance on the south face: a pair of glass doors under a canopy in the shopfront band.
for (const x of [16, 17, 18, 19]) for (const z of [25, 26]) {
  g.set(x, 5, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  panes.delete(`${x},5,${z}`);
}
for (const [x, hinge] of [[17, "left"], [18, "right"]]) {
  const door = { facing: "south", hinge, open: "false", powered: "false" };
  g.set(x, 3, 26, "iron_door", { ...door, half: "lower" });
  g.set(x, 4, 26, "iron_door", { ...door, half: "upper" });
  panes.delete(`${x},3,26`);
}

// Glass panes connect to their in-plane neighbours (full blocks and other panes), as in the game.
const FULL = new Set(["white_concrete", "gray_concrete", "light_gray_concrete", "polished_granite", "smooth_quartz",
  "stone", "glowstone", "light_blue_stained_glass_pane"]);
const joins = (x, y, z) => { const b = g.get(x, y, z); return !!b && FULL.has(b.block.replace("minecraft:", "")); };
for (const [k, p] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const side = p.plane === "z"
    ? { north: false, south: false, east: joins(x + 1, y, z), west: joins(x - 1, y, z) }
    : { north: joins(x, y, z - 1), south: joins(x, y, z + 1), east: false, west: false };
  g.set(x, y, z, "light_blue_stained_glass_pane", Object.fromEntries(Object.entries(side).map(([s, v]) => [s, String(v)]).concat([["waterlogged", "false"]])));
}

// Warm light behind some windows: a hanging lantern under the slab above, or a glowstone in the air gap.
for (const [k, p] of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const X = x + p.inward[0], Z = z + p.inward[1];
  if (!present(X, y, Z) || g.get(X, y, Z)) continue;
  if ((x * 7 + y * 5 + z * 3) % (y === 3 ? 3 : 6) !== 0) continue;
  if (g.get(X, y + 1, Z)) g.set(X, y, Z, "lantern", { hanging: "true", waterlogged: "false" });
  else g.set(X, y, Z, "glowstone");
}

// Roof plant on the podium roofs: small boxes clear of the parapet.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (at(x, z).T !== 19 || x % 5 !== 2 || z % 4 !== 1) continue;
  if (NEI.some(([dx, dz]) => !present(x + dx, 18, z + dz))) continue;
  g.set(x, 19, z, "light_gray_concrete");
}

// Every block must be joined to the ground through the solid blocks, so nothing floats.
const solid = (x, y, z) => !!g.get(x, y, z);
const seen = new Set(), queue = [];
for (let x = 0; x < 25; x++) for (let z = 0; z < 27; z++) if (solid(x, 0, z)) { seen.add(`${x},0,${z}`); queue.push([x, 0, z]); }
while (queue.length) {
  const [x, y, z] = queue.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const n = [x + dx, y + dy, z + dz], k = n.join(",");
    if (n[1] < 0 || n[1] >= 33 || n[0] < 0 || n[0] >= 25 || n[2] < 0 || n[2] >= 27 || seen.has(k) || !solid(...n)) continue;
    seen.add(k); queue.push(n);
  }
}
let floating = 0;
for (let x = 0; x < 25; x++) for (let y = 0; y < 33; y++) for (let z = 0; z < 27; z++) if (solid(x, y, z) && !seen.has(`${x},${y},${z}`)) floating++;
console.log(`floating blocks: ${floating}; panes: ${panes.size}`);

const out = `${dir}/DC62018.nbt`;
console.log(g.save(out));

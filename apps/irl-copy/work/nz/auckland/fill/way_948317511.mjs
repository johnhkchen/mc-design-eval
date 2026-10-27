import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 948317511: a three-storey brick commercial block (interwar, plastered-stone bands, timber shopfront fascia) with
// a two-storey wing and a one-storey step at its west end, and a plant box on the roof. Lidar roofs (6-12, one stray 1)
// are quantised into storey tiers of 4 blocks: roof <= 6 is one storey (top 4), 7-9 two (top 8), 10-12 three (top 12).
// Each top carries a stone parapet course, so the tall core reads 13 blocks over the lowest ground.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317511.cells.json", "utf8"));
const g = new Voxels([24, 25, 14]);

const col = new Map();                                      // "x,z" -> { top, storeys }
for (const [x, z, , roof] of cells) {
  const r = roof < 5 ? 9 : roof;                            // the lone 1 at (23,9) is a lidar miss beside 9s
  const storeys = r <= 6 ? 1 : r <= 9 ? 2 : 3;
  col.set(`${x},${z}`, { top: 4 * storeys, storeys });
}
const C = (x, z) => col.get(`${x},${z}`);
const DIRS = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
const outward = (x, z) => Object.keys(DIRS).filter((d) => !C(x + DIRS[d][0], z + DIRS[d][1]));
const lowerBeside = (x, z, y) => Object.keys(DIRS).filter((d) => { const n = C(x + DIRS[d][0], z + DIRS[d][1]); return n && n.top <= y; });

// The door: the street face (north first) at the middle of its exposed run, on the ground storey.
const doorFace = ["north", "east", "south", "west"].find((d) =>
  [...col.keys()].some((k) => { const [x, z] = k.split(",").map(Number); return outward(x, z).length === 1 && outward(x, z)[0] === d; }));
const doorRun = [...col.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => outward(x, z).length === 1 && outward(x, z)[0] === doorFace).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const [dx0, dz0] = doorRun[Math.floor(doorRun.length / 2)];

const paneState = (d) => (d === "east" || d === "west")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// What stands at x, y, z: null is air. Floors and storey lines are full courses; facades carry piers, glazing, and bands.
function blockAt(x, y, z) {
  const c = C(x, z); if (!c) return null;
  const { top } = c; if (y > top) return null;
  const out = outward(x, z);
  if (y === 0) return ["stone_bricks"];                                    // plinth and floor, on the ground
  if (y === top) return out.length ? ["stone_bricks"] : ["smooth_stone"];  // parapet over the walls, deck inside
  if (y % 4 === 0) return ["smooth_stone"];                                // storey line / floor slab
  const step = lowerBeside(x, z, y);
  if (!out.length && !step.length) return null;                           // interior air
  if (!out.length) return ["bricks"];                                      // flank a taller tier shows above a lower roof
  const s = Math.floor(y / 4), within = y - 4 * s;
  const d = out[0], idx = d === "east" || d === "west" ? z : x;
  const pier = out.length >= 2 || idx % 3 === 0;
  if (within === 3) return [s === 0 ? "dark_oak_planks" : "stone_bricks"]; // shop fascia / lintel band
  if (pier) return [s === 0 ? "polished_andesite" : "bricks"];
  return ["glass_pane", paneState(d)];
}

// Walls and floors
for (const k of col.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= C(x, z).top; y++) {
    const b = blockAt(x, y, z); if (b) g.set(x, y, z, b[0], b[1]);
  }
}

// Door and its canopy: a dark timber hood on the fascia over the door, the door two blocks tall on the ground.
const hinge = "left";
g.set(dx0, 1, dz0, "dark_oak_door", { facing: doorFace, half: "lower", hinge, open: "false", powered: "false" });
g.set(dx0, 2, dz0, "dark_oak_door", { facing: doorFace, half: "upper", hinge, open: "false", powered: "false" });
g.set(dx0, 3, dz0, "dark_oak_slab", { type: "top", waterlogged: "false" });
for (const side of [-1, 1]) {
  const [ax, az] = doorFace === "north" || doorFace === "south" ? [dx0 + side, dz0] : [dx0, dz0 + side];
  if (C(ax, az) && outward(ax, az).includes(doorFace)) g.set(ax, 3, az, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// Warm light: lamps just inside some glazed bays (glowstone behind the glass), upper storeys and a few shop bays.
let lamps = 0;
for (const k of col.keys()) {
  const [x, z] = k.split(",").map(Number);
  const out = outward(x, z); if (out.length !== 1) continue;
  const d = out[0], idx = d === "east" || d === "west" ? z : x;
  for (let y = 1; y <= C(x, z).top; y++) {
    const within = y % 4; if (within === 0 || within === 3) continue;
    const b = blockAt(x, y, z); if (!b || b[0] !== "glass_pane") continue;
    if (idx % 6 !== 1 || (y >= 4 && (x + z + y) % 2)) continue;
    const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
    if (C(ix, iz) && blockAt(ix, y, iz) === null) { g.set(ix, y, iz, "glowstone"); lamps++; }
  }
}

// Roof plant: a 3 x 3 stone box on the core's roof, with a single stair-head block on top.
for (let x = 9; x <= 11; x++) for (let z = 5; z <= 7; z++) {
  const c = C(x, z); if (c && c.top === 12 && !outward(x, z).length) g.set(x, 13, z, "stone_bricks");
}
g.set(10, 14, 6, "smooth_stone");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317511.nbt");
console.log("saved", out, "lamps", lamps, "door", doorFace, dx0, dz0);

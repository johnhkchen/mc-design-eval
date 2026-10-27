// Way 332237120: a three-storey 1930s brick-and-render commercial block on a ragged footprint, Mt Eden / Eden Terrace
// edge. Brick walls with cream render sills, heads and parapet, a shopfront on the west street face, and a flat roof
// with a plant box. Every cell is a solid column from its ground up to its tier top, so nothing hangs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_332237120.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
// lidar roof heights smoothed into flat tiers: 3 storeys (top at 12), 2 storeys (8), 1 storey (4), plinth (2)
const tierOf = (r) => (r >= 11 ? 12 : r >= 7 ? 8 : r >= 3 ? 4 : 2);
const DIRS = [
  { n: "W", dx: -1, dz: 0, along: "z" },
  { n: "E", dx: 1, dz: 0, along: "z" },
  { n: "N", dx: 0, dz: -1, along: "x" },
  { n: "S", dx: 0, dz: 1, along: "x" },
];

const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r, t: tierOf(r) }]));
for (const c of raw.values()) {
  c.ex = DIRS.filter((d) => {
    const nb = raw.get(key(c.x + d.dx, c.z + d.dz));
    return !nb || nb.t < c.t;      // open to the street or stepping down to a lower tier
  });
}
for (const c of raw.values()) if (c.t <= c.g) throw new Error(`tier ${c.t} not above ground ${c.g} at ${c.x},${c.z}`);

// the street-front entrance: the west face cell at z 10
const ENTRY = { x: 0, z: 10 };

const g = new Voxels([19, 25, 18]);
const litCount = { n: 0 };

for (const c of raw.values()) {
  const { x, z, g: ground, t, ex } = c;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");          // foundation: solid under the ground
  if (ex.length === 0) {                                                    // interior: floors and roof only, air between
    g.set(x, ground, z, "smooth_stone");
    for (const fl of [4, 8]) if (fl > ground && fl < t) g.set(x, fl, z, "smooth_stone");
    g.set(x, t, z, "smooth_stone");                                         // roof deck
    continue;
  }
  // a true convex corner: open to the street on both axes (step cells of the ragged footprint are plain brick)
  const open = (d) => !raw.get(key(x + d.dx, z + d.dz));
  const corner = ex.some((d) => d.along === "z" && open(d)) && ex.some((d) => d.along === "x" && open(d));
  const face = ex.find((d) => d.along === "z") ?? ex[0];                    // first street face; along = its running axis
  const along = face.along === "z" ? z : x;
  const pier = corner || along % 3 === 0;
  for (let y = ground; y < t; y++) {
    if (corner) { g.set(x, y, z, "polished_andesite"); continue; }
    if (pier) { g.set(x, y, z, "bricks"); continue; }
    // window bay: ground-floor shopfront glass, upper storeys framed by cream sill (4, 8), head (7, 11) and glass between
    if (y === 3 || y === 4 || y === 7 || y === 8 || y === 11) { g.set(x, y, z, "white_concrete"); continue; }
    if (y <= 2) { g.set(x, y, z, "glass"); continue; }
    const conn = face.along === "z" ? { north: "true", south: "true", east: "false", west: "false" }
                                    : { north: "false", south: "false", east: "true", west: "true" };
    g.set(x, y, z, "glass_pane", { waterlogged: "false", ...conn });
  }
  g.set(x, t, z, "white_concrete");                                          // parapet cap on the open edge
}

// the entrance: a two-high door on the west face, a hanging lantern on the cream lintel over it
{
  const e = raw.get(key(ENTRY.x, ENTRY.z));
  if (!e || e.ex.length === 0 || e.g !== 1) throw new Error("entrance cell not on the open west face");
  const base = { facing: "west", hinge: "left", open: "false", powered: "false" };
  g.set(ENTRY.x, 1, ENTRY.z, "dark_oak_door", { ...base, half: "lower" });
  g.set(ENTRY.x, 2, ENTRY.z, "dark_oak_door", { ...base, half: "upper" });
  g.set(ENTRY.x, 3, ENTRY.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// warm light behind some upper-storey windows: a glowstone just inside the glass on the open faces
for (const c of raw.values()) {
  if (c.ex.length !== 1) continue;
  const face = c.ex[0];
  const along = face.along === "z" ? c.z : c.x;
  if (along % 3 === 0) continue;
  for (const y of [5, 9]) {
    if (y >= c.t || (along + (y === 9 ? 1 : 0)) % 3 !== 1) continue;
    const inw = raw.get(key(c.x - face.dx, c.z - face.dz));
    if (!inw || inw.ex.length !== 0 || inw.t <= y || y === inw.g) continue;
    g.set(inw.x, y, inw.z, "glowstone");
    litCount.n++;
  }
}

// roof plant: a box on the core roof, placed only where all four sides are the 3-storey interior
for (let z = 7; z <= 9; z++) for (let x = 7; x <= 10; x++) {
  const c = raw.get(key(x, z));
  if (!c || c.t !== 12 || c.ex.length) continue;
  g.set(x, 13, z, "light_gray_concrete");
  g.set(x, 14, z, "light_gray_concrete");
}

const out = `${dir}/way_332237120.nbt`;
const info = g.save(out);
console.log(`way_332237120: ${info.blocks} blocks, palette ${info.palette}, lit windows ${litCount.n} -> ${out}`);

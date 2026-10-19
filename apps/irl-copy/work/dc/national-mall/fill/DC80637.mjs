// DC80637: Public Service office at 422 8th St NW, Washington DC 20004, as a 1.21.1 module.
// The lidar reads a two-storey block (roof 6-7 above y 0) with a one-cell-thick screen rising to 16 along its
// z = 0 and x = 0 edges. Roof heights snap to two tiers, 8 and 16, so the bulk is brick with pale limestone
// string courses and a cornice, and the screen is a four-storey street front with a pinnacled crown. Columns
// are solid from y 0 up to their ground and from there up to their roof; interiors are an air gap behind the
// glass with a floor slab per storey, and lit windows carry a lamp just inside.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80637.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC80637.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
// Outward faces of a footprint cell: the sides whose neighbour lies outside the footprint.
const SIDES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const outward = (x, z) => Object.keys(SIDES).filter((d) => !inF(x + SIDES[d][0], z + SIDES[d][1]));

const BRICK = "bricks";
const STONE = "stone_bricks";        // plinth, foundations
const LIME = "calcite";              // pale limestone: quoins, string courses, cornice, lintels, pilasters
const SLAB = "smooth_stone";         // interior floor slabs and roof decks
const CROWN = "stone_brick_slab";
const DOOR = "dark_oak_door";

// Roof tiers: the screen (z = 0 row or lidar >= 14) is 16 tall, everything else 8.
const roofTop = (c) => (c.z === 0 || c.r >= 14 ? 16 : 8) - 1;

const g = new Voxels([14, 28, 23]);
const shell = new Set();
for (const c of F.values()) if (outward(c.x, c.z).length) shell.add(key(c.x, c.z));
const isShell = (x, z) => shell.has(key(x, z));

for (const c of F.values()) {
  const { x, z } = c;
  const B = c.g;                                             // first wall row: the ground under this cell
  const top = roofTop(c);
  const strings = [B + 3, B + 7, B + 11].filter((y) => y < top);   // storey lines, every 4 rows
  for (let y = 0; y < B; y++) g.set(x, y, z, STONE);         // foundation under the sloped ground

  const out = outward(x, z);
  if (!out.length) {                                         // interior: floor slabs and roof deck, air between
    for (let y = B; y <= top; y++) if (y === B || y === top || strings.includes(y)) g.set(x, y, z, SLAB);
    continue;
  }

  const corner = out.length > 1;
  const face = out[0];
  const along = face === "N" || face === "S" ? x : z;        // position along the facade
  const last = face === "N" || face === "S" ? 13 : 22;
  const pier = along === 0 || along === last || along % 2 === 0;
  const entrance = z === 0 && x >= 5 && x <= 8;              // north entrance bay, doors at x 6 and 7
  const firstRow = (y) => y === B + 1 || strings.some((s) => y === s + 1);

  for (let y = B; y <= top; y++) {
    if (entrance && y <= B + 2) {
      if (x === 6 || x === 7) {
        if (y <= B + 1) g.set(x, y, z, DOOR, { facing: "south", half: y === B ? "lower" : "upper", hinge: x === 6 ? "left" : "right", open: "false", powered: "false" });
        else g.set(x, y, z, LIME);                           // lintel over the doors
      } else g.set(x, y, z, LIME);                           // pilasters either side
      continue;
    }
    if (y === B) { g.set(x, y, z, STONE); continue; }        // base course
    if (y === top || strings.includes(y) || corner) { g.set(x, y, z, LIME); continue; }
    if (pier) { g.set(x, y, z, BRICK); continue; }
    g.set(x, y, z, "glass_pane");                            // window bay
    // A lamp just inside every few windows, on the floor slab under the storey's first window row.
    const [dx, dz] = INWARD[face];
    if (firstRow(y) && (x * 5 + z * 3 + y) % 4 === 0 && !isShell(x + dx, z + dz) && inF(x + dx, z + dz)) {
      g.set(x + dx, y, z + dz, y === B + 1 ? "glowstone" : "lantern", y === B + 1 ? undefined : { hanging: "false", waterlogged: "false" });
    }
  }
}

// Roof plant on the two-storey bulk: two light grey boxes standing on the roof deck.
for (const [x0, z0] of [[3, 4], [9, 14]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  g.set(x0 + dx, 8, z0 + dz, "light_gray_concrete");
  g.set(x0 + dx, 9, z0 + dz, "light_gray_concrete");
}

// The screen's crown: a bottom stone slab course on every screen cell, with a calcite pinnacle and a lantern
// on every fourth cell.
for (const c of F.values()) {
  const { x, z } = c;
  if (!(z === 0 || x === 0) || roofTop(c) !== 15) continue;   // the screen only
  if ((z === 0 && x % 4 === 0) || (x === 0 && z % 4 === 0)) {
    g.set(x, 16, z, LIME);
    g.set(x, 17, z, "lantern", { hanging: "false", waterlogged: "false" });
  } else g.set(x, 16, z, CROWN, { type: "bottom", waterlogged: "false" });
}

// Glass panes join the neighbours in their wall line (the glass or stone beside them), like a built window.
for (let z = 0; z < 23; z++) for (let y = 0; y < 28; y++) for (let x = 0; x < 14; x++) {
  const b = g.get(x, y, z);
  if (!b || b.block !== "minecraft:glass_pane") continue;
  const ew = z === 0 || z === 22;                            // on a north or south wall: joins east and west
  const joins = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  g.set(x, y, z, "glass_pane", {
    north: String(!ew && joins(0, -1)), south: String(!ew && joins(0, 1)),
    east: String(ew && joins(1, 0)), west: String(ew && joins(-1, 0)), waterlogged: "false",
  });
}

const res = g.save(OUT);
console.log(`DC80637: ${res.blocks} blocks, ${res.palette} palette entries -> ${OUT}`);

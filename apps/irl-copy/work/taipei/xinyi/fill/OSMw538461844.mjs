import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461844";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 39;
const g = new Voxels([W, H, D]);

// Two-storey low-rise commercial block, reinforced concrete frame with
// light-grey piers, aluminium-look glazing, a shopfront at street level,
// a red fascia on the main frontage and a plain parapet roof with plant.
const SL = 5;    // storey line (floor of storey 2)
const TOP = 11;  // roof slab level (lowest ground = 0)
const PIER = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "glass_pane";
const FASCIA = "red_concrete";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const FACES = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
];
const faces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

// Main frontage = outward face with the most exposed cells
const counts = {};
for (const [x, z] of cells) for (const f of faces(x, z)) counts[f.name] = (counts[f.name] ?? 0) + 1;
const mainName = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "south";
const mainF = FACES.find((f) => f.name === mainName);
const tOf = (f, x, z) => (f.axis === "x" ? x : z);

// Entrance: middle of the main frontage
const mainCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => faces(x, z).some((f) => f.name === mainName))
  .sort((a, b) => tOf(mainF, a[0], a[1]) - tOf(mainF, b[0], b[1]));
const doorCell = mainCells.length ? mainCells[Math.floor(mainCells.length / 2)] : null;

// Pane connection props so glazing reads as a continuous curtain wall
const paneProps = (f) =>
  f.axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const interiorLights = []; // [x, z] of interior cells behind upper windows

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const fl = faces(x, z);
  const edge = fl.length > 0;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab (base course on the edge)
  g.set(x, gr, z, edge ? "stone_bricks" : "light_gray_concrete");

  // Floor slab of storey 2 and roof slab, where they lie above ground
  if (SL > gr) g.set(x, SL, z, edge ? "smooth_stone" : "light_gray_concrete");
  if (TOP > gr) g.set(x, TOP, z, edge ? "smooth_stone" : "gray_concrete");

  if (!edge) continue;

  // Facade reference face: main frontage if this cell touches it, else first exposed face
  const f = fl.find((ff) => ff.name === mainName) ?? fl[0];
  const t = tOf(f, x, z);
  const corner = fl.length > 1;
  const pier = corner || t % 3 === 0;

  for (let y = gr + 1; y < TOP; y++) {
    if (y === SL) continue; // floor line already set

    const isGround = y < SL;
    const lintelRow = isGround ? y === SL - 1 : y === TOP - 1;
    const windowRow = isGround
      ? y >= gr + 1 && y <= SL - 2
      : y >= SL + 1 && y <= TOP - 2;

    if (lintelRow) {
      const band = isGround && f.name === mainName ? FASCIA : PIER;
      g.set(x, y, z, band);
    } else if (pier || !windowRow) {
      g.set(x, y, z, PIER);
    } else if (isGround) {
      g.set(x, y, z, SHOP, paneProps(f));
    } else {
      g.set(x, y, z, GLASS, paneProps(f));
      // warm light behind some upper windows
      if (y === SL + 2 && t % 6 === 1) interiorLights.push([x - f.dx, z - f.dz]);
    }
  }

  // Parapet on the edge above the cornice
  if (TOP + 1 < H) g.set(x, TOP + 1, z, PIER);
}

// Entrance door on the main frontage, centred, with a clear head height
if (doorCell && SL - 1 > 0) {
  const [dx, dz] = doorCell;
  const gr = Math.round(ground.get(key(dx, dz)));
  const props = { facing: mainName, hinge: "left", open: "false", powered: "false" };
  if (SL - 1 > gr + 2) {
    g.set(dx, gr + 1, dz, "dark_oak_door", { ...props, half: "lower" });
    g.set(dx, gr + 2, dz, "dark_oak_door", { ...props, half: "upper" });
  }
}

// Warm glowstone in the room behind selected upper windows (interior cells only)
for (const [ix, iz] of interiorLights) {
  if (!has(ix, iz)) continue;
  if (faces(ix, iz).length) continue;
  const gr = Math.round(ground.get(key(ix, iz)));
  if (gr >= SL + 2) continue;
  g.set(ix, SL + 2, iz, "glowstone");
}

// Roof plant: a small block of rooftop units in the middle of the roof
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), minZ = Math.min(...zs);
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  if (gr >= TOP) continue;
  if (faces(x, z).length) continue;
  const inBox = x >= minX + 3 && x <= minX + 8 && z >= minZ + 10 && z <= minZ + 16;
  if (!inBox) continue;
  g.set(x, TOP + 1, z, "white_concrete");
  if (TOP + 2 < H) g.set(x, TOP + 2, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

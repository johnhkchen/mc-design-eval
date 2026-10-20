import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Xinyi-style commercial block (~11 blocks / 2 storeys to roof).
// Smooth quartz facade on a stone-brick base, cornice, flat roof with plant box,
// cyan shopfront at street level, light glass above, red entrance lintel, warm glowstone behind some upper windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540295088";
const W = 20, H = 23, D = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// facing name -> outward offset (north = -z, as in Minecraft)
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) =>
  Object.keys(OUT).filter((f) => {
    const [dx, dz] = OUT[f];
    return !has(x + dx, z + dz);
  });

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: middle of the north (min-z) street face
const northCells = cells
  .filter(([x, z]) => outward(x, z).includes("north"))
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

const glassProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

for (const [x, z, gy] of cells) {
  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone");

  const faces = outward(x, z);

  // Interior cell: floors and flat roof only
  if (faces.length === 0) {
    put(x, gy, z, "smooth_stone");          // ground floor slab
    put(x, gy + 5, z, "smooth_stone");      // upper floor slab
    put(x, gy + 10, z, "light_gray_concrete"); // roof
    // Rooftop plant box near centre
    if (x >= 8 && x <= 11 && z >= 11 && z <= 14) put(x, gy + 11, z, "iron_block");
    continue;
  }

  const corner = faces.length >= 2;
  const face = faces[0];
  const along = face === "north" || face === "south" ? x : z;
  const pillar = corner || along % 3 === 0;
  const isDoor = `${x},${z}` === doorKey;
  const gp = corner ? undefined : glassProps(face);

  // Base course
  put(x, gy, z, "stone_bricks");

  // Ground floor: shopfront
  for (let y = gy + 1; y <= gy + 3; y++) {
    if (isDoor) {
      if (y === gy + 1) put(x, y, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gy + 2) put(x, y, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "smooth_quartz");
    } else if (pillar) {
      put(x, y, z, "smooth_quartz");
    } else {
      put(x, y, z, "cyan_stained_glass_pane", gp);
    }
  }

  // Lintel over ground floor (red entrance band over the door)
  put(x, gy + 4, z, isDoor ? "red_concrete" : "smooth_quartz");

  // Second floor windows
  for (let y = gy + 6; y <= gy + 8; y++) {
    if (pillar) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "light_gray_stained_glass_pane", gp);
  }

  // Sill and head bands
  put(x, gy + 5, z, "smooth_quartz");
  put(x, gy + 9, z, "smooth_quartz");

  // Warm light behind selected upper windows
  if (!corner && !pillar && along % 6 === 4) {
    const [dx, dz] = OUT[face];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && outward(ix, iz).length === 0) put(ix, gy + 7, iz, "glowstone");
  }

  // Cornice = parapet top
  put(x, gy + 10, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);

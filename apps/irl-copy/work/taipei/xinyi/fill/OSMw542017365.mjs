import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542017365";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 11, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Two-storey 1970s-80s Taipei commercial block: white concrete facade,
// quartz piers, stone-brick base, glass windows, red sign band on the ground floor,
// flat roof with a stone parapet and a small mechanical box.
const ROOF = 10;      // roof deck layer; roof surface ~11 blocks above lowest ground
const PARAPET = 11;
const STOREYS = [5, 10];

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // floor decks: ground slab, then storey lines, roof deck last
  const decks = [gr, ...STOREYS.filter((l) => l > gr)];
  for (const d of decks) g.set(x, d, z, "smooth_stone");

  const exp = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (exp.length === 0) continue; // interior cell: decks only

  const corner = exp.length > 1;
  const [ex, ez] = exp[0];
  const u = ez !== 0 ? x : z; // position along the exposed face
  const pier = corner || u % 3 === 0;

  // storeys between consecutive decks
  for (let i = 0; i < decks.length - 1; i++) {
    const d = decks[i];
    const n = decks[i + 1];
    const isGround = i === 0;
    for (let y = d + 1; y < n; y++) {
      let b;
      if (pier) b = "smooth_quartz";
      else if (y === n - 1) b = isGround ? "stone_bricks" : "light_gray_concrete";
      else if (isGround && y === n - 2) b = "red_concrete";
      else b = "glass_pane";
      g.set(x, y, z, b);
    }
    // warm light behind some windows, in the room cell just inside the facade
    if (!pier) {
      const ix = x - ex, iz = z - ez;
      if (has(ix, iz) && !isEdge(ix, iz)) {
        const ly = isGround ? d + 1 : d + 2;
        if ((u + i) % 3 === 1) g.set(ix, ly, iz, "glowstone");
      }
    }
  }

  // parapet on the exposed roof edge
  g.set(x, PARAPET, z, "stone_bricks");
}

// Ground-floor entrance on the south (z = max) face, centred
const dc = ground.get("5,15");
if (dc !== undefined) {
  g.set(5, dc + 1, 15, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  g.set(5, dc + 2, 15, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
}

// Roof mechanical box, set back from the parapet
for (let x = 4; x <= 6; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!has(x, z)) continue;
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);

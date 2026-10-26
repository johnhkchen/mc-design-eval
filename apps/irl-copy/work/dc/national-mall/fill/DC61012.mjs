import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61012.cells.json`, "utf8"));

const W = 11, H = 25, D = 15;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const cellSet = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => cellSet.has(key(x, z));

// Hero roof height = tallest lidar roof; cells within 2 blocks of it snap to it
// (flat tiers), lower wings keep their own rounded height.
const R = Math.max(...cells.map(c => Math.round(c[3])));
const xs = cells.map(c => c[0]);
const zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs);
const midX = (minX + maxX) / 2;

// outward faces of a footprint cell (a face exists where the neighbour is missing)
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const inward = {
  north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
};

const info = new Map();
for (const [x, z, ground, roof] of cells) {
  const gr = Math.max(0, Math.round(ground));
  let top = roof >= R - 2 ? R : Math.round(roof);
  if (top < gr + 6) top = gr + 6;
  info.set(key(x, z), { x, z, gr, top, f: faces(x, z) });
}

// ---- main massing and facade ------------------------------------------------
for (const c of info.values()) {
  const { x, z, gr, top, f } = c;
  const perim = f.length > 0;
  const corner = f.length >= 2;

  // foundation fill from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const off = (y - gr) % 4;
    const k = Math.floor((y - gr) / 4);

    if (y === top - 1) {
      // parapet course on the perimeter; interior above the roof deck is open air
      if (perim) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === top - 2 && !perim) {
      // tar-grey roof deck, one block below the parapet
      g.set(x, y, z, "gray_concrete");
      continue;
    }
    if (y === gr) {
      // base course on the perimeter, ground-floor slab inside
      g.set(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!perim) {
      // interior: only the storey slabs, the rest is air
      if (off === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // perimeter wall
    const face = f[0];
    const u = (face === "north" || face === "south") ? x : z;
    const bay = ((u % 3) + 3) % 3;
    const pilaster = corner || bay === 0;

    if (pilaster) {
      g.set(x, y, z, "smooth_quartz");
    } else if (off === 0) {
      g.set(x, y, z, "calcite");           // floor line spandrel
    } else if (off === 1 || off === 2) {
      const props = (face === "north" || face === "south")
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "light_blue_stained_glass_pane", props);

      // some windows lit: glowstone behind the glass in the interior cell
      if (off === 1 && (u + k) % 4 === 1) {
        const [dx, dz] = inward[face];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && faces(ix, iz).length === 0) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    } else {
      g.set(x, y, z, "calcite");           // head spandrel
    }
  }
}

// ---- entrance on the street (north) face, centred -----------------------------
let doorCell = null;
for (const c of info.values()) {
  if (c.z === minZ && c.f.length === 1 && c.f[0] === "north") {
    if (!doorCell || Math.abs(c.x - midX) < Math.abs(doorCell.x - midX)) doorCell = c;
  }
}
if (doorCell) {
  const { x, z, gr } = doorCell;
  g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // hanging lantern over the door, hung from the head spandrel
  g.set(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  // a shallow stone surround framing the door
  if (has(x - 1, z)) g.set(x - 1, gr + 2, z, "chiseled_stone_bricks");
  if (has(x + 1, z)) g.set(x + 1, gr + 2, z, "chiseled_stone_bricks");
}

// ---- roof equipment: mechanical penthouse standing on the roof deck -----------
for (const c of info.values()) {
  const { x, z, top, f } = c;
  if (f.length === 0 && x >= 3 && x <= 7 && z >= 4 && z <= 10) {
    // plant ring sits on the deck (top-2) and rises to the parapet line
    g.set(x, top - 1, z, "light_gray_concrete");
    if (x >= 4 && x <= 6 && z >= 5 && z <= 9 && top < H) {
      g.set(x, top, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/DC61012.nbt`);

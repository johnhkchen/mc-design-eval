import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542009195";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 16, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const GLASS_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [cx, cz, cgr] of cells) {
  const x = cx, z = cz, gr = Math.round(cgr);
  const top = Math.min(H - 1, gr + 11);

  // Foundation: solid from y 0 up to and including the cell's ground.
  for (let y = 0; y <= gr && y < H; y++) {
    put(x, y, z, y < gr ? "stone" : "smooth_stone");
  }

  // Exposed faces (neighbour not in footprint).
  const exposed = [];
  if (!inside.has(key(x, z - 1))) exposed.push("N");
  if (!inside.has(key(x, z + 1))) exposed.push("S");
  if (!inside.has(key(x - 1, z))) exposed.push("W");
  if (!inside.has(key(x + 1, z))) exposed.push("E");

  if (exposed.length === 0) {
    // Interior cell: floor slabs, roof deck, a few lamps. No walls.
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    if ((x * 5 + z * 3) % 11 === 0 && gr + 7 <= top) put(x, gr + 7, z, "glowstone");
    // Roof equipment on the deck, inside the footprint.
    if (x >= 4 && x <= 11 && (x + z) % 5 === 0 && gr + 11 <= top) {
      put(x, gr + 11, z, "gray_concrete");
    }
    continue;
  }

  // Corner cells: solid piers, with the same storey lines and parapet.
  if (exposed.length >= 2) {
    for (let y = gr + 1; y <= top; y++) {
      let b = "white_concrete";
      if (y === gr + 1) b = "light_gray_concrete";
      if (y === gr + 5 || y === gr + 10 || y === gr + 11) b = "smooth_quartz";
      put(x, y, z, b);
    }
    continue;
  }

  // Single-face wall cell.
  const f = exposed[0];
  const alongNS = f === "N" || f === "S";
  const idx = alongNS ? x : z;
  const winCol = idx % 3 === 1;
  const isEntrance = f === "N" && x === 7;
  const glassProps = alongNS ? GLASS_NS : GLASS_EW;

  // Inward neighbour for placing lamps behind glass.
  const inward = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[f];
  const inwardInside = inside.has(key(inward[0], inward[1]));

  for (let y = gr + 1; y <= top; y++) {
    const rel = y - gr;
    let b = "white_concrete", p = null;

    if (rel === 1) b = "light_gray_concrete";              // base course
    if (rel === 5 || rel === 10 || rel === 11) b = "smooth_quartz"; // storey line, cornice, parapet cap

    if (isEntrance && rel === 1) {
      put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntrance && rel === 2) {
      put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntrance && (rel === 3 || rel === 4)) {
      put(x, y, z, "light_blue_stained_glass_pane", glassProps);
      continue;
    }

    if (winCol && rel >= 2 && rel <= 4) {
      // Shopfront glazing with a lintel at rel 5.
      put(x, y, z, "light_blue_stained_glass_pane", glassProps);
      continue;
    }
    if (winCol && rel >= 6 && rel <= 9) {
      put(x, y, z, "light_blue_stained_glass_pane", glassProps);
      if (rel === 7 && inwardInside && idx % 6 === 1) {
        put(inward[0], y, inward[1], "glowstone");
      }
      continue;
    }

    put(x, y, z, b, p);
  }

  // Cornice band already covered above; roof deck sits at rel 10 on interior cells.
}

g.save(`${dir}/${id}.nbt`);

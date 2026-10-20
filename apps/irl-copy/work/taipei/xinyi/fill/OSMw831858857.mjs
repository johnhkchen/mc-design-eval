import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831858857";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 24 x 16 footprint, roof about 11 blocks above lowest ground:
// a two-storey (5 block storeys) commercial block with a parapet, c. 1990s-2000s
// Taipei street frontage: white tiled/concrete facade, quartz mullions, glass shopfront.
const W = 24, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// outward faces of a footprint cell
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// pick the front door: middle of the south-facing plain (non-corner) edge cells
const southEdge = cells
  .filter(([x, z]) => { const f = faces(x, z); return f.length === 1 && f[0] === "south"; })
  .sort((a, b) => a[0] - b[0]);
let door = null;
if (southEdge.length) door = southEdge[Math.floor(southEdge.length / 2)];
else {
  const any = cells.filter(([x, z]) => faces(x, z).length === 1);
  if (any.length) door = any[Math.floor(any.length / 2)];
}
const doorKey = door ? `${door[0]},${door[1]}` : null;
const doorFacing = door ? faces(door[0], door[1])[0] : null;

for (const [x, z, G] of cells) {
  const f = faces(x, z);
  const edge = f.length > 0;
  const corner = f.length >= 2;
  const ns = f.includes("north") || f.includes("south");
  const pos = ns ? x : z; // position along the facade for the window rhythm
  const pane = ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // foundation and base course
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, edge ? "polished_andesite" : "light_gray_concrete");

  // storey floor slabs and roof slab, with cornice bands on the facade
  put(x, G + 5, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, G + 10, z, edge ? "smooth_quartz" : "light_gray_concrete");

  if (!edge) {
    // roof plant box in the middle of the roof, interior cells only
    if (x >= 9 && x <= 14 && z >= 5 && z <= 10) {
      put(x, G + 11, z, "gray_concrete");
      if (x >= 11 && x <= 12 && z >= 7 && z <= 8) put(x, G + 12, z, "gray_concrete");
    }
    continue;
  }

  // parapet
  put(x, G + 11, z, "smooth_quartz");

  // walls: groundfloor shopfront (y G+1..G+4) and upper storey (y G+6..G+9)
  const storeys = [
    { ground: true, rows: [G + 1, G + 2, G + 3, G + 4] },
    { ground: false, rows: [G + 6, G + 7, G + 8, G + 9] },
  ];
  for (const s of storeys) {
    for (let i = 0; i < s.rows.length; i++) {
      const y = s.rows[i];
      if (corner) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
      const mullion = pos % 3 === 0;
      if (mullion) { put(x, y, z, "smooth_quartz"); continue; }
      if (s.ground) {
        // shopfront: glass to the lintel, solid lintel on top row
        if (i === 3) put(x, y, z, "white_concrete");
        else if (i === 0 || i === 1 || i === 2) {
          if (x + z === 0 || ((pos + i) % 4 === 1 && i === 1)) put(x, y, z, "glowstone");
          else put(x, y, z, "glass_pane", pane);
        }
      } else {
        // upper windows with spandrels at the bottom and top rows
        if (i === 0 || i === 3) put(x, y, z, "white_concrete");
        else {
          if (i === 1 && (pos + z) % 5 === 0) put(x, y, z, "glowstone");
          else put(x, y, z, "glass_pane", pane);
        }
      }
    }
  }

  // front entrance: double door, lantern under the lintel
  if (`${x},${z}` === doorKey) {
    const facing = doorFacing;
    put(x, G + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, G + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, G + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

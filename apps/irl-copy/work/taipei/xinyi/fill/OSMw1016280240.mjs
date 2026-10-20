import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280240";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 33, D = 18;
const ROOF_Y = 20;      // roof membrane top course
const PARAPET_Y = 21;   // parapet course, roof reads ~21 blocks
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Number(gr));
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const setIf = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const edge = isEdge(x, z);
  const missingX = !has(x - 1, z) || !has(x + 1, z);
  const missingZ = !has(x, z - 1) || !has(x, z + 1);
  const corner = missingX && missingZ;
  const onXFace = missingX;              // wall runs along z
  const southFace = !has(x, z + 1);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) setIf(x, y, z, "stone_bricks");

  // Ground floor slab for interior cells
  if (!edge) setIf(x, gr, z, "smooth_quartz");

  // Interior floor slabs at storey lines
  if (!edge) {
    for (const f of [5, 10, 15]) if (f > gr) setIf(x, f, z, "smooth_quartz");
  }

  // Roof membrane on every cell (stands on everything below)
  if (gr <= ROOF_Y) setIf(x, ROOF_Y, z, "light_gray_concrete");

  if (edge && gr <= PARAPET_Y) {
    setIf(x, PARAPET_Y, z, corner ? "smooth_quartz" : "white_concrete");
  }

  if (!edge) continue;

  // Facade walls, gr..19
  for (let y = gr; y <= 19; y++) {
    const ry = y % 5;
    const idx = onXFace ? z : x;

    // Entrance on the south face (x 8)
    if (southFace && x === 8) {
      if (y === gr + 1 || y === gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        setIf(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gr + 3) {
        setIf(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
    }

    if (y === gr) { setIf(x, y, z, "polished_granite"); continue; }
    if (ry === 0) { setIf(x, y, z, "smooth_quartz"); continue; }
    if (ry === 4) { setIf(x, y, z, "white_concrete"); continue; }

    // Window band (ry 1..3)
    if (corner || idx % 3 === 0) {
      setIf(x, y, z, "white_concrete");
    } else {
      const props = onXFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      setIf(x, y, z, "light_blue_stained_glass_pane", props);

      // Warm lights just inside selected south-face windows
      if (southFace && ry === 2 && idx % 3 === 1 && has(x, z - 1) && !isEdge(x, z - 1)) {
        setIf(x, y, z - 1, "glowstone");
      }
    }
  }
}

// Rooftop mechanical penthouse, a setback tier standing on the roof membrane
for (const [x, z, gr0] of cells) {
  if (Math.round(gr0) > ROOF_Y) continue;
  if (x < 5 || x > 12 || z < 5 || z > 12) continue;
  for (let y = 21; y <= 23; y++) setIf(x, y, z, "light_gray_concrete");
  setIf(x, 24, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1339888556";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const H = 19;
const ROOF = 7;                 // roof deck top, about 7 blocks above lowest ground
const g = new Voxels([5, H, 5]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => groundOf.has(key(x, z));

function setb(x, y, z, block, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Glass pane with connection states matching the face it sits on.
function pane(x, y, z, onNS) {
  const p = onNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  setb(x, y, z, "glass_pane", p);
}

for (const [x, z, gr] of cells) {
  const edge = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
  const onNS = !has(x, z - 1) || !has(x, z + 1);
  const onEW = !has(x - 1, z) || !has(x + 1, z);
  const corner = onNS && onEW;
  const outX = !has(x - 1, z) ? -1 : (!has(x + 1, z) ? 1 : 0);
  const outZ = !has(x, z - 1) ? -1 : (!has(x, z + 1) ? 1 : 0);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) setb(x, y, z, "stone_bricks");

  // Base course on the perimeter, floor slab inside, at the ground line.
  setb(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey line at y=4: lintel band on the perimeter, floor slab inside.
  if (gr < 4) setb(x, 4, z, edge ? "white_concrete" : "smooth_stone");

  // Roof deck at y=7: quartz cornice on the perimeter, stone deck inside.
  setb(x, ROOF, z, edge ? "smooth_quartz" : "stone");

  if (!edge) continue;

  // Ground floor shopfront: y gr+1 .. 3.
  const isDoor = outZ === 1 && outX === 0 && x === 2 && gr + 2 <= 3;
  for (let y = gr + 1; y <= 3; y++) {
    if (corner) {
      setb(x, y, z, "white_concrete");
    } else if (isDoor && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      setb(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
    } else {
      pane(x, y, z, onNS && !onEW);
    }
  }

  // Upper storeys y=5..6: window bays with concrete mullions.
  for (let y = 5; y <= 6; y++) {
    if (y > ROOF - 1) break;
    if (corner) {
      setb(x, y, z, "white_concrete");
    } else if ((onNS && x === 2) || (onEW && z === 2)) {
      setb(x, y, z, "white_concrete");
    } else {
      pane(x, y, z, onNS && !onEW);
    }
  }

  // Warm light behind the first glass bay of each upper face.
  if (!corner && ((onNS && x === 1) || (onEW && z === 1))) {
    const ix = x - outX;
    const iz = z - outZ;
    if (has(ix, iz)) setb(ix, 5, iz, "glowstone");
  }
}

// Roof equipment: a small plant block on the centre of the roof.
if (has(2, 2)) setb(2, ROOF + 1, 2, "chiseled_stone_bricks");

g.save(`${dir}/${id}.nbt`);

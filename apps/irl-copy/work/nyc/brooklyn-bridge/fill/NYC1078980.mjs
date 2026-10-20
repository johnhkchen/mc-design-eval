import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1078980";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 22, H = 33, D = 16;
const PITCH = 3;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, roof] of cells) {
  info.set(key(x, z), { ground: Math.round(gr), roof: Math.round(roof) });
}
const inside = (x, z) => info.has(key(x, z));

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));
const maxGround = Math.max(...[...info.values()].map((v) => v.ground));

// One flat roof plane for the whole building (median lidar roof), never below the grounds.
const roofs = [...info.values()].map((v) => v.roof).sort((a, b) => a - b);
const RTOP = Math.max(Math.round(roofs[Math.floor(roofs.length / 2)]), maxGround + 2 * PITCH);

function place(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function faces(x, z) {
  const f = [];
  if (!inside(x, z - 1)) f.push([0, -1, "north"]);
  if (!inside(x, z + 1)) f.push([0, 1, "south"]);
  if (!inside(x - 1, z)) f.push([-1, 0, "west"]);
  if (!inside(x + 1, z)) f.push([1, 0, "east"]);
  return f;
}

const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const { ground } = info.get(key(x, z));
  const fs = faces(x, z);
  const perim = fs.length > 0;
  const corner = fs.length > 1;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) place(x, y, z, "stone_bricks");

  // Floor slabs at each storey line, and the walls between them
  for (let F = ground; F < RTOP; F += PITCH) {
    place(x, F, z, perim ? "stone_bricks" : "smooth_stone");
    const top = Math.min(F + 2, RTOP - 1);
    for (let y = F + 1; y <= top; y++) {
      if (!perim) continue; // interiors are air behind the glass
      if (corner) {
        place(x, y, z, "stone_bricks");
        continue;
      }
      const [nx, nz, name] = fs[0];
      const along = nx !== 0 ? z - minZ : x - minX;
      const L = nx !== 0 ? maxZ - minZ + 1 : maxX - minX + 1;
      const quoin = along === 0 || along === L - 1;
      const pier = quoin || along % 3 === 0;
      const storey = Math.floor((F - ground) / PITCH);
      const doorCol = storey === 0 && name === "north" && along === Math.floor(L / 2);

      if (doorCol && y === F + 1) {
        place(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (doorCol && y === F + 2) {
        place(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pier) {
        place(x, y, z, quoin ? "stone_bricks" : (along % 9 === 0 ? "stone_bricks" : "bricks"));
      } else {
        place(x, y, z, "glass");
        // lit windows: glowstone just inside the glass
        if (y === F + 1 && (along + storey) % 4 === 0) {
          const ix = x - nx, iz = z - nz;
          if (inside(ix, iz) && faces(ix, iz).length === 0) place(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Flat roof slab, parapet on the perimeter
  place(x, RTOP, z, "smooth_stone");
  if (perim) place(x, RTOP + 1, z, "stone_bricks");
}

// Central penthouse setback, a solid two-tier box with a glass band
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (faces(x, z).length > 0) continue;
  if (Math.abs(x - cx) > 5 || Math.abs(z - cz) > 4) continue;
  place(x, RTOP + 1, z, "light_gray_concrete");
  place(x, RTOP + 2, z, Math.abs(x - cx) === 5 || Math.abs(z - cz) === 4 ? "glass" : "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);

// Placement kit in screen coordinates (u right, y up, z back). Facings are screen names:
//   n = toward the street (-z), s = into the heart (+z), r = viewer's right (+u), l = viewer's left (-u)
import { B } from "../../../../../../minecraft-design/tools/src/build.mjs";
import { NU, NY, NZ, idx } from "./anat.mjs";

const WORLD = { n: "north", s: "south", r: "west", l: "east" };
export const wf = (f) => WORLD[f] ?? f;
const OPP = { n: "s", s: "n", r: "l", l: "r" };
export const opp = (f) => OPP[f];

export function makeKit(g, F) {
  const X = (u) => NU - 1 - u;
  const inb = (u, y, z) => u >= 0 && u < NU && y >= 0 && y < NY && z >= 0 && z < NZ;
  const kit = {
    g, F, X, inb,
    room: (u, y, z) => (inb(u, y, z) ? F.room[idx(u, y, z)] : 0),
    solid: (u, y, z) => (inb(u, y, z) ? F.a[idx(u, y, z)] : 0),
    put(u, y, z, block, state, nbt) { if (inb(u, y, z)) g.set(X(u), y, z, block, state, nbt); },
    clear(u, y, z) { if (inb(u, y, z)) g.unset(X(u), y, z); },
    at(u, y, z) { return g.get(X(u), y, z); },
    free(u, y, z) { return inb(u, y, z) && !g.get(X(u), y, z) && F.room[idx(u, y, z)] > 0; },
    fill(a, b, block, state) {
      for (let u = Math.min(a[0], b[0]); u <= Math.max(a[0], b[0]); u++)
        for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
          for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) kit.put(u, y, z, block, state);
    },
    // fill only cells that are open cavity and still empty
    fillFree(a, b, block, state) {
      for (let u = Math.min(a[0], b[0]); u <= Math.max(a[0], b[0]); u++)
        for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
          for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) if (kit.free(u, y, z)) kit.put(u, y, z, block, state);
    },
    stairs(u, y, z, mat, up, half = "bottom") { kit.put(u, y, z, `${mat}_stairs`, { facing: wf(up), half, shape: "straight", waterlogged: "false" }); },
    slab(u, y, z, mat, type = "bottom") { kit.put(u, y, z, `${mat}_slab`, { type, waterlogged: "false" }); },
    trap(u, y, z, mat, facing, half = "bottom", open = false) { kit.put(u, y, z, `${mat}_trapdoor`, { facing: wf(facing), half, open: String(open), powered: "false", waterlogged: "false" }); },
    lantern(u, y, z, hanging = false) { kit.put(u, y, z, "lantern", { hanging: String(hanging), waterlogged: "false" }); },
    chain(u, y, z) { kit.put(u, y, z, "chain", { axis: "y", waterlogged: "false" }); },
    ladder(u, y, z, facing) { kit.put(u, y, z, "ladder", { facing: wf(facing), waterlogged: "false" }); },
    // door: facing = the side the door's front shows to
    door(u, y, z, mat, facing, hinge = "left", open = false) {
      kit.put(u, y, z, `${mat}_door`, { facing: wf(facing), half: "lower", hinge, open: String(open), powered: "false" });
      kit.put(u, y + 1, z, `${mat}_door`, { facing: wf(facing), half: "upper", hinge, open: String(open), powered: "false" });
    },
    wallSign(u, y, z, wood, facing, lines, opts = {}) { kit.put(u, y, z, ...B.sign(wood, lines, { wall: true, facing: wf(facing), dataVersion: 4189, ...opts })); },
    pane(u, y, z, block, conn = {}) { kit.put(u, y, z, block, conn); },
  };
  return kit;
}

// Roofs and chimney (P3): the five roofs in plan order (entry gable with vent, main hip, wing hip, garage hip, turret
// cone) and the stone chimney last. Same calls as vocab.mjs roofSpec, with two local changes: the library's dark-slate
// texture mixes in polished_blackstone_brick and polished_deepslate, which are not in palette.json, so the roofs get
// a palette-only mix; and the turret finial is a lantern, since lightning_rod is not in palette.json.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { chimney, ROOF_BASE_Y, GLASS, TRIM, SIDING, ROOMS, OPENINGS } from "../vocab.mjs";

const SLATE = {
  mix: [["deepslate_tiles", 70], ["cobbled_deepslate", 15], ["blackstone", 15]],
  eave: "blackstone",
  ridge: "deepslate_tiles",
  verge: "deepslate_tiles",
};

// The roof library's eave cheeks and dormer walls run down past the top plate (y9) into the rooms at y7..8: they wall off
// the east passage, bedroom 2, the primary suite and the bonus tunnel, and sit in the BR2 and BR3 window holes. So the
// roof writes nothing inside a room or an opening (y <= 8); those cells stay air for the room and facade parts. Dropping
// the writes here, rather than clearing them afterwards, keeps the cells unowned, so later parts can still place in them.
const reserved = (x, y, z) => y <= 8 && (
  ROOMS.some(({ box: [x0, y0, z0, x1, y1, z1] }) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1) ||
  OPENINGS.some((o) => x >= o.x[0] && x <= o.x[1] && y >= o.y[0] && y <= o.y[1] && z >= o.z[0] && z <= o.z[1]));
const outsideRooms = (g) => {
  const view = new Proxy(g, {
    get: (t, p) => (p === "set" || p === "unset" ? (x, y, z, ...r) => {
      if (!reserved(x, y, z)) t[p](x, y, z, ...r);
      return view;
    } : Reflect.get(t, p)),
  });
  return view;
};

export function build(g) {
  const roofs = outsideRooms(g);
  roof(roofs, [[22, 7, 31, 18]], "gable", { y: ROOF_BASE_Y, pitch: 1.0, maxHeight: 5, ridgeAxis: "z", overhang: 1,
    eave: "cornice", material: SLATE, gable: SIDING, verge: "quartz" });
  for (let x = 26; x <= 27; x++) for (let y = 11; y <= 12; y++) g.set(x, y, 7, GLASS);
  for (const [x, y] of [[25, 11], [25, 12], [28, 11], [28, 12], [26, 10], [27, 10], [26, 13], [27, 13]]) g.set(x, y, 7, TRIM);
  roof(roofs, [[18, 11, 35, 25]], "hip", { y: ROOF_BASE_Y, pitch: 0.55, maxHeight: 4, overhang: 1, eave: "cornice",
    ridge: "slab", material: SLATE, dormers: { face: ["south", "north"], count: 1, style: "gable" } });
  roof(roofs, [[35, 12, 42, 24]], "hip", { y: ROOF_BASE_Y, pitch: 0.5, maxHeight: 3, overhang: 1, eave: "cornice",
    ridge: "slab", material: SLATE, dormers: { face: "north", count: 1, style: "gable" } });
  roof(roofs, [[1, 7, 17, 24]], "hip", { y: ROOF_BASE_Y, pitch: 0.5, maxHeight: 3, overhang: 1, eave: "cornice",
    ridge: "slab", material: SLATE, dormers: { face: "north", count: 2, style: "gable" } });
  roof(roofs, [[38, 8, 42, 12]], "tower-cap", { y: ROOF_BASE_Y, material: SLATE, finial: "lantern" });
  chimney(g);
}

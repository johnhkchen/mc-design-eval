// usage: node scan.mjs build.nbt z6 y9 u8 ...   prints block-class sections in SCREEN coords (u = 29 - x)
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = load(process.argv[2]);
const [W, H, D] = g.size;
const cls = (c) => {
  if (!c) return ".";
  const b = c.block.replace("minecraft:", "");
  if (b === "air") return ".";
  if (b.endsWith("_stairs")) return "s";
  if (b.endsWith("_slab")) return "_";
  if (b === "ladder") return "H";
  if (b.endsWith("_door")) return "D";
  if (b.includes("glass") ) return "g";
  if (b.endsWith("_pane") || b === "iron_bars") return "|";
  if (b.includes("lantern") || b.includes("torch") || b.includes("lamp") || b === "glowstone" || b === "shroomlight" || b.includes("froglight")) return "*";
  if (b.includes("shelf")) return "B";
  if (b.endsWith("_sign")) return "S";
  if (b.endsWith("_trapdoor")) return "t";
  if (b.endsWith("_carpet")) return "-";
  if (b.includes("copper")) return "c";
  if (b.includes("fence") || b.endsWith("_wall")) return "f";
  return "#";
};
const at = (u, y, z) => g.get(W - 1 - u, y, z);
for (const a of process.argv.slice(3)) {
  const k = a[0], n = Number(a.slice(1));
  let out = `${a}\n    ` + [...Array(k === "u" ? D : W).keys()].map((i) => i % 10).join("") + "\n";
  if (k === "y") for (let z = 0; z < D; z++) { let r = String(z).padStart(3) + " "; for (let u = 0; u < W; u++) r += cls(at(u, n, z)); out += r + "\n"; }
  if (k === "z") for (let y = H - 1; y >= 0; y--) { let r = String(y).padStart(3) + " "; for (let u = 0; u < W; u++) r += cls(at(u, y, n)); out += r + "\n"; }
  if (k === "u") for (let y = H - 1; y >= 0; y--) { let r = String(y).padStart(3) + " "; for (let z = 0; z < D; z++) r += cls(at(n, y, z)); out += r + "\n"; }
  console.log(out);
}

// a copy re-let: its name board's banner letters and the hanging sign's text say the new trade
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const [file, word, letter, base] = process.argv.slice(2);
const g = load(file);
for (let x = 10; x <= 18; x++) { const c = g.get(x, 10, 4); if (c && /banner/.test(c.block)) g.unset(x, 10, 4); }
const n = bannerWord(g, word, { center: [14, 10, 4], face: "north", letter, base });
const swap = (v) => { if (typeof v === "string") return v.replace(/BUTCHER/g, word); if (Array.isArray(v)) return v.map(swap); if (v && typeof v === "object") { for (const k of Object.keys(v)) v[k] = swap(v[k]); } return v; };
let signs = 0;
for (const c of [...g]) if (/sign/.test(c.block) && c.nbt && JSON.stringify(c.nbt).includes("BUTCHER")) { g.set(...c.pos, c.block, c.state, swap(structuredClone(c.nbt))); signs++; }
g.save(file);
console.log(`${file}: ${n} letters, ${signs} signs re-lettered`);

// node roomscan.mjs <roomcode> y0 y1  -> per-level maps of free (unoccupied) cavity cells of that room. Uses build.mjs state via dynamic import.
process.env.NOSAVE = "1";
const { F, g } = await import("./build.mjs");
import("./anat.mjs").then(({ idx, NU, NY, NZ }) => {
  const code = Number(process.argv[2]); const y0 = Number(process.argv[3]), y1 = Number(process.argv[4] ?? y0);
  for (let y = y0; y <= y1; y++) {
    let s = `y=${y}\n    ` + [...Array(NU).keys()].map((u) => u % 10).join("") + "\n";
    for (let z = 0; z < NZ; z++) {
      let r = String(z).padStart(3) + " ";
      for (let u = 0; u < NU; u++) {
        const rm = F.room[idx(u, y, z)]; const b = g.get(NU - 1 - u, y, z);
        r += rm === code ? (b ? "x" : "o") : (F.a[idx(u, y, z)] ? "#" : (rm ? "+" : "."));
      }
      s += r + "\n";
    }
    console.log(s);
  }
});

// USDA National Agriculture Imagery Program aerial photographs (public domain, continental US): 0.6 m, red, green, blue
// and near-infrared, read as windows of the cloud-optimised GeoTIFFs Microsoft's Planetary Computer serves (a free
// anonymous token signs the URLs). The newest year that covers the place. Sampled onto the place's grid as four rasters
// (0-255): roof colours seen from above, and green ground told from paving by the near-infrared.
import { fromUrl } from "geotiff";

const PC = "https://planetarycomputer.microsoft.com/api";
// WGS84 -> UTM (NAIP's NAD83 UTM zones; under a metre from WGS84 here), the standard series
function utm(lon, lat, zone) {
  const a = 6378137, f = 1 / 298.257222101, k0 = 0.9996, e2 = f * (2 - f), ep2 = e2 / (1 - e2), d = Math.PI / 180;
  const lam0 = ((zone - 1) * 6 - 180 + 3) * d, phi = lat * d, lam = lon * d;
  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2), T = Math.tan(phi) ** 2, C = ep2 * Math.cos(phi) ** 2, A = Math.cos(phi) * (lam - lam0);
  const M = a * ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi - ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi)
    + ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) - ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));
  const x = k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120) + 500000;
  const y = k0 * (M + N * Math.tan(phi) * (A ** 2 / 2 + ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 + ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720));
  return [x, y];
}

export default [{
  id: "naip", layers: ["aerial"], name: "NAIP aerial imagery (USDA, via Microsoft Planetary Computer)", licence: "Public domain (US Government work)",
  attribution: "USDA Farm Production and Conservation Business Center, National Agriculture Imagery Program", url: "https://planetarycomputer.microsoft.com/dataset/naip",
  covers: (p) => p.country === "US",
  async fetch(place, frame) {
    const { N, box, lonLat } = frame;
    const search = await (await fetch(`${PC}/stac/v1/search?collections=naip&bbox=${box.west},${box.south},${box.east},${box.north}&limit=50`)).json();
    const items = search.features.sort((a, b) => b.properties.datetime.localeCompare(a.properties.datetime));
    const year = items[0]?.properties.datetime.slice(0, 4); if (!year) throw new Error("NAIP: nothing covers this place");
    const use = items.filter((i) => i.properties.datetime.startsWith(year));
    const { token } = await (await fetch(`${PC}/sas/v1/token/naip`)).json();
    const bands = [0, 1, 2, 3].map(() => new Float32Array(N * N));
    for (const it of use) {
      const im = await (await fromUrl(`${it.assets.image.href}?${token}`)).getImage();
      const epsg = im.getGeoKeys().ProjectedCSTypeGeoKey, zone = epsg % 100;            // 269xx: NAD83 / UTM zone xx
      const [minx, , , maxy] = im.getBoundingBox(), [rx, ry] = im.getResolution(), W0 = im.getWidth(), H0 = im.getHeight();
      const px = (lon, lat) => { const [x, y] = utm(lon, lat, zone); return [(x - minx) / rx, (y - maxy) / ry]; };
      const c = [px(box.west, box.north), px(box.east, box.north), px(box.west, box.south), px(box.east, box.south)];
      const win = [Math.max(0, Math.floor(Math.min(...c.map((p) => p[0]))) - 2), Math.max(0, Math.floor(Math.min(...c.map((p) => p[1]))) - 2),
        Math.min(W0, Math.ceil(Math.max(...c.map((p) => p[0]))) + 2), Math.min(H0, Math.ceil(Math.max(...c.map((p) => p[1]))) + 2)];
      if (win[2] <= win[0] || win[3] <= win[1]) continue;
      const r = await im.readRasters({ window: win }), W = win[2] - win[0];
      for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
        const [a, b] = px(...lonLat(x, z)), u = Math.floor(a) - win[0], v = Math.floor(b) - win[1];
        if (u < 0 || v < 0 || u >= W || v >= win[3] - win[1]) continue;
        const k = v * W + u, i = z * N + x; if (!r[0][k] && !r[1][k] && !r[2][k]) continue;
        for (let bnd = 0; bnd < 4; bnd++) bands[bnd][i] = r[bnd][k];
      }
    }
    return { aerial: { kind: "rasters", n: N, year, tiles: use.map((i) => i.id), rasters: { r: bands[0], g: bands[1], b: bands[2], nir: bands[3] } } };
  },
}];

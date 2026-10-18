// Meta & World Resources Institute, High Resolution Canopy Height Maps: worldwide, ~1 m, CC BY 4.0. Read straight from
// the open-data bucket as one window of a cloud-optimised GeoTIFF (EPSG:3857, zoom-9 quadkey tiles), sampled onto the
// place's block grid. The layer is canopy height above the ground, in blocks.
import { fromUrl } from "geotiff";

const quadkey = (lat, lon, z) => { const n = 2 ** z, x = Math.floor(((lon + 180) / 360) * n), s = Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180));
  const y = Math.floor(((1 - s / Math.PI) / 2) * n); let q = ""; for (let i = z; i > 0; i--) { const m = 1 << (i - 1); q += ((x & m) ? 1 : 0) + ((y & m) ? 2 : 0); } return q; };

export default [{
  id: "meta-canopy", layers: ["canopy"], name: "High Resolution Canopy Height Maps (Meta & WRI)", licence: "CC BY 4.0",
  attribution: "Meta and World Resources Institute, High Resolution Canopy Height Maps (2024)", url: "https://registry.opendata.aws/dataforgood-fb-forests/",
  covers: () => true,
  async fetch(place, frame) {
    const { N, box, merc, lonLat, scale } = frame;
    const key = quadkey(...frame.centre, 9);
    const im = await (await fromUrl(`https://dataforgood-fb-data.s3.amazonaws.com/forests/v1/alsgedi_global_v6_float/chm/${key}.tif`)).getImage();
    const [minx, , , maxy] = im.getBoundingBox(), [rx, ry] = im.getResolution(), px = ([x, y]) => [(x - minx) / rx, (y - maxy) / ry];
    const [a0, b0] = px(merc(box.west, box.north)), [a1, b1] = px(merc(box.east, box.south));
    const win = [Math.floor(a0) - 2, Math.floor(b0) - 2, Math.ceil(a1) + 2, Math.ceil(b1) + 2], W = win[2] - win[0];
    const [band] = await im.readRasters({ window: win }), out = new Float32Array(N * N);
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      const [pa, pb] = px(merc(...lonLat(x, z))), v = band[(Math.floor(pb) - win[1]) * W + (Math.floor(pa) - win[0])];
      out[z * N + x] = Number.isFinite(v) && v > 0 && v < 120 ? v * scale : 0;
    }
    return { canopy: { kind: "raster", n: N, tile: key, data: out } };
  },
}];

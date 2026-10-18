// A place's frame: a square box around a centre (WGS84), mapped to blocks at the place's scale (default 1 block =
// 1 m), x east, z south (Minecraft's), origin at the box's north-west corner. Equirectangular about the centre, which is
// under a metre off across a few hundred metres.
const M_PER_DEG_LAT = 111_000, R = 6378137;

export function frameFor(place) {
  const [lat, lon] = place.centre, half = place.half, scale = place.scale ?? 1;
  const kLon = M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  const box = { north: lat + half / M_PER_DEG_LAT, south: lat - half / M_PER_DEG_LAT, west: lon - half / kLon, east: lon + half / kLon };
  const N = Math.round(2 * half * scale);
  return {
    N, box, scale, centre: [lat, lon],
    /** lon/lat -> [x, z] in blocks (fractional) */
    toBlock: (lo, la) => [(lo - box.west) * kLon * scale, (box.north - la) * M_PER_DEG_LAT * scale],
    /** block centre -> [lon, lat] */
    lonLat: (x, z) => [box.west + (x + 0.5) / (kLon * scale), box.north - (z + 0.5) / (M_PER_DEG_LAT * scale)],
    /** WGS84 -> Web Mercator metres (EPSG:3857), for rasters in that projection */
    merc: (lo, la) => [(lo * Math.PI * R) / 180, R * Math.log(Math.tan(Math.PI / 4 + (la * Math.PI) / 360))],
  };
}

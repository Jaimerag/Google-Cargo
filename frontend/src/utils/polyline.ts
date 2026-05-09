/** Google Maps encoded polyline decoder */
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const result: Array<{ lat: number; lng: number }> = [];
  let idx = 0, lat = 0, lng = 0;

  while (idx < encoded.length) {
    let b: number, shift = 0, res = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      res |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (res & 1) !== 0 ? ~(res >> 1) : res >> 1;

    shift = 0; res = 0;
    do {
      b = encoded.charCodeAt(idx++) - 63;
      res |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (res & 1) !== 0 ? ~(res >> 1) : res >> 1;

    result.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return result;
}

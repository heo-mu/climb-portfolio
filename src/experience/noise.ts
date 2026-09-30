function hash(x: number, y: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

export function noise2(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y)
  const fx = x - ix, fy = y - iy
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1)
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v
}

export const terrainNoise = (x: number, y: number) => noise2(x, y) * 0.58 + noise2(x * 2.1 + 7, y * 2.1 - 9) * 0.28 + noise2(x * 4.3 - 11, y * 4.3 + 3) * 0.14

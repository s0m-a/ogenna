/**
 * Insert transformation segment into a Cloudinary delivery URL.
 * Falls back to the original URL if the pattern isn't matched.
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/<transform>/v123/.../file.jpg
 */
export function cloudinaryTransform(url: string, transform: string): string {
  const marker = '/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url
  const head = url.slice(0, idx + marker.length)
  const tail = url.slice(idx + marker.length)
  return `${head}${transform}/${tail}`
}

export const thumb = (url: string, size = 300) =>
  cloudinaryTransform(url, `c_fill,g_auto,w_${size},h_${size},f_auto,q_auto`)

export const fitWidth = (url: string, width: number) =>
  cloudinaryTransform(url, `c_limit,w_${width},f_auto,q_auto`)

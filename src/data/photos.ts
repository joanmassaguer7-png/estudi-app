/** Mida màxima del costat llarg d'una foto d'examen: prou per llegir-la, sense ocupar massa. */
const MAX_SIDE = 1600
const QUALITY = 0.72

/** Redueix i comprimeix una imatge (JPEG). Retorna un data URL. */
export async function compressPhoto(file: File): Promise<string> {
  const bitmap = await loadImage(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No s’ha pogut processar la foto.')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close()
  return canvas.toDataURL('image/jpeg', QUALITY)
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      // Respecta l'orientació de la càmera (fotos girades).
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      /* alguns navegadors no ho accepten: provem amb <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Converteix un data URL en un fitxer (per compartir-lo). */
export function dataUrlToFile(dataUrl: string, name: string): File {
  const [head, body] = dataUrl.split(',')
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg'
  const bin = atob(body)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], name, { type: mime })
}

/** Mida aproximada en kB d'un data URL. */
export const dataUrlKB = (d: string) => Math.round((d.length * 3) / 4 / 1024)

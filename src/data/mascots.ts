// Mascotes del Repàs diari: una per cada dia de la setmana.
// Els dibuixos són a public/avisos/<id>-content.(svg|png) i <id>-trist.(svg|png).
// Important: public/sw.js té una còpia d'aquesta taula per als avisos.

export type Species = 'gos' | 'gat'

export interface Mascot {
  id: string
  name: string
  species: Species
  day: string
  short: string
  description: string
}

/** De dilluns a diumenge. */
export const MASCOTS: Mascot[] = [
  { id: 'cheto', name: 'Cheto', species: 'gat', day: 'Dilluns', short: 'Dl', description: 'Gat taronja atigrat' },
  { id: 'toby', name: 'Toby', species: 'gos', day: 'Dimarts', short: 'Dt', description: 'Gos d’orelles caigudes' },
  { id: 'lambo', name: 'Lambo', species: 'gat', day: 'Dimecres', short: 'Dc', description: 'Gat negre d’ulls grocs' },
  { id: 'duke', name: 'Duke', species: 'gos', day: 'Dijous', short: 'Dj', description: 'American staffordshire atigrat' },
  { id: 'olaf', name: 'Olaf', species: 'gat', day: 'Divendres', short: 'Dv', description: 'Gat siamès d’ulls blaus' },
  { id: 'valto', name: 'Valto', species: 'gos', day: 'Dissabte', short: 'Ds', description: 'Husky siberià' },
  { id: 'teo', name: 'Teo', species: 'gat', day: 'Diumenge', short: 'Dg', description: 'Gat siamès blanc' },
]

/** La mascota d'un dia (getDay(): 0 = diumenge). */
export function mascotFor(date = new Date()): Mascot {
  return MASCOTS[(date.getDay() + 6) % 7]
}

export const mascotFace = (m: Mascot, mood: 'content' | 'trist', ext: 'svg' | 'png' = 'svg') =>
  `${import.meta.env.BASE_URL}avisos/${m.id}-${mood}.${ext}`

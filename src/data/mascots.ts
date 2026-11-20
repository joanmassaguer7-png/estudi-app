// Mascotes del Repàs diari: una per cada dia de la setmana.
// Els dibuixos són a public/avisos/<id>-content.(svg|png) i <id>-trist.(svg|png).
// Important: public/sw.js té una còpia d'aquesta taula per als avisos.

export type Species = 'gos' | 'gat'

export interface Mascot {
  id: string
  name: string
  species: Species
  /** Per als articles i adjectius: «en Duke està content», «la Kira està contenta». */
  female?: boolean
  day: string
  short: string
  description: string
}

/** De dilluns a diumenge. */
export const MASCOTS: Mascot[] = [
  { id: 'cheto', name: 'Cheto', species: 'gat', day: 'Dilluns', short: 'Dl', description: 'Gat taronja atigrat' },
  { id: 'kira', name: 'Kira', species: 'gos', female: true, day: 'Dimarts', short: 'Dt', description: 'American staffordshire marró clar' },
  { id: 'lambo', name: 'Lambo', species: 'gat', day: 'Dimecres', short: 'Dc', description: 'Gat negre d’ulls grocs' },
  { id: 'duke', name: 'Duke', species: 'gos', day: 'Dijous', short: 'Dj', description: 'American staffordshire atigrat' },
  { id: 'olaf', name: 'Olaf', species: 'gat', day: 'Divendres', short: 'Dv', description: 'Gat siamès d’ulls blaus' },
  { id: 'ais', name: 'Ais', species: 'gos', female: true, day: 'Dissabte', short: 'Ds', description: 'Gossa blanca' },
  { id: 'teo', name: 'Teo', species: 'gat', day: 'Diumenge', short: 'Dg', description: 'Gat siamès blanc' },
]

/** La mascota d'un dia (getDay(): 0 = diumenge). */
export function mascotFor(date = new Date()): Mascot {
  return MASCOTS[(date.getDay() + 6) % 7]
}

export const mascotFace = (m: Mascot, mood: 'content' | 'trist', ext: 'svg' | 'png' = 'svg') =>
  `${import.meta.env.BASE_URL}avisos/${m.id}-${mood}.${ext}`

/** «en Duke» / «la Kira». */
export const withArticle = (m: Mascot) => `${m.female ? 'la' : 'en'} ${m.name}`
/** «En Duke» / «La Kira» (a l'inici de frase). */
export const WithArticle = (m: Mascot) => `${m.female ? 'La' : 'En'} ${m.name}`
/** «content»/«contenta», «trist»/«trista». */
export const adj = (m: Mascot, word: 'content' | 'trist') => (m.female ? (word === 'content' ? 'contenta' : 'trista') : word)

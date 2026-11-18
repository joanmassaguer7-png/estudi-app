// Contingut del tutorial amb la Guada Vet: de bàsic a avançat.
// Cada capítol té una demo interactiva i una sèrie de passos.
// Un pas amb `task` no deixa continuar fins que es fa l'acció a la demo.

import type { ComponentType } from 'react'
import type { GuadaMood } from '../components/Guada'
import {
  type DemoProps,
  DemoCrowns,
  DemoHome,
  DemoMascots,
  DemoModes,
  DemoReminder,
  DemoStructure,
  DemoSync,
  DemoTest,
  DemoTrivial,
} from './demos'

export type Level = 'Bàsic' | 'Intermedi' | 'Avançat'

export interface Step {
  say: string
  mood?: GuadaMood
  /** Etapa de la demo que s'activa en aquest pas (0 = només mirar). */
  stage?: number
  /** Si hi és, cal fer aquesta acció a la demo per continuar. */
  task?: string
}

export interface Chapter {
  id: string
  level: Level
  title: string
  summary: string
  demo: ComponentType<DemoProps>
  steps: Step[]
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'hola',
    level: 'Bàsic',
    title: 'Hola, soc la Guada!',
    summary: 'Com està organitzat el que estudies',
    demo: DemoStructure,
    steps: [
      { mood: 'hola', say: 'Hola, {nom}! Soc la Guada, auxiliar de veterinària. T’acompanyaré mentre aprens a fer servir l’app. Prometo no mossegar!' },
      { mood: 'explica', say: 'Aquí estudies per cursos. Ara mateix tens el d’Auxiliar de veterinària. Cada curs té temes, i cada tema té subtemes.' },
      { mood: 'explica', stage: 1, task: 'Toca un tema per obrir-lo', say: 'Prova-ho: toca un tema i mira quins subtemes té.' },
      { mood: 'content', stage: 1, say: 'Molt bé, {nom}! Cada subtema té unes 20 preguntes. Com que estan repartides per subtemes, l’app sap on vas fort i on no tant.' },
    ],
  },
  {
    id: 'inici',
    level: 'Bàsic',
    title: 'La pantalla d’inici',
    summary: 'On és cada cosa',
    demo: DemoHome,
    steps: [
      { mood: 'explica', say: 'Aquesta és la pantalla d’inici. És la teva taula de treball: d’aquí surt tot.' },
      { mood: 'explica', stage: 1, task: 'Toca el Repàs diari', say: 'El més important és el Repàs diari: unes 10 preguntes cada dia. Toca’l!' },
      { mood: 'explica', stage: 2, task: 'Toca els modes de joc', say: 'A sota hi ha els altres modes: Repàs total, Errors, Trivial i Extra difícil. Ja els veurem. Toca’ls.' },
      { mood: 'explica', stage: 3, task: 'Toca el tema 1', say: 'Més avall tens els temes. Si en toques un, pots llegir-ne el temari i fer un test només d’aquell tema.' },
      { mood: 'content', stage: 0, say: 'I al final de tot, els resultats dels últims tests. El botó de l’engranatge ⚙️ és per gestionar l’app.' },
    ],
  },
  {
    id: 'test',
    level: 'Bàsic',
    title: 'Fer un test',
    summary: 'Respondre, tornar enrere i acabar',
    demo: DemoTest,
    steps: [
      { mood: 'explica', say: 'Anem a fer un test de prova. Com en un examen de veritat, no sabràs si l’has encertat fins al final.' },
      { mood: 'explica', stage: 1, task: 'Respon la pregunta 1 i prem Següent', say: 'Tria una resposta i passa a la següent pregunta.' },
      { mood: 'explica', stage: 2, task: 'Torna a la pregunta 1 des de l’índex', say: 'Has canviat d’opinió? Pots tornar a les preguntes que ja has vist tocant-ne el número a l’índex.' },
      { mood: 'pensa', stage: 3, task: 'Toca un interrogant', say: 'Els interrogants són preguntes que encara no has vist. Prova de tocar-ne un…' },
      { mood: 'content', stage: 3, say: 'No es pot! A les preguntes noves s’hi arriba d’una en una, com en un examen.' },
      { mood: 'explica', stage: 4, task: 'Arriba a l’última pregunta i finalitza', say: '«Finalitzar test» s’activa quan arribes a l’última. Si et deixes preguntes, t’avisaré. Prova-ho.' },
      { mood: 'content', stage: 4, say: 'Perfecte, {nom}! Després de cada test pots revisar els errors amb la resposta correcta i una explicació. Allà és on més s’aprèn.' },
    ],
  },
  {
    id: 'corones',
    level: 'Intermedi',
    title: 'Les corones',
    summary: 'Tria què entra al Repàs diari',
    demo: DemoCrowns,
    steps: [
      { mood: 'explica', say: 'Cada tema té una corona. Serveix per triar de quins temes surten les preguntes del Repàs diari.' },
      { mood: 'explica', stage: 1, task: 'Activa la corona de dos temes', say: 'Activa la corona de dos temes. Les corones taronges són les que entren al repàs.' },
      { mood: 'pensa', stage: 2, task: 'Apaga totes les corones', say: 'I si no n’hi ha cap d’activada? Apaga-les totes i mira què passa.' },
      { mood: 'content', stage: 2, say: 'Sense corones, entren tots els temes. Com a màxim pots activar-ne 10. El repàs sempre agafa almenys una pregunta de cada tema, i prioritza les que falles.' },
    ],
  },
  {
    id: 'mascotes',
    level: 'Intermedi',
    title: 'Mascotes i galetes',
    summary: 'Una mascota per a cada dia i la ratxa',
    demo: DemoMascots,
    steps: [
      { mood: 'hola', say: 'Ara et presento els meus pacients preferits! Cada dia de la setmana t’acompanya una mascota diferent.' },
      { mood: 'explica', stage: 1, task: 'Toca la mascota d’avui', say: 'Toca la mascota d’avui per conèixer-la.' },
      { mood: 'explica', stage: 1, say: 'Quan fas el Repàs diari, la ratxa puja: és el nombre de dies seguits que l’has fet. Si et saltes un dia, torna a començar!' },
      { mood: 'content', stage: 2, task: 'Dona la galeta a la mascota', say: 'I en acabar el repàs, la mascota es mereix un premi. Arrossega la galeta fins a la seva cara.' },
      { mood: 'content', stage: 2, say: 'Que content que està! Cada dia que facis el repàs, tindrà la seva galeta.' },
    ],
  },
  {
    id: 'modes',
    level: 'Intermedi',
    title: 'Els altres modes',
    summary: 'Repàs total, errors, Trivial i extra difícil',
    demo: DemoModes,
    steps: [
      { mood: 'explica', say: 'A més del Repàs diari, tens quatre maneres més d’estudiar. Cadascuna serveix per a un moment diferent.' },
      { mood: 'explica', stage: 1, task: 'Toca els quatre modes', say: 'Toca’ls tots quatre per veure per a què serveixen.' },
      { mood: 'content', stage: 1, say: 'El meu consell: Repàs diari cada dia, el test setmanal d’errors cada dilluns i Extra difícil quan vulguis posar-te a prova.' },
    ],
  },
  {
    id: 'trivial',
    level: 'Intermedi',
    title: 'El Trivial de la petjada',
    summary: 'Omple la petjada subtema a subtema',
    demo: DemoTrivial,
    steps: [
      { mood: 'explica', say: 'El Trivial és el meu joc preferit. Cada part de la petjada és un subtema: el coixinet, i després els dits.' },
      { mood: 'explica', stage: 1, task: 'Completa un subtema', say: 'Amb un encert, la part s’omple a mitges. Amb dos, queda plena. Prova-ho!' },
      { mood: 'sorpresa', stage: 2, task: 'Omple tota la primera petjada', say: 'Si el tema té més de cinc subtemes, surt una altra petjada. Omple tota la primera!' },
      { mood: 'content', stage: 2, say: 'Al joc de veritat, si falles, el subtema torna a sortir més tard. Però si se t’acaben les preguntes d’un subtema, perds!' },
    ],
  },
  {
    id: 'avisos',
    level: 'Avançat',
    title: 'Recordatoris',
    summary: 'Que no se t’oblidi el repàs',
    demo: DemoReminder,
    steps: [
      { mood: 'explica', say: 'A ⚙️ Gestionar pots activar un recordatori diari i triar-ne l’hora. Te l’afegeixo al calendari amb un sol botó.' },
      { mood: 'explica', stage: 1, task: 'Toca l’avís', say: 'A l’hora triada, la mascota del dia t’avisa contenta. Mira-ho.' },
      { mood: 'pensa', stage: 2, task: 'Toca l’avís trist', say: 'Però si passen dues hores i encara no l’has fet…' },
      { mood: 'content', stage: 2, say: 'Si ja l’has fet, no t’avisa. Un detall: l’avís de l’app depèn de Chrome i pot arribar més tard. El del calendari és el que sona puntual.' },
    ],
  },
  {
    id: 'sincronitzar',
    level: 'Avançat',
    title: 'Ordinador i mòbil',
    summary: 'Passar preguntes i progrés amb fitxers',
    demo: DemoSync,
    steps: [
      { mood: 'explica', say: 'L’app no fa servir el núvol: les teves dades es queden al dispositiu. Per passar coses entre l’ordinador i el mòbil es fa servir un fitxer.' },
      { mood: 'explica', stage: 1, task: 'Envia preguntes noves al mòbil', say: 'Quan hi ha preguntes noves, s’exporten a l’ordinador i s’importen al mòbil. Fes-ho tu.' },
      { mood: 'explica', stage: 2, task: 'Passa el progrés a l’ordinador', say: 'I al revés: el que estudies al mòbil es pot passar a l’ordinador amb «Exportar progrés».' },
      { mood: 'pensa', stage: 2, say: 'Molt important: com que tot és al dispositiu, fes una còpia de seguretat de tant en tant. Si fa dies que no en fas, l’app t’ho recordarà.' },
      { mood: 'content', stage: 2, say: 'Si un fitxer està malament, l’app no toca res. I el teu historial i les corones es mantenen quan arriben preguntes noves.' },
    ],
  },
]

export const LEVELS: Level[] = ['Bàsic', 'Intermedi', 'Avançat']

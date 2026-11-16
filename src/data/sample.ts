// Curs de mostra per provar l'aplicació mentre no tenim el banc real generat a partir del PDF.
// Té el mateix format que un paquet importat des de l'ordinador.

import { CONTENT_FORMAT, FORMAT_VERSION, type ContentPackage } from './package'
import type { Question, Subtopic, Topic } from './types'

const COURSE = 'permis-b-mostra'
const created = '2026-11-16T00:00:00.000Z'

const topics: Topic[] = [
  { id: 't1', courseId: COURSE, number: '1', title: 'Velocitat', order: 1, createdAt: created },
  { id: 't2', courseId: COURSE, number: '2', title: 'Alcohol i conducció', order: 2, createdAt: created },
  { id: 't3', courseId: COURSE, number: '3', title: 'Seguretat passiva i emergències', order: 3, createdAt: created },
]

const subtopics: Subtopic[] = [
  {
    id: 't1-1', courseId: COURSE, topicId: 't1', number: '1.1', title: 'Límits genèrics per a turismes', order: 1,
    content: 'Autopistes i autovies: 120 km/h. Carreteres convencionals: 90 km/h. Vies urbanes amb un únic carril per sentit: 30 km/h. Vies urbanes amb dos o més carrils per sentit: 50 km/h.',
  },
  {
    id: 't1-2', courseId: COURSE, topicId: 't1', number: '1.2', title: 'Distància de detenció', order: 2,
    content: 'La distància de detenció és la suma de la distància de reacció i la distància de frenada. La de frenada creix amb el quadrat de la velocitat i augmenta amb el paviment mullat.',
  },
  {
    id: 't2-1', courseId: COURSE, topicId: 't2', number: '2.1', title: 'Taxes màximes d’alcohol', order: 1,
    content: 'Taxa general: 0,5 g/l en sang o 0,25 mg/l en aire espirat. Conductors novells (menys de dos anys de permís) i professionals: 0,3 g/l en sang o 0,15 mg/l en aire. Negar-se a fer la prova és un delicte.',
  },
  {
    id: 't2-2', courseId: COURSE, topicId: 't2', number: '2.2', title: 'Efectes de l’alcohol', order: 2,
    content: 'L’alcohol augmenta el temps de reacció, redueix el camp visual (efecte túnel) i dona una falsa sensació de seguretat. Només el temps elimina l’alcohol de l’organisme.',
  },
  {
    id: 't3-1', courseId: COURSE, topicId: 't3', number: '3.1', title: 'Cinturó i sistemes de retenció infantil', order: 1,
    content: 'El cinturó és obligatori per a tots els ocupants. Els menors d’una alçada igual o inferior a 135 cm han d’utilitzar un sistema de retenció infantil adequat. Si es col·loca una cadira d’esquena a la marxa al seient davanter, cal desactivar l’airbag frontal.',
  },
  {
    id: 't3-2', courseId: COURSE, topicId: 't3', number: '3.2', title: 'Senyalització d’emergència', order: 2,
    content: 'Des de l’1 de gener de 2026, el vehicle immobilitzat es senyalitza amb la llum V-16 connectada, col·locada a la part més alta del vehicle. En sortir del vehicle en via interurbana cal posar-se l’armilla reflectant.',
  },
]

let n = 0
function q(subtopicId: string, concept: string, text: string, options: string[], correctIndex: number, explanation: string): Question {
  const sub = subtopics.find((s) => s.id === subtopicId)!
  n++
  return {
    id: `${subtopicId}-q${n}`, courseId: COURSE, topicId: sub.topicId, subtopicId, concept, text, options, correctIndex, explanation,
    generation: { source: 'mostra', createdAt: created },
  }
}

const questions: Question[] = [
  q('t1-1', 'límit autopista', 'Quina és la velocitat màxima genèrica d’un turisme en autopista o autovia?', ['100 km/h', '110 km/h', '120 km/h', '130 km/h'], 2, 'En autopistes i autovies el límit genèric per a turismes és de 120 km/h.'),
  q('t1-1', 'límit carretera convencional', 'I en una carretera convencional?', ['80 km/h', '90 km/h', '100 km/h', '110 km/h'], 1, 'El límit genèric en carretera convencional és de 90 km/h.'),
  q('t1-1', 'límit urbà un carril', 'En una via urbana amb un únic carril per sentit, la velocitat màxima genèrica és…', ['20 km/h', '30 km/h', '40 km/h', '50 km/h'], 1, 'Amb un únic carril per sentit, el límit urbà genèric és de 30 km/h.'),
  q('t1-1', 'límit urbà dos carrils', 'En una via urbana amb dos o més carrils per sentit, la velocitat màxima genèrica és…', ['30 km/h', '40 km/h', '50 km/h', '60 km/h'], 2, 'Amb dos o més carrils per sentit, el límit urbà genèric és de 50 km/h.'),

  q('t1-2', 'composició distància detenció', 'La distància de detenció és…', ['Només la distància de frenada', 'La distància de reacció més la de frenada', 'La distància de seguretat amb el vehicle de davant', 'La distància recorreguda en un segon'], 1, 'Detenció = reacció (mentre el conductor reacciona) + frenada (des que frena fins que s’atura).'),
  q('t1-2', 'velocitat i frenada', 'Si dupliques la velocitat, la distància de frenada aproximadament…', ['Es duplica', 'Es triplica', 'Es multiplica per quatre', 'No varia'], 2, 'La distància de frenada creix amb el quadrat de la velocitat: el doble de velocitat suposa unes quatre vegades més distància.'),
  q('t1-2', 'temps de reacció', 'Durant el temps de reacció, el vehicle…', ['Ja comença a frenar', 'Continua avançant a la mateixa velocitat', 'S’atura', 'Redueix la velocitat a la meitat'], 1, 'Mentre el conductor percep el perill i reacciona, el vehicle continua a la mateixa velocitat.'),
  q('t1-2', 'paviment mullat', 'Amb el paviment mullat, la distància de frenada…', ['Disminueix', 'No canvia', 'Augmenta', 'Només canvia en vehicles pesants'], 2, 'L’aigua redueix l’adherència dels pneumàtics i la distància de frenada augmenta.'),

  q('t2-1', 'taxa general sang', 'Quina és la taxa màxima general d’alcohol en sang?', ['0,3 g/l', '0,5 g/l', '0,8 g/l', '0,25 g/l'], 1, 'La taxa general és de 0,5 grams per litre en sang.'),
  q('t2-1', 'taxa general aire', 'Quina és la taxa màxima general d’alcohol en aire espirat?', ['0,15 mg/l', '0,25 mg/l', '0,5 mg/l', '0,3 mg/l'], 1, 'La taxa general en aire espirat és de 0,25 mil·ligrams per litre.'),
  q('t2-1', 'taxa novells', 'Un conductor amb menys de dos anys de permís pot donar en aire espirat com a màxim…', ['0,10 mg/l', '0,15 mg/l', '0,25 mg/l', '0,30 mg/l'], 1, 'Novells i professionals tenen una taxa més baixa: 0,15 mg/l en aire (0,3 g/l en sang).'),
  q('t2-1', 'negativa a la prova', 'Negar-se a fer la prova d’alcoholèmia quan t’ho demana un agent és…', ['Una infracció lleu', 'Una infracció greu sense més conseqüències', 'Un delicte', 'Permès si no hi ha hagut accident'], 2, 'Negar-se a les proves d’alcohol o drogues és un delicte tipificat al Codi Penal.'),

  q('t2-2', 'alcohol i temps de reacció', 'Com afecta l’alcohol el temps de reacció?', ['El redueix', 'L’augmenta', 'No l’afecta', 'Només l’afecta de nit'], 1, 'L’alcohol alenteix el sistema nerviós: es triga més a reaccionar.'),
  q('t2-2', 'efecte túnel', 'L’anomenat «efecte túnel» provocat per l’alcohol consisteix en…', ['Una reducció del camp visual', 'Una millora de la visió nocturna', 'Veure-hi doble només en túnels', 'Una sensibilitat més gran a l’enlluernament només'], 0, 'L’alcohol estreny el camp visual: es perceben pitjor els elements laterals.'),
  q('t2-2', 'eliminació de l’alcohol', 'Quina és l’única manera eficaç d’eliminar l’alcohol de l’organisme?', ['Prendre cafè', 'Dutxar-se amb aigua freda', 'Deixar passar el temps', 'Menjar abundantment'], 2, 'El cafè o la dutxa no redueixen l’alcoholèmia; només el temps ho fa.'),
  q('t2-2', 'falsa seguretat', 'Quin efecte psicològic produeix sovint l’alcohol?', ['Més prudència', 'Una falsa sensació de seguretat', 'Més concentració', 'Cap efecte psicològic'], 1, 'L’alcohol fa sobrevalorar les pròpies capacitats i assumir més riscos.'),

  q('t3-1', 'obligació cinturó', 'Qui ha de portar el cinturó de seguretat cordat en un turisme?', ['Només el conductor', 'El conductor i el passatger del davant', 'Tots els ocupants', 'Només en vies interurbanes'], 2, 'El cinturó és obligatori per a tots els ocupants, en vies urbanes i interurbanes.'),
  q('t3-1', 'alçada SRI', 'Fins a quina alçada els menors han d’utilitzar un sistema de retenció infantil?', ['120 cm', '135 cm', '150 cm', '160 cm'], 1, 'Els menors d’una alçada igual o inferior a 135 cm han d’anar en un SRI adequat.'),
  q('t3-1', 'airbag i cadira d’esquena', 'Si es col·loca una cadira infantil d’esquena a la marxa al seient del davant…', ['Cal desactivar l’airbag frontal del passatger', 'Cal activar l’airbag lateral', 'No cal fer res', 'Està prohibit en tots els casos'], 0, 'L’airbag frontal podria impactar contra la cadira i lesionar el nen: s’ha de desactivar.'),
  q('t3-1', 'reposacaps', 'Com ha d’estar regulat el reposacaps?', ['Tan baix com sigui possible', 'Amb la part superior a l’alçada de la part superior del cap', 'A l’alçada del coll', 'És indiferent'], 1, 'Ben regulat, el reposacaps protegeix del cop de fuet en una col·lisió per l’abast.'),

  q('t3-2', 'V-16', 'Des de l’1 de gener de 2026, amb quin dispositiu s’ha de senyalitzar un turisme immobilitzat a la via?', ['Dos triangles', 'Llum V-16 connectada', 'Només l’armilla reflectant', 'Només els llums d’emergència'], 1, 'La llum V-16 connectada substitueix els triangles com a senyalització obligatòria.'),
  q('t3-2', 'col·locació V-16', 'On es col·loca la llum V-16?', ['A terra, 50 metres darrere', 'A la part més alta del vehicle', 'Dins el maleter', 'Al seient del conductor'], 1, 'Es col·loca a la part més alta del vehicle perquè sigui visible des de lluny, sense haver de caminar per la calçada.'),
  q('t3-2', 'armilla reflectant', 'Quan és obligatori posar-se l’armilla reflectant?', ['Sempre que s’aturi el motor', 'En sortir del vehicle immobilitzat en una via interurbana', 'Només de nit', 'Mai, és opcional'], 1, 'En sortir del vehicle a la calçada o al voral d’una via interurbana cal portar-la posada.'),
  q('t3-2', 'llums d’emergència', 'Què s’ha de fer primer en quedar immobilitzat a la via?', ['Encendre els llums d’emergència', 'Obrir el capó', 'Sortir a la calçada a demanar ajuda', 'Apagar tots els llums'], 0, 'Els llums d’emergència avisen la resta de conductors immediatament.'),
]

export const samplePackage: ContentPackage = {
  format: CONTENT_FORMAT,
  formatVersion: FORMAT_VERSION,
  createdAt: created,
  course: {
    id: COURSE,
    title: 'Permís B · curs de mostra',
    description: 'Contingut de prova. La normativa oficial publicada preval en cas de discrepància.',
    contentVersion: 1,
    updatedAt: created,
  },
  syllabus: { topics, subtopics },
  questions,
}

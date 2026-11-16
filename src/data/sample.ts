// Curs de mostra per provar l'aplicació mentre no tenim el banc real generat a partir del temari.
// Té el mateix format que un paquet importat des de l'ordinador.

import { CONTENT_FORMAT, FORMAT_VERSION, type ContentPackage } from './package'
import type { Question, Subtopic, Topic } from './types'

const COURSE = 'auxiliar-veterinaria-mostra'
const created = '2026-11-16T00:00:00.000Z'

const topics: Topic[] = [
  { id: 't1', courseId: COURSE, number: '1', title: 'Exploració clínica', order: 1, createdAt: created },
  { id: 't2', courseId: COURSE, number: '2', title: 'Higiene i esterilització', order: 2, createdAt: created },
  { id: 't3', courseId: COURSE, number: '3', title: 'Prevenció i tòxics', order: 3, createdAt: created },
]

const subtopics: Subtopic[] = [
  {
    id: 't1-1', courseId: COURSE, topicId: 't1', number: '1.1', title: 'Constants vitals', order: 1,
    content: 'La temperatura del gos i del gat es pren per via rectal i el valor normal se situa aproximadament entre 38 i 39 °C. El temps de reompliment capil·lar normal és inferior a 2 segons. El pols es pren habitualment a l’artèria femoral, a la cara interna de la cuixa.',
  },
  {
    id: 't1-2', courseId: COURSE, topicId: 't1', number: '1.2', title: 'Color de les mucoses', order: 2,
    content: 'Mucoses rosades: normals. Pàl·lides: possible anèmia o xoc. Blavoses (cianòtiques): manca d’oxigen. Grogues (ictèriques): acumulació de bilirubina, sovint per problemes hepàtics.',
  },
  {
    id: 't2-1', courseId: COURSE, topicId: 't2', number: '2.1', title: 'Conceptes bàsics', order: 1,
    content: 'L’asèpsia és el conjunt de mesures per evitar que els microorganismes arribin a una zona. L’antisèpsia elimina o redueix microorganismes sobre teixits vius (pell, ferides). La desinfecció s’aplica sobre objectes i superfícies. L’esterilització elimina totes les formes de vida microbiana, incloses les espores.',
  },
  {
    id: 't2-2', courseId: COURSE, topicId: 't2', number: '2.2', title: 'L’autoclau', order: 2,
    content: 'L’autoclau esterilitza amb vapor d’aigua a pressió. Un cicle habitual treballa a 121 °C. El material s’ha de netejar i embolcallar abans de posar-lo a l’autoclau, i la cinta indicadora canvia de color quan el paquet ha passat pel procés.',
  },
  {
    id: 't3-1', courseId: COURSE, topicId: 't3', number: '3.1', title: 'Zoonosis', order: 1,
    content: 'Una zoonosi és una malaltia que es pot transmetre entre els animals i les persones. Exemples: la ràbia, la leishmaniosi (transmesa per la picada del flebòtom) o la toxoplasmosi (el gat n’elimina els ous per la femta).',
  },
  {
    id: 't3-2', courseId: COURSE, topicId: 't3', number: '3.2', title: 'Tòxics habituals', order: 2,
    content: 'Per al gos són tòxics la xocolata (teobromina), el xilitol i el raïm. Per al gat són especialment perillosos el paracetamol i els lliris.',
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
  q('t1-1', 'via de presa de temperatura', 'Per quina via es pren habitualment la temperatura a un gos a la clínica?', ['Oral', 'Rectal', 'Auricular amb termòmetre de mercuri', 'Axil·lar'], 1, 'La via rectal és la referència a la clínica de petits animals.'),
  q('t1-1', 'temperatura normal del gos', 'Quin és, aproximadament, l’interval de temperatura normal d’un gos adult?', ['35–36 °C', '36–37 °C', '38–39 °C', '40–41 °C'], 2, 'La temperatura normal del gos se situa al voltant de 38–39 °C, més alta que la de les persones.'),
  q('t1-1', 'temps de reompliment capil·lar', 'Quin és el temps de reompliment capil·lar normal?', ['Menys de 2 segons', 'Entre 3 i 4 segons', 'Entre 5 i 6 segons', 'Més de 10 segons'], 0, 'Si la mucosa tarda més de 2 segons a recuperar el color, pot indicar mala perfusió.'),
  q('t1-1', 'presa del pols', 'On es pren habitualment el pols a un gos?', ['A l’artèria femoral, a la cara interna de la cuixa', 'A la punta de la cua', 'Al coixinet de la pota', 'A l’orella'], 0, 'L’artèria femoral és fàcil de palpar a la cara interna de la cuixa.'),

  q('t1-2', 'mucoses normals', 'De quin color són les mucoses d’un animal sa?', ['Blanques', 'Rosades', 'Grogues', 'Blavoses'], 1, 'Les mucoses rosades indiquen una bona oxigenació i perfusió.'),
  q('t1-2', 'mucoses pàl·lides', 'Unes mucoses pàl·lides poden indicar…', ['Febre', 'Anèmia o xoc', 'Deshidratació lleu sempre', 'Un estat normal'], 1, 'La pal·lidesa apunta a poca sang o mala circulació: anèmia o xoc.'),
  q('t1-2', 'mucoses cianòtiques', 'Les mucoses blavoses (cianòtiques) indiquen…', ['Manca d’oxigen', 'Excés de calor', 'Problemes de pell', 'Bona salut'], 0, 'La cianosi apareix quan la sang no porta prou oxigen.'),
  q('t1-2', 'mucoses ictèriques', 'Si les mucoses es veuen grogues, parlem de…', ['Cianosi', 'Icterícia', 'Hiperèmia', 'Pal·lidesa'], 1, 'La icterícia és la coloració groga per acumulació de bilirubina.'),

  q('t2-1', 'definició d’asèpsia', 'Què és l’asèpsia?', ['Destruir les espores d’un instrument', 'Les mesures per evitar que els microorganismes arribin a una zona', 'Netejar el terra amb lleixiu', 'Aplicar un antibiòtic'], 1, 'L’asèpsia és preventiva: evita la contaminació.'),
  q('t2-1', 'antisèpsia', 'Un antisèptic s’aplica sobre…', ['Teixits vius, com la pell', 'Superfícies del quiròfan', 'L’instrumental metàl·lic', 'El terra'], 0, 'Els antisèptics són per a teixits vius; els desinfectants, per a objectes i superfícies.'),
  q('t2-1', 'desinfecció', 'La desinfecció s’aplica sobre…', ['Ferides obertes', 'Objectes i superfícies', 'Mucoses', 'La sang'], 1, 'Desinfectar és reduir microorganismes en objectes i superfícies inerts.'),
  q('t2-1', 'esterilització', 'Quin procés elimina totes les formes de vida microbiana, incloses les espores?', ['La neteja', 'La desinfecció', 'L’esterilització', 'L’antisèpsia'], 2, 'Només l’esterilització elimina també les espores.'),

  q('t2-2', 'funcionament de l’autoclau', 'Amb què esterilitza un autoclau?', ['Amb llum ultraviolada', 'Amb vapor d’aigua a pressió', 'Amb alcohol', 'Amb aire fred'], 1, 'L’autoclau combina calor humida i pressió.'),
  q('t2-2', 'temperatura de l’autoclau', 'Quina temperatura fa servir un cicle habitual d’autoclau?', ['60 °C', '90 °C', '121 °C', '200 °C'], 2, 'Un cicle estàndard treballa a 121 °C.'),
  q('t2-2', 'preparació del material', 'Què s’ha de fer amb l’instrumental abans de posar-lo a l’autoclau?', ['Res, s’hi posa brut', 'Netejar-lo i embolcallar-lo', 'Submergir-lo en oli', 'Escalfar-lo al forn'], 1, 'L’autoclau no substitueix la neteja: la brutícia protegeix els microorganismes.'),
  q('t2-2', 'cinta indicadora', 'Per a què serveix la cinta indicadora dels paquets?', ['Per tancar el paquet i prou', 'Per indicar que el paquet ha passat pel procés d’esterilització', 'Per marcar la data de compra', 'Per identificar el veterinari'], 1, 'La cinta canvia de color quan ha estat exposada al cicle.'),

  q('t3-1', 'definició de zoonosi', 'Què és una zoonosi?', ['Una malaltia exclusiva dels gats', 'Una malaltia transmissible entre animals i persones', 'Una vacuna obligatòria', 'Un tipus de paràsit intestinal'], 1, 'Les zoonosis passen dels animals a les persones, i a l’inrevés.'),
  q('t3-1', 'transmissió de la leishmaniosi', 'Com es transmet la leishmaniosi?', ['Per la picada del flebòtom', 'Per la saliva en una mossegada', 'Per l’aigua', 'Per contacte amb la pell'], 0, 'El flebòtom, un petit mosquit, transmet el paràsit quan pica.'),
  q('t3-1', 'toxoplasmosi i gat', 'En la toxoplasmosi, per on elimina el gat els ous del paràsit?', ['Per la saliva', 'Per la femta', 'Per l’orina', 'Pel pèl'], 1, 'Per això cal netejar la sorra cada dia i amb guants.'),
  q('t3-1', 'ràbia', 'Quina d’aquestes malalties és una zoonosi?', ['La ràbia', 'El brom (distemper caní)', 'La parvovirosi canina', 'La calicivirosi felina'], 0, 'La ràbia es pot transmetre a les persones; les altres afecten només els animals.'),

  q('t3-2', 'xocolata i gos', 'Per què la xocolata és tòxica per als gossos?', ['Pel sucre', 'Per la teobromina', 'Per la llet', 'Pel greix'], 1, 'Els gossos eliminen molt lentament la teobromina.'),
  q('t3-2', 'paracetamol i gat', 'Quin medicament d’ús humà és especialment perillós per als gats?', ['El paracetamol', 'El sèrum fisiològic', 'La vitamina C', 'La clorhexidina diluïda per netejar la pell'], 0, 'El gat no pot metabolitzar bé el paracetamol, fins i tot en dosis petites.'),
  q('t3-2', 'xilitol', 'El xilitol, un edulcorant de xiclets i caramels, és tòxic per a…', ['Els gossos', 'Els peixos', 'Cap animal', 'Només els conills'], 0, 'En el gos provoca una baixada brusca de glucosa.'),
  q('t3-2', 'lliris i gat', 'Quina planta és molt tòxica per als gats?', ['L’alfàbrega', 'El lliri', 'La menta', 'L’herba gatera'], 1, 'Fins i tot el pol·len del lliri pot causar dany renal al gat.'),
]

export const samplePackage: ContentPackage = {
  format: CONTENT_FORMAT,
  formatVersion: FORMAT_VERSION,
  createdAt: created,
  course: {
    id: COURSE,
    title: 'Auxiliar de veterinària',
    description: 'Curs de mostra per provar l’aplicació.',
    contentVersion: 1,
    updatedAt: created,
  },
  syllabus: { topics, subtopics },
  questions,
}

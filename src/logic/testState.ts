// Estat d'un test en curs, separat de la pantalla.
// Regles acordades:
//  - Es pot tornar lliurement a qualsevol pregunta ja visitada.
//  - Cap a preguntes no visitades només s'avança d'una en una.
//  - «Vista» i «resposta» són estats diferents.
//  - «Finalitzar» s'activa quan s'ha arribat a l'última pregunta.

export interface TestState {
  index: number
  maxVisited: number
  answers: (number | null)[]
}

export type TestAction =
  | { type: 'answer'; option: number }
  | { type: 'goto'; index: number }
  | { type: 'next' }
  | { type: 'prev' }

export function initialTestState(total: number): TestState {
  return { index: 0, maxVisited: 0, answers: Array(total).fill(null) }
}

export function testReducer(state: TestState, action: TestAction): TestState {
  const last = state.answers.length - 1
  switch (action.type) {
    case 'answer': {
      const answers = [...state.answers]
      answers[state.index] = action.option
      return { ...state, answers }
    }
    case 'goto':
      // Només es pot saltar a preguntes ja visitades.
      if (action.index < 0 || action.index > state.maxVisited) return state
      return { ...state, index: action.index }
    case 'next': {
      if (state.index >= last) return state
      const index = state.index + 1
      return { ...state, index, maxVisited: Math.max(state.maxVisited, index) }
    }
    case 'prev':
      return state.index > 0 ? { ...state, index: state.index - 1 } : state
  }
}

export const canFinish = (s: TestState) => s.maxVisited === s.answers.length - 1
export const unansweredCount = (s: TestState) => s.answers.filter((a) => a === null).length

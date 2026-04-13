export interface ComplexForm {
  label: string; // e.g., "Past Tense", "Plural", "Gerund"
  value: string; // e.g., "went", "apples", "running"
}

export interface GrammarChallenge {
  sentence: string; // e.g., "I need to ___ a new passport."
  answer: string;   // e.g., "get"
  translation: string; // e.g., "получить"
}

export interface Flashcard {
  id: string;
  word: string;
  translation: string;
  example: string;
  exampleContext: string;
  createdAt: number;
  learned: boolean;
  status: 'suggested' | 'learning' | 'learned' | 'archived';
  userId: string;
  complexForms?: ComplexForm[];
  grammarChallenges?: GrammarChallenge[];
  correctCount: number;
  totalCount: number;
}

export interface WordData {
  word: string;
  translation: string;
  example: string;
  exampleContext: string;
  complexForms?: ComplexForm[];
  grammarChallenges?: GrammarChallenge[];
}

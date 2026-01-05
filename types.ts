export enum AppView {
  DASHBOARD = 'DASHBOARD',
  GRAMMAR = 'GRAMMAR',
  EXERCISES = 'EXERCISES',
  VERBS = 'VERBS',
  FLASHCARDS = 'FLASHCARDS',
  PHRASES = 'PHRASES',
  SETTINGS = 'SETTINGS',
  SORALIA_COURSE = 'SORALIA_COURSE',
  SORALIA_EXERCISES = 'SORALIA_EXERCISES',
  EXAM = 'EXAM',
  EXAM_STUDY = 'EXAM_STUDY',
  EXAM_ONE = 'EXAM_ONE',
  ESSAY_WRITER = 'ESSAY_WRITER',
}

export type Language = 'English' | 'Arabic' | 'Ukrainian' | 'Turkish' | 'Japanese' | 'French' | 'Tigrinya';

export interface VerbConjugation {
  verb: string;
  translation: string;
  tenses: {
    present: string[];
    passeCompose: string[];
    imparfait: string[];
    futurSimple: string[];
    conditionnel: string[];
    plusQueParfait: string[];
    subjonctifPresent: string[];
  };
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Flashcard {
  front: string; // French
  back: string; // Translation
  example: string;
}

export interface Phrase {
  french: string;
  translation: string;
  context: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
}
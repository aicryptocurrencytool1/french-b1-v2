import { Topic, Language } from './types';

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'English', label: 'English', flag: '🇬🇧' },
  { code: 'Arabic', label: 'Arabic', flag: '🇸🇦' },
  { code: 'Ukrainian', label: 'Ukrainian', flag: '🇺🇦' },
  { code: 'Turkish', label: 'Turkish', flag: '🇹🇷' },
  { code: 'Japanese', label: 'Japanese', flag: '🇯🇵' },
  { code: 'French', label: 'French', flag: '🇫🇷' },
  { code: 'Tigrinya', label: 'Eritrean', flag: '🇪🇷' },
];

export const GRAMMAR_TOPICS: Topic[] = [
  { id: 'tenses_comparison', title: 'Passé Composé vs Imparfait vs PQP vs Conditionnel', description: 'Action Movie Star vs Scenery Painter. Which past tense wins?' },
  { id: 'subjonctif_present', title: 'Le Subjonctif Présent', description: 'Feeling weird? Emotions, doubts, and the "weird" tense.' },
  { id: 'passe_compose_imparfait', title: 'Passé Composé vs Imparfait', description: 'Action Star vs Background Painter. Mastering the past.' },
  { id: 'plus_que_parfait', title: 'Le Plus-que-parfait', description: 'The "Past-Past": what happened BEFORE something else.' },
  { id: 'regret_si_seulement', title: 'Exprimer le Regret (Si seulement...)', description: 'If only I knew! Expressing your deepest past regrets.' },
  { id: 'futur_proche', title: 'Le Futur Proche', description: 'Quick Future! Things you are "about to do" right now.' },
  { id: 'futur_simple', title: 'Le Futur Simple', description: 'The Real Future! Plans, dreams, and what WILL happen.' },
  { id: 'conditionnel', title: 'Le Conditionnel', description: 'The "Polite" Tense. Dreams, wishes, and politeness.' },
  { id: 'pronoms_relatifs', title: 'Les Pronoms Relatifs', description: 'Connecting the dots. How to use Qui, Que, and Dont.' },
  { id: 'pronoms_objets', title: 'COD & COI', description: 'Me, You, Him, Her. Replacing people like a local.' },
  { id: 'gerondif', title: 'Le Gérondif', description: 'Multitasking! Doing two things at the same time.' },
  { id: 'discours_rapporte', title: 'Le Discours Rapporté', description: 'The "Gossip" Tense. Reporting what others said.' },
  { id: 'cause_consequence', title: 'La Cause et la Conséquence', description: 'The "Why" and the "So What". Linking your ideas.' },
  { id: 'negation_complexe', title: 'La Négation Complexe', description: 'Beyond NO. Never, Nobody, and Nothing.' },
];

export const FLASHCARD_GRAMMAR_TOPIC_IDS = [
  'subjonctif_present',
  'passe_compose_imparfait',
  'plus_que_parfait',
  'regret_si_seulement',
  'futur_simple',
  'futur_proche',
  'conditionnel',
  'pronoms_objets'
];

export const COMMON_VERBS = [
  'Être', 'Avoir', 'Aller', 'Faire', 'Dire', 'Pouvoir', 'Vouloir', 'Savoir', 'Venir', 'Devoir', 'Prendre', 'Mettre', 'Donner', 'Parler', 'Aimer', 'Finir', 'Attendre'
];

export const PHRASE_TOPICS = [
  'Shopping',
  'At Home',
  'Daily Routine',
  'At the Supermarket',
  'Travel & Transportation',
  'Food & Dining',
  'Health & Body',
  'Work & Professions',
  'Making Plans',
  'Expressing Opinions',
  'Si Seulement (If Only)',
  'Si Conditionnel (If Conditional)',
  'La Négation Complexe',
];

export const TENSE_OPTIONS = [
  'Présent',
  'Passé Composé',
  'Imparfait',
  'Plus-que-parfait',
  'Futur Simple',
  'Conditionnel',
  'Subjonctif Présent',
];

export const VOCAB_CATEGORIES = [
  'Travel & Transportation',
  'Food & Dining',
  'Health & Body',
  'Work & Professions',
  'Hobbies & Leisure',
  'Feelings & Emotions',
];
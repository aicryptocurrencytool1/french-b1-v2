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
  { id: 'tenses_comparison', title: 'Passé Composé vs Imparfait vs PQP vs Conditionnel', description: '(For Dummies) When to use which tense.' },
  { id: 'subjonctif_present', title: 'Le Subjonctif Présent', description: 'Expressing doubt, desire, and necessity.' },
  { id: 'passe_compose_imparfait', title: 'Passé Composé vs Imparfait', description: 'Mastering the nuances of past tenses.' },
  { id: 'plus_que_parfait', title: 'Le Plus-que-parfait', description: 'The past before the past.' },
  { id: 'regret_si_seulement', title: 'Exprimer le Regret (Si seulement...)', description: 'Using "Si seulement..." with past tenses.' },
  { id: 'futur_proche', title: 'Le Futur Proche', description: 'Expressing immediate, certain future actions (going to do).' },
  { id: 'futur_simple', title: 'Le Futur Simple', description: 'Talking about future plans, predictions, and conditions.' },
  { id: 'conditionnel', title: 'Le Conditionnel', description: 'Politeness, wishes, and hypothetical situations.' },
  { id: 'pronoms_relatifs', title: 'Les Pronoms Relatifs', description: 'Qui, que, dont, où, lequel, etc.' },
  { id: 'pronoms_objets', title: 'COD & COI', description: 'Direct and Indirect Object Pronouns.' },
  { id: 'gerondif', title: 'Le Gérondif', description: 'Expressing simultaneous actions (en mangeant).' },
  { id: 'discours_rapporte', title: 'Le Discours Rapporté', description: 'Reporting what someone else said.' },
  { id: 'cause_consequence', title: 'La Cause et la Conséquence', description: 'Connecting ideas logically.' },
  { id: 'negation_complexe', title: 'La Négation Complexe', description: 'Ne...rien, ne...personne, ne...jamais, etc.' },
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
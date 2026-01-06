// DeepSeek Service - Routes text generation to DeepSeek for better quota management
// Audio generation still uses Gemini from the main geminiService

import * as geminiService from './geminiService';
import { VerbConjugation, QuizQuestion, Flashcard, Phrase, Language } from "../types";

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

// Get API key - check multiple possible locations
const getDeepSeekApiKey = () => {
    // @ts-ignore - process.env is defined by vite
    return process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
};

interface DeepSeekMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface DeepSeekRequest {
    model: string;
    messages: DeepSeekMessage[];
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: 'json_object' };
}

// Helper to call DeepSeek API
const callDeepSeek = async (prompt: string, systemPrompt?: string, expectJSON: boolean = false): Promise<string> => {
    const apiKey = getDeepSeekApiKey();

    // If no DeepSeek API key, fallback to Gemini
    if (!apiKey) {
        console.warn('DEEPSEEK_API_KEY not set, falling back to Gemini API');
        throw new Error('DEEPSEEK_API_KEY_NOT_SET');
    }

    const messages: DeepSeekMessage[] = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const requestBody: DeepSeekRequest = {
        model: DEEPSEEK_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
    };

    if (expectJSON) {
        requestBody.response_format = { type: 'json_object' };
    }

    try {
        const response = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content || '';
    } catch (error) {
        console.error('DeepSeek API call failed:', error);
        throw error;
    }
};

// Parse JSON from response
const parseJSON = <T>(text: string): T => {
    let cleanedText = text.trim();
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = cleanedText.match(jsonBlockRegex);

    if (match && match[1]) {
        cleanedText = match[1];
    }

    cleanedText = cleanedText.trim();
    return JSON.parse(cleanedText) as T;
};

// Export all functions - text generation uses DeepSeek, audio uses Gemini
export const getSpeech = geminiService.getSpeech;
export const playAudio = geminiService.playAudio;
export const resumeAudioContext = geminiService.resumeAudioContext;

// Text generation functions using DeepSeek
export const getGrammarExplanation = async (topicTitle: string, language: Language): Promise<string> => {
    try {
        const prompt = `Explain the French B1 grammar topic: "${topicTitle}". 
Provide the explanation in ${language} language.
Structure the response with clear headings, bullet points, and plenty of examples.
Focus on usage, formation, and common mistakes.
Format the entire response using simple Markdown. Use ## for headings, * for bullet points, and ** for important words. Do not use any other Markdown features like blockquotes or code blocks.
Ensure examples are marked. Use a double newline to separate paragraphs.`;

        return await callDeepSeek(prompt);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getGrammarExplanation(topicTitle, language);
        }
        console.error("Error fetching grammar:", error);
        return "Error connecting to AI service. Please check your API key.";
    }
};

export const getVerbConjugation = async (verb: string, language: Language): Promise<VerbConjugation> => {
    try {
        const prompt = `Conjugate the French verb "${verb}" for a B1 student. 
Provide the translation in ${language}.
Return ONLY a valid JSON object with this exact structure:
{
  "verb": "${verb}",
  "translation": "translation in ${language}",
  "tenses": {
    "present": ["Je form", "Tu form", "Il/Elle form", "Nous form", "Vous form", "Ils/Elles form"],
    "passeCompose": ["J'ai/suis...", "Tu as/es...", "Il/Elle a/est...", "Nous avons/sommes...", "Vous avez/êtes...", "Ils/Elles ont/sont..."],
    "imparfait": ["Je form", "Tu form", "Il/Elle form", "Nous form", "Vous form", "Ils/Elles form"],
    "futurSimple": ["Je form", "Tu form", "Il/Elle form", "Nous form", "Vous form", "Ils/Elles form"],
    "conditionnel": ["Je form", "Tu form", "Il/Elle form", "Nous form", "Vous form", "Ils/Elles form"],
    "plusQueParfait": ["J'avais/étais...", "Tu avais/étais...", "Il/Elle avait/était...", "Nous avions/étions...", "Vous aviez/étiez...", "Ils/Elles avaient/étaient..."],
    "subjonctifPresent": ["que je form", "que tu form", "qu'il/elle form", "que nous form", "que vous form", "qu'ils/elles form"]
  }
}`;

        const response = await callDeepSeek(prompt, undefined, true);
        return parseJSON<VerbConjugation>(response);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getVerbConjugation(verb, language);
        }
        throw error;
    }
};

export const getQuiz = async (topicTitle: string, language: Language): Promise<QuizQuestion[]> => {
    try {
        const prompt = `Generate a JSON array of exactly 10 multiple-choice questions for the French B1 grammar topic: "${topicTitle}".
The questions and options must be in French.
The explanation for the correct answer must be in ${language}.
Return ONLY a valid JSON array with this structure:
[{
  "question": "question text in French",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswerIndex": 0,
  "explanation": "explanation in ${language}"
}]`;

        const response = await callDeepSeek(prompt, undefined, true);
        return parseJSON<QuizQuestion[]>(response);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getQuiz(topicTitle, language);
        }
        return [];
    }
};

export const getFlashcards = async (category: string, language: Language): Promise<Flashcard[]> => {
    try {
        let promptText = `Generate 10 French B1 flashcards for the category/topic: "${category}". 
The back of the card must be the translation in ${language}.
Return ONLY a valid JSON array.`;

        if (category === 'Le Plus-que-parfait' || category === 'Exprimer le Regret (Si seulement...)') {
            promptText = `Generate 10 French B1 flashcards for the topic: "${category}". 
The flashcards should primarily focus on using the structure "Si seulement..." to express regret (e.g., front: "Si seulement j'avais su.", back: "If only I had known.").
The back of the card must be the translation in ${language}.
Return ONLY a valid JSON array with structure: [{"front": "French phrase", "back": "translation", "example": "example sentence"}]`;
        }

        const response = await callDeepSeek(promptText, undefined, true);
        return parseJSON<Flashcard[]>(response);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getFlashcards(category, language);
        }
        return [];
    }
};

export const getDailyPhrases = async (topic: string, tense: string, language: Language): Promise<Phrase[]> => {
    try {
        let promptText = `Generate 8 useful French sentences for the topic: "${topic}", primarily using the "${tense}" tense.
These sentences should be ideal for a B1 level learner.
Ensure they use common B1 vocabulary and grammatical structures (like subjunctive, conditional, relative pronouns where appropriate).
Provide a clear translation and a simple context in ${language}.
Return a valid JSON array with structure: [{"french": "sentence", "translation": "translation", "context": "context"}]`;

        if (topic === 'Si Conditionnel (If Conditional)') {
            promptText = `Generate 8 useful French conditional ("if...then...") sentences.
The "si" clause should use the "${tense}" tense.
The main clause should use the grammatically correct corresponding tense (e.g., Futur Simple for Présent, Conditionnel for Imparfait, Conditionnel Passé for Plus-que-parfait).
These sentences should be ideal for a B1 level learner.
Provide a clear translation and a simple context in ${language}.
Return a valid JSON array.`;
        } else if (topic === 'Si Seulement (If Only)') {
            promptText = `Generate 8 useful French sentences expressing a wish or regret using "Si seulement...".
The verb following "Si seulement" should be in the "${tense}" tense.
Use Imparfait for present wishes and Plus-que-parfait for past regrets.
These sentences should be ideal for a B1 level learner.
Provide a clear translation and a simple context in ${language}.
Return a valid JSON array.`;
        }

        const response = await callDeepSeek(promptText, undefined, true);
        return parseJSON<Phrase[]>(response);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getDailyPhrases(topic, tense, language);
        }
        return [];
    }
};

// Migrated Practice Examples and Prompts to DeepSeek
export const getExamPrompts = async (): Promise<{
    listening: string;
    reading: string;
    writing: string;
    speakingContinuous: string;
    speakingInteraction: string;
}> => {
    try {
        const prompt = `
    Générez 5 sujets de pratique pour le Français B1, basés sur le syllabus suivant. Le vocabulaire doit être STRICTEMENT de niveau A2-B1 (simple et courant). Retournez un seul objet JSON valide.

    **Syllabus (Strict):**
    - **Savoir:** Raconter un événement au passé, présenter son logement/quartier, exprimer des souhaits, résumer un fait divers.
    - **Langue:** Passé composé, Imparfait, Plus-que-parfait, Conditionnel, Futur simple/proche.
    - **Structures:** "Si j'avais... j'aurais...", "Si seulement...".

    **Structure JSON:**
    {
      "listening": "Un court texte ou dialogue (environ 100 mots) destiné à la compréhension orale sur un des thèmes.",
      "reading": "Un court texte (environ 150 mots) destiné à la compréhension écrite (ex: email, article simple).",
      "writing": "Un sujet de production écrite (80-100 mots) demandant de raconter une expérience passée ou de décrire un projet futur.",
      "speakingContinuous": "Un sujet de monologue (1-2 minutes) pour décrire une expérience ou exprimer un souhait.",
      "speakingInteraction": "Un scénario de jeu de rôle pour échanger des informations sur un des thèmes."
    }
    **Instructions Spécifiques:**
    - Pour les thèmes "Logement" and "Quartier", utilisez la **Belgique** comme contexte (ex: Bruxelles, Liège, maison typique en brique).
    `;

        const response = await callDeepSeek(prompt, undefined, true);
        return parseJSON<any>(response);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getExamPrompts();
        }
        // Fallback prompts
        return {
            listening: "Écoutez ce dialogue entre deux amis qui parlent de leurs dernières vacances.",
            reading: "Lisez ce courriel d'un ami qui vous invite à visiter sa nouvelle maison à Bruxelles.",
            writing: "Racontez un souvenir d'enfance. Décrivez où vous étiez (imparfait) et racontez une chose amusante qui est arrivée (passé composé).",
            speakingContinuous: "Décrivez votre week-end idéal. Qu'est-ce que vous feriez s'il n'y avait aucune limite ?",
            speakingInteraction: "Vous voulez réserver une table dans un restaurant pour l'anniversaire d'un ami. Téléphonez au restaurant pour demander des informations et faire une réservation."
        };
    }
};

export const getWritingFeedback = async (promptText: string, userText: string, language: Language): Promise<string> => {
    try {
        const prompt = `En tant que professeur de FLE, évaluez la production écrite suivante pour un niveau B1.
        Consigne: "${promptText}"
        Texte de l'étudiant: "${userText}"
        
        Fournissez un feedback constructif en ${language} incluant:
        1. Une appréciation globale.
        2. Les points forts (vocabulaire, grammaire).
        3. Les points à améliorer.
        4. Une proposition de correction pour les erreurs majeures.
        Utilisez le Markdown pour la mise en forme (##, *, **).`;

        return await callDeepSeek(prompt);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getWritingFeedback(promptText, userText, language);
        }
        return "Impossible de générer le feedback pour le moment.";
    }
};

export const getWritingExample = async (promptText: string): Promise<{ modelAnswer: string; analysis: string; }> => {
    try {
        const prompt = `Pour la consigne de niveau B1 suivante: "${promptText}", générez un objet JSON contenant:
        1. Un texte modèle ('modelAnswer') en français (80-100 mots) qui répond parfaitement à la consigne. Utilisez un vocabulaire simple et courant (niveau A2-B1). Si le sujet concerne le logement ou le quartier, situez l'action en **Belgique** (ex: Bruxelles). Incluez des ** pour mettre en évidence les mots grammaticaux clés.
        2. Une brève analyse ('analysis') en français expliquant pourquoi le texte est un bon exemple pour le niveau B1 (utilisation des temps, vocabulaire, connecteurs). Formatez l'analyse en Markdown simple avec des titres (##) et des listes (*).`;

        const response = await callDeepSeek(prompt, undefined, true);
        return parseJSON<{ modelAnswer: string; analysis: string; }>(response);
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getWritingExample(promptText);
        }
        return { modelAnswer: "Could not generate a model response.", analysis: "" };
    }
};

export const getSpeakingExample = async (promptText: string, language: Language): Promise<{ text: string; audio: string }> => {
    try {
        const prompt = `Générez une réponse modèle en français pour un étudiant B1 pour le sujet de conversation suivant: "${promptText}". La réponse doit être naturelle, comme si quelqu'un parlait, et faire environ 1 minute de parole. La réponse doit utiliser des temps et du vocabulaire simples et pertinents pour le niveau A2-B1. Si le sujet concerne le logement ou le quartier, situez l'action en **Belgique** (ex: Bruxelles).`;

        const text = await callDeepSeek(prompt);
        let audio = "";
        try {
            audio = await getSpeech(text);
        } catch (e) {
            console.error("Speaking example audio failed", e);
        }
        return { text, audio };
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getSpeakingExample(promptText, language);
        }
        return { text: "Je ne sais pas quoi dire pour le moment.", audio: "" };
    }
};

export const getListeningExample = async (promptText: string): Promise<{ text: string; audio: string }> => {
    try {
        const prompt = `Pour la consigne de compréhension orale suivante: "${promptText}", générez un dialogue naturel en français (niveau B1) entre deux personnes. Le vocabulaire doit être simple et courant. Si le sujet s'y prête, utilisez un contexte belge.`;

        const text = await callDeepSeek(prompt);
        let audio = "";
        try {
            audio = await getSpeech(text);
        } catch (e) {
            console.error("Listening example audio failed", e);
        }
        return { text, audio };
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getListeningExample(promptText);
        }
        return { text: "Erreur de génération du dialogue.", audio: "" };
    }
};

export const getReadingExample = async (promptText: string): Promise<{ text: string }> => {
    try {
        const prompt = `Pour la consigne de compréhension écrite suivante: "${promptText}", générez un court texte en français (niveau B1) d'environ 150 mots. Il peut s'agir d'un email, d'un article de blog, ou d'une histoire. Le vocabulaire doit être simple. Si le sujet s'y prête, utilisez un contexte belge.`;

        const text = await callDeepSeek(prompt);
        return { text };
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getReadingExample(promptText);
        }
        return { text: "Erreur de génération du texte." };
    }
};

export const getComprehensiveExamData = async (language: Language) => {
    try {
        const prompt = `
    Créez un examen complet de français niveau B1, en respectant scrupuleusement le syllabus fourni. Le vocabulaire doit être STRICTEMENT adapté au niveau A2-B1 (mots fréquents et simples). Retournez un seul objet JSON valide.

    **Syllabus Clés (Strict):**
    1.  **Thèmes:** Logement, quartier, enfance, projets futurs, fait divers.
    2.  **Savoir (Compétences):**
        - Raconter un événement au passé en articulant les temps (PC, Imparfait, PQP).
        - Présenter son logement ou son quartier.
        - Exprimer des souhaits (conditionnel).
        - Résumer un fait divers.
        - Exprimer des actions futures.
    3.  **Langue (Grammaire):**
        - Passé: Imparfait, Plus-que-parfait, Passé composé.
        - Présent: Indicatif et Conditionnel.
        - Futur: Simple et Proche.
        - Structures: "Si j'avais..., j'aurais..." / "Si seulement il avait fait ça !".

    **Structure JSON de sortie:**
    {
      "listening": {
        "text": "Un dialogue de ~120 mots entre deux personnes sur un des thèmes, utilisant un mélange des temps requis.",
        "questions": [ { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswerIndex": 0, "explanation": "Explication en ${language}" } ] // 4 questions
      },
      "reading": {
        "text": "Un texte court de ~150 mots (email, blog post) sur un des thèmes, utilisant un mélange des temps requis.",
        "questions": [ { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswerIndex": 0, "explanation": "Explication en ${language}" } ] // 4 questions
      },
      "writing": {
        "prompt": "Un sujet qui demande explicitement à l'étudiant de raconter une expérience passée en utilisant l'imparfait pour la description et le passé composé pour les actions."
      },
      "speaking": {
        "continuousPrompt": "Un sujet de production orale en continu qui demande de décrire une expérience personnelle ou de parler de projets futurs.",
        "interactionPrompt": "Un scénario de jeu de rôle pour une interaction orale qui nécessite d'échanger des informations sur des événements passés et futurs."
      }
    }
    **Instructions Spécifiques:**
    - Pour les thèmes "Logement" and "Quartier", la réponse ou le scénario DOIT se dérouler en **Belgique** (ex: Bruxelles).
    Assurez-vous que le contenu de chaque section (listening, reading, writing, speaking) reflète fidèlement les thèmes et la grammaire du syllabus.
    `;

        const response = await callDeepSeek(prompt.replace('${language}', language), undefined, true);
        const examData = parseJSON<any>(response);

        // Fetch audio for the listening text using Gemini TTS
        try {
            examData.listening.audio = await getSpeech(examData.listening.text);
        } catch (error) {
            console.error("Audio generation failed for exam, proceeding without audio:", error);
            examData.listening.audio = "";
        }

        return examData;
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getComprehensiveExamData(language);
        }
        console.error("Error generating comprehensive exam data", error);
        throw new Error("Failed to generate the exam based on the syllabus.");
    }
};

export const getExamenBlancGeneratorData = async (language: Language) => {
    try {
        const prompt = `
    Créez un EXAMEN BLANC complet (type B1 FLE), basé sur le guide "Groupe de FLE Caramel : évaluations de janvier 2025".

    **Syllabus & Contraintes:**
    1.  **Thèmes:** Logement, quartier, enfance, projets futurs, fait divers.
        - Pour "Logement/Quartier", le contexte DOIT être la **Belgique** (architecture, villes comme Bruxelles/Liège).
    2.  **Grammaire & Langue:**
        - Temps du passé: Passé Composé, Imparfait, Plus-que-parfait.
        - Futur: Simple, Proche, Conditionnel (souhaits, politesse).
        - Structures: "Si j'avais... j'aurais...", "Si seulement...".
    3.  **Sections Requises (6 au total):**
        - I. Compréhension de l'Oral (Dialogue ~1 min)
        - II. Compréhension de l'Écrit (Texte ~150 mots)
        - III. Production Écrite (2 choix de sujets)
        - IV. Interaction Orale (2 situations de jeu de rôle)
        - V. Production Orale en Continu (2 thèmes de monologue)
        - VI. Grammaire & Lexique (Exercices à trous, transformations)

    **Format de Sortie JSON (AVEC CORRIGÉS):**
    {
      "listening": {
        "text": "Texte du dialogue...",
        "questions": [
           { "question": "Question 1...", "answer": "Réponse correcte..." },
           { "question": "Question 2...", "answer": "Réponse correcte..." }
        ]
      },
      "reading": {
        "text": "Texte à lire...",
        "questions": [
            { "question": "Question 1...", "answer": "Réponse correcte..." }
        ],
        "trueFalse": [
            { "statement": "Affirmation 1", "answer": "Vrai ou Faux, car..." },
            { "statement": "Affirmation 2", "answer": "Vrai ou Faux, car..." }
        ]
      },
      "writing": {
        "topicA": "Sujet A...",
        "topicB": "Sujet B...",
        "correctionModels": { "topicA": "Points clés à inclure...", "topicB": "Points clés à inclure..." }
      },
      "speakingInteraction": {
         "situation1": { "title": "Titre Sit 1", "points": ["..."], "rolePlayKey": "Conseils pour l'interaction..." },
         "situation2": { "title": "Titre Sit 2", "points": ["..."], "rolePlayKey": "Conseils pour l'interaction..." }
      },
      "speakingContinuous": {
         "theme1": "Thème 1...",
         "theme2": "Thème 2...",
         "modelPoints": { "theme1": ["Idée 1", "Idée 2"], "theme2": ["Idée 1", "Idée 2"] }
      },
      "grammar": {
         "exercise1": { "instruction": "...", "sentences": [ { "phrase": "Phrase à trou...", "answer": "Réponse complète" } ] },
         "exercise2": { "instruction": "...", "sentences": [ { "phrase": "Phrase à compléter...", "answer": "Réponse complète" } ] },
         "exercise3": { "instruction": "...", "sentences": [ { "phrase": "Phrase à transformer...", "answer": "Réponse transformée" } ] },
         "lexicon": { "instruction": "...", "theme": "...", "solution": ["Mot 1", "Mot 2", "Mot 3", "Mot 4", "Mot 5"] }
      }
    }
    `;

        const response = await callDeepSeek(prompt, undefined, true);
        const examData = parseJSON<any>(response);

        if (examData?.listening?.text) {
            try {
                examData.listening.audio = await getSpeech(examData.listening.text);
            } catch (error) {
                console.error("Audio generation failed for Examen Blanc, proceeding without audio:", error);
                examData.listening.audio = null;
            }
        }
        return examData;
    } catch (error: any) {
        if (error.message === 'DEEPSEEK_API_KEY_NOT_SET') {
            return await geminiService.getExamenBlancGeneratorData(language);
        }
        console.error("Error generating Examen Blanc Generator data", error);
        throw new Error("Failed to generate exam.");
    }
};


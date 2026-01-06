// DeepSeek Service - Routes text generation to DeepSeek for better quota management
// Audio generation still uses Gemini from the main geminiService

import * as geminiService from './geminiService';
import { VerbConjugation, QuizQuestion, Flashcard, Phrase, Language } from "../types";

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

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
    const apiKey = process.env.DEEPSEEK_API_KEY;

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

// For exam generation, delegate to Gemini service for now (complex structured output)
export const getExamPrompts = geminiService.getExamPrompts;
export const getComprehensiveExamData = geminiService.getComprehensiveExamData;
export const getExamenBlancGeneratorData = geminiService.getExamenBlancGeneratorData;
export const getWritingFeedback = geminiService.getWritingFeedback;
export const getWritingExample = geminiService.getWritingExample;
export const getSpeakingExample = geminiService.getSpeakingExample;
export const getListeningExample = geminiService.getListeningExample;
export const getReadingExample = geminiService.getReadingExample;

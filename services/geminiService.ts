import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VerbConjugation, QuizQuestion, Flashcard, Phrase, Language } from "../types";
import { dbService } from './dbService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Updated model name to a recommended one for better performance.
const modelName = 'gemini-3-flash-preview';

// --- Helper Functions ---

const parseGeminiJson = <T>(text: string | undefined): T => {
    if (!text) {
        throw new Error("No text returned from API");
    }
    let cleanedText = text.trim();
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = cleanedText.match(jsonBlockRegex);

    if (match && match[1]) {
        cleanedText = match[1];
    }

    cleanedText = cleanedText.trim();
    return JSON.parse(cleanedText) as T;
};


function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// Initialize AudioContext lazily.
let audioContext: AudioContext | null = null;

export const resumeAudioContext = async () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
};

export const playAudio = async (base64Audio: string) => {
    if (!base64Audio) {
        console.error("playAudio called with empty or invalid audio data.");
        return;
    }
    try {
        // On mobile, the AudioContext must be resumed by a user gesture.
        // On mobile, the AudioContext must be resumed by a user gesture.
        await resumeAudioContext();

        if (!audioContext) {
            console.error("AudioContext not initialized");
            return;
        }

        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            audioContext,
            24000,
            1,
        );
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (e) {
        console.error("Failed to play audio", e);
    }
}

// --- API Service Functions ---

export const getSpeech = async (text: string): Promise<string> => {
    const cachedData = await dbService.getSpeech(text);
    if (cachedData) return cachedData;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            await dbService.setSpeech(text, base64Audio);
            return base64Audio;
        }
        throw new Error("No audio data returned");
    } catch (error) {
        console.error("Error fetching speech:", error);
        throw error;
    }
};

export const getGrammarExplanation = async (topicTitle: string, language: Language): Promise<string> => {
    const cachedData = await dbService.getGrammar(topicTitle, language);
    if (cachedData) return cachedData;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Explain the French B1 grammar topic: "${topicTitle}". 
      Provide the explanation in ${language} language.
      Structure the response with clear headings, bullet points, and plenty of examples.
      Focus on usage, formation, and common mistakes.
      Format the entire response using simple Markdown. Use ## for headings, * for bullet points, and ** for important words. Do not use any other Markdown features like blockquotes or code blocks.
      Ensure examples are marked. Use a double newline to separate paragraphs.`,
        });
        const explanationText = response.text || "Sorry, I couldn't generate an explanation at this time.";
        await dbService.setGrammar(topicTitle, language, explanationText);
        return explanationText;
    } catch (error) {
        console.error("Error fetching grammar:", error);
        return "Error connecting to AI service. Please check your API key.";
    }
};

export const getVerbConjugation = async (verb: string, language: Language): Promise<VerbConjugation> => {
    const cachedData = await dbService.getVerb(verb, language);
    if (cachedData) return cachedData;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Conjugate the French verb "${verb}" for a B1 student. 
      Provide the translation in ${language}.
      Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        verb: { type: Type.STRING },
                        translation: { type: Type.STRING, description: `Translation in ${language}` },
                        tenses: {
                            type: Type.OBJECT,
                            properties: {
                                present: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Je, Tu, Il/Elle, Nous, Vous, Ils/Elles" },
                                passeCompose: { type: Type.ARRAY, items: { type: Type.STRING } },
                                imparfait: { type: Type.ARRAY, items: { type: Type.STRING } },
                                futurSimple: { type: Type.ARRAY, items: { type: Type.STRING } },
                                conditionnel: { type: Type.ARRAY, items: { type: Type.STRING } },
                                plusQueParfait: { type: Type.ARRAY, items: { type: Type.STRING } },
                                subjonctifPresent: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ["present", "passeCompose", "imparfait", "futurSimple", "conditionnel", "plusQueParfait", "subjonctifPresent"]
                        }
                    },
                    required: ["verb", "translation", "tenses"]
                }
            }
        });

        const conjugationData = parseGeminiJson<VerbConjugation>(response.text);
        await dbService.setVerb(verb, language, conjugationData);
        return conjugationData;
    } catch (error) {
        console.error("Error fetching conjugation:", error);
        throw error;
    }
};

export const getQuiz = async (topicTitle: string, language: Language): Promise<QuizQuestion[]> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Generate a JSON array of exactly 10 multiple-choice questions for the French B1 grammar topic: "${topicTitle}".
      The questions and options must be in French.
      The explanation for the correct answer must be in ${language}.
      Ensure the JSON is valid and complete.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of exactly 4 options" },
                            correctAnswerIndex: { type: Type.INTEGER, description: "0-based index of correct option" },
                            explanation: { type: Type.STRING, description: `Short explanation in ${language} of why it is correct` }
                        },
                        required: ["question", "options", "correctAnswerIndex", "explanation"]
                    }
                }
            }
        });

        const quizData = parseGeminiJson<QuizQuestion[]>(response.text);
        return quizData;
    } catch (error) {
        console.error("Error generating quiz:", error);
        return [];
    }
};

export const getFlashcards = async (category: string, language: Language): Promise<Flashcard[]> => {
    const cachedData = await dbService.getFlashcards(category, language);
    if (cachedData) return cachedData;

    let contents = `Generate 10 French B1 flashcards for the category/topic: "${category}". 
            The back of the card must be the translation in ${language}.
            Return a valid, complete JSON array.`;

    if (category === 'Le Plus-que-parfait' || category === 'Exprimer le Regret (Si seulement...)') {
        contents = `Generate 10 French B1 flashcards for the topic: "${category}". 
        The flashcards should primarily focus on using the structure "Si seulement..." to express regret (e.g., front: "Si seulement j'avais su.", back: "If only I had known.").
        The back of the card must be the translation in ${language}.
        Return a valid, complete JSON array.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            front: { type: Type.STRING, description: "French word or short phrase" },
                            back: { type: Type.STRING, description: `Translation in ${language}` },
                            example: { type: Type.STRING, description: "Example sentence in French" }
                        },
                        required: ["front", "back", "example"]
                    }
                }
            }
        });
        const flashcardsData = parseGeminiJson<Flashcard[]>(response.text);
        await dbService.setFlashcards(category, language, flashcardsData);
        return flashcardsData;
    } catch (error) {
        console.error("Error fetching flashcards", error);
        return [];
    }
}

export const getDailyPhrases = async (topic: string, tense: string, language: Language): Promise<Phrase[]> => {
    const cachedData = await dbService.getPhrases(topic, tense, language);
    if (cachedData) return cachedData;

    let contents = `Generate 8 useful French sentences for the topic: "${topic}", primarily using the "${tense}" tense.
    These sentences should be ideal for a B1 level learner.
    Ensure they use common B1 vocabulary and grammatical structures (like subjunctive, conditional, relative pronouns where appropriate).
    Provide a clear translation and a simple context in ${language}.
    Return a valid, complete JSON array.`;

    if (topic === 'Si Conditionnel (If Conditional)') {
        contents = `Generate 8 useful French conditional ("if...then...") sentences.
        The "si" clause should use the "${tense}" tense.
        The main clause should use the grammatically correct corresponding tense (e.g., Futur Simple for Présent, Conditionnel for Imparfait, Conditionnel Passé for Plus-que-parfait).
        These sentences should be ideal for a B1 level learner.
        Provide a clear translation and a simple context in ${language}.
        Return a valid, complete JSON array.`;
    } else if (topic === 'Si Seulement (If Only)') {
        contents = `Generate 8 useful French sentences expressing a wish or regret using "Si seulement...".
        The verb following "Si seulement" should be in the "${tense}" tense.
        Use Imparfait for present wishes and Plus-que-parfait for past regrets.
        These sentences should be ideal for a B1 level learner.
        Provide a clear translation and a simple context in ${language}.
        Return a valid, complete JSON array.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            french: { type: Type.STRING },
                            translation: { type: Type.STRING, description: `Translation in ${language}` },
                            context: { type: Type.STRING, description: `Context in ${language}` }
                        },
                        required: ["french", "translation", "context"]
                    }
                }
            }
        });
        const phrasesData = parseGeminiJson<Phrase[]>(response.text);
        await dbService.setPhrases(topic, tense, language, phrasesData);
        return phrasesData;
    } catch (error) {
        console.error("Error fetching phrases", error);
        return [];
    }
}

// --- NEW COMPREHENSIVE EXAM GENERATION ---
export const getExamPrompts = async (): Promise<{ writing: string; speakingContinuous: string; speakingInteraction: string; }> => {
    const prompt = `
    Générez 3 sujets d'examen de français niveau B1 basés sur le syllabus suivant. Le vocabulaire doit être STRICTEMENT de niveau A2-B1 (simple et courant). Retournez un seul objet JSON valide.

    **Syllabus (Strict):**
    - **Savoir:** Raconter un événement au passé, présenter son logement/quartier, exprimer des souhaits, résumer un fait divers.
    - **Langue:** Passé composé, Imparfait, Plus-que-parfait, Conditionnel, Futur simple/proche.
    - **Structures:** "Si j'avais... j'aurais...", "Si seulement...".

    **Structure JSON:**
    {
      "writing": "Un sujet de production écrite (80-100 mots) demandant de raconter une expérience passée ou de décrire un projet futur.",
      "speakingContinuous": "Un sujet de monologue (1-2 minutes) pour décrire une expérience ou exprimer un souhait.",
      "speakingInteraction": "Un scénario de jeu de rôle pour échanger des informations sur un des thèmes."
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        writing: { type: Type.STRING, description: "Un sujet d'écriture en français." },
                        speakingContinuous: { type: Type.STRING, description: "Un sujet de monologue en français." },
                        speakingInteraction: { type: Type.STRING, description: "Un scénario de dialogue en français." }
                    },
                    required: ["writing", "speakingContinuous", "speakingInteraction"]
                }
            }
        });

        const prompts = parseGeminiJson<{ writing: string; speakingContinuous: string; speakingInteraction: string; }>(response.text);
        return prompts;

    } catch (e) {
        console.error("Error generating exam prompts", e);
        // Provide some fallback prompts in case of API error
        return {
            writing: "Racontez un souvenir d'enfance. Décrivez où vous étiez (imparfait) et racontez une chose amusante qui est arrivée (passé composé).",
            speakingContinuous: "Décrivez votre week-end idéal. Qu'est-ce que vous feriez s'il n'y avait aucune limite ?",
            speakingInteraction: "Vous voulez réserver une table dans un restaurant pour l'anniversaire d'un ami. Téléphonez au restaurant pour demander des informations et faire une réservation."
        };
    }
};

export const getComprehensiveExamData = async (language: Language) => {
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
    Assurez-vous que le contenu de chaque section (listening, reading, writing, speaking) reflète fidèlement les thèmes et la grammaire du syllabus.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt.replace('${language}', language),
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        listening: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            question: { type: Type.STRING },
                                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            correctAnswerIndex: { type: Type.INTEGER },
                                            explanation: { type: Type.STRING }
                                        },
                                        required: ["question", "options", "correctAnswerIndex", "explanation"]
                                    }
                                }
                            },
                            required: ["text", "questions"]
                        },
                        reading: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                questions: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            question: { type: Type.STRING },
                                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                            correctAnswerIndex: { type: Type.INTEGER },
                                            explanation: { type: Type.STRING }
                                        },
                                        required: ["question", "options", "correctAnswerIndex", "explanation"]
                                    }
                                }
                            },
                            required: ["text", "questions"]
                        },
                        writing: {
                            type: Type.OBJECT,
                            properties: {
                                prompt: { type: Type.STRING }
                            },
                            required: ["prompt"]
                        },
                        speaking: {
                            type: Type.OBJECT,
                            properties: {
                                continuousPrompt: { type: Type.STRING },
                                interactionPrompt: { type: Type.STRING }
                            },
                            required: ["continuousPrompt", "interactionPrompt"]
                        }
                    },
                    required: ["listening", "reading", "writing", "speaking"]
                }
            }
        });
        const examData = parseGeminiJson<any>(response.text);

        // Fetch audio for the listening text
        examData.listening.audio = await getSpeech(examData.listening.text);

        return examData;

    } catch (e) {
        console.error("Error generating comprehensive exam data", e);
        throw new Error("Failed to generate the exam based on the syllabus.");
    }
};


export const getWritingFeedback = async (prompt: string, userText: string, language: Language): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Un étudiant de français niveau B1 a écrit le texte suivant en réponse à cette consigne: "${prompt}". Voici son texte: "${userText}".
            Évaluez le texte et donnez des conseils en ${language}.
            Votre analyse doit se concentrer sur les points suivants, pertinents pour le niveau B1:
            1.  Utilisation correcte des temps du passé (Passé Composé vs Imparfait vs PQP).
            2.  Utilisation du vocabulaire et des connecteurs logiques.
            3.  Structure des phrases.
            4.  Points forts du texte.
            Formatez la réponse en Markdown simple. Utilisez ## pour les titres et * pour les listes. Soyez encourageant.`,
        });
        return response.text || "Sorry, I couldn't generate feedback at this time.";
    } catch (error) {
        console.error("Error getting writing feedback:", error);
        return "Error getting feedback from AI service.";
    }
};

export const getWritingExample = async (prompt: string): Promise<{ modelAnswer: string; analysis: string; }> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Pour la consigne de niveau B1 suivante: "${prompt}", générez un objet JSON contenant:
            1. Un texte modèle ('modelAnswer') en français (80-100 mots) qui répond parfaitement à la consigne. Utilisez un vocabulaire simple et courant (niveau A2-B1). Incluez des ** pour mettre en évidence les mots grammaticaux clés.
            2. Une brève analyse ('analysis') en français expliquant pourquoi le texte est un bon exemple pour le niveau B1 (utilisation des temps, vocabulaire, connecteurs). Formatez l'analyse en Markdown simple avec des titres (##) et des listes (*).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        modelAnswer: { type: Type.STRING, description: "Texte modèle en français (80-100 mots)." },
                        analysis: { type: Type.STRING, description: "Analyse du texte en Markdown simple." }
                    },
                    required: ["modelAnswer", "analysis"]
                }
            }
        });
        const data = parseGeminiJson<{ modelAnswer: string; analysis: string; }>(response.text);
        return data || { modelAnswer: "Could not generate a model response.", analysis: "" };
    } catch (error) {
        console.error("Error getting writing example:", error);
        throw error;
    }
};


export const getSpeakingExample = async (prompt: string, language: Language): Promise<{ text: string; audio: string }> => {
    try {
        const textResponse = await ai.models.generateContent({
            model: modelName,
            contents: `Générez une réponse modèle en français pour un étudiant B1 pour le sujet de conversation suivant: "${prompt}". La réponse doit être naturelle, comme si quelqu'un parlait, et faire environ 1 minute de parole. La réponse doit utiliser des temps et du vocabulaire simples et pertinents pour le niveau A2-B1.`,
        });
        const text = textResponse.text || "Je ne sais pas quoi dire pour le moment.";
        const audio = await getSpeech(text);
        return { text, audio };
    } catch (error) {
        console.error("Error getting speaking example:", error);
        throw error;
    }
};
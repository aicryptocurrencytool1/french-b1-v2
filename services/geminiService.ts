import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VerbConjugation, QuizQuestion, Flashcard, Phrase, Language } from "../types";
import { dbService } from './dbService';

// Fallback to VITE_API_KEY if process.env.API_KEY is not set (for local dev)
const GEMINI_API_KEY = process.env.API_KEY || process.env.VITE_DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const modelName = 'gemini-2.0-flash-exp'; // Using the fast flash model for everything

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
    if (!base64Audio) return;
    try {
        await resumeAudioContext();
        if (!audioContext) return;

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

export const getSpeech = async (text: string): Promise<string> => {
    const cachedData = await dbService.getSpeech(text);
    if (cachedData) return cachedData;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
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

// Fallback Text Generation Functions
export const getGrammarExplanation = async (topicTitle: string, language: Language): Promise<string> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Explain French B1 grammar: "${topicTitle}" in ${language}. Use headings and examples.`,
    });
    return response.text;
};

export const getVerbConjugation = async (verb: string, language: Language): Promise<VerbConjugation> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Conjugate "${verb}" for B1 level. Return JSON.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    verb: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    tenses: {
                        type: Type.OBJECT,
                        properties: {
                            present: { type: Type.ARRAY, items: { type: Type.STRING } },
                            passeCompose: { type: Type.ARRAY, items: { type: Type.STRING } },
                            imparfait: { type: Type.ARRAY, items: { type: Type.STRING } },
                            futurSimple: { type: Type.ARRAY, items: { type: Type.STRING } },
                            conditionnel: { type: Type.ARRAY, items: { type: Type.STRING } },
                            plusQueParfait: { type: Type.ARRAY, items: { type: Type.STRING } },
                            subjonctifPresent: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            }
        }
    });
    return parseGeminiJson<VerbConjugation>(response.text);
};

export const getQuiz = async (topicTitle: string, language: Language): Promise<QuizQuestion[]> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Generate 10 B1 quiz questions for "${topicTitle}" in ${language}. Return JSON array.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<QuizQuestion[]>(response.text);
};

export const getFlashcards = async (category: string, language: Language): Promise<Flashcard[]> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Generate 10 B1 flashcards for "${category}" in ${language}. Return JSON array.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<Flashcard[]>(response.text);
};

export const getDailyPhrases = async (topic: string, tense: string, language: Language): Promise<Phrase[]> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Generate 8 B1 phrases for "${topic}" in "${tense}" tense. Return JSON array.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<Phrase[]>(response.text);
};

export const getExamPrompts = async (): Promise<any> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Generate 5 B1 practice prompts. Return JSON.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<any>(response.text);
};

export const getWritingFeedback = async (prompt: string, userText: string, language: Language): Promise<string> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Evaluate this B1 French text for prompt "${prompt}": "${userText}". Provide feedback in ${language}.`,
    });
    return response.text;
};

export const getWritingExample = async (prompt: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Provide a model answer for B1 prompt: "${prompt}". Return JSON with modelAnswer and analysis.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<any>(response.text);
};

export const getSpeakingExample = async (prompt: string, language: Language): Promise<any> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Provide a B1 speaking model for prompt: "${prompt}".`,
    });
    const text = response.text;
    const audio = await getSpeech(text);
    return { text, audio };
};

export const getListeningExample = async (prompt: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Provide a B1 listening dialogue for prompt: "${prompt}".`,
    });
    const text = response.text;
    const audio = await getSpeech(text);
    return { text, audio };
};

export const getReadingExample = async (prompt: string): Promise<any> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Provide a B1 reading text for prompt: "${prompt}".`,
    });
    return { text: response.text };
};

export const getComprehensiveExamData = async (language: Language): Promise<any> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Generate a full B1 exam in ${language}. Return JSON.`,
        config: { responseMimeType: "application/json" }
    });
    const data = parseGeminiJson<any>(response.text);
    data.listening.audio = await getSpeech(data.listening.text);
    return data;
};

export const getExamenBlancGeneratorData = async (language: Language): Promise<any> => {
    const response = await ai.models.generateContent({
        model: modelName,
        contents: `Generate a full Examen Blanc B1 in ${language}. Return JSON.`,
        config: { responseMimeType: "application/json" }
    });
    const data = parseGeminiJson<any>(response.text);
    if (data.listening?.text) {
        data.listening.audio = await getSpeech(data.listening.text);
    }
    return data;
};
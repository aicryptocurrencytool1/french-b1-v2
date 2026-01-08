import { GoogleGenAI, Modality } from "@google/genai";
import { VerbConjugation, QuizQuestion, Flashcard, Phrase, Language } from "../types";
import { dbService } from './dbService';
import { getUserContext } from "../userProfile";

// Fallback to Gemini keys only
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || "" });
const modelName = 'gemini-1.5-flash'; // High-availability stable model

const parseGeminiJson = <T>(text: string | undefined): T => {
    if (!text) {
        throw new Error("No text returned from API");
    }
    let cleanedText = text.trim();

    // 1. Try to extract from markdown block
    const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = cleanedText.match(jsonBlockRegex);
    if (match && match[1]) {
        cleanedText = match[1];
    } else {
        // 2. Fallback: Extract between first { and last }
        const firstBrace = cleanedText.indexOf('{');
        const lastBrace = cleanedText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
        }
    }

    try {
        cleanedText = cleanedText.trim();
        return JSON.parse(cleanedText) as T;
    } catch (e) {
        console.error("Gemini JSON Parse Error. Cleaned text:", cleanedText);
        throw e;
    }
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
        const response: any = await ai.models.generateContent({
            model: modelName,
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
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{
            role: "user", parts: [{
                text: `Explain French B1 grammar: "${topicTitle}" for Ahmad in ${language}.
        ${context}
        STYLE (DEEP DIVE & SIMPLE): Persona: Friendly funny coach. Detailed tone. Clear metaphor.
        Structure: 
        ## 1. Son Job (Its Job) -> LONG detailed explanation (2-3 paragraphs).
        ## 2. The Metaphor
        ## 3. Dans ma vraie vie (At least 4 examples using **JE** only - Liège/Lebanon context)
        ## 4. The Secret Trick (Rule of thumb).
        Use **bold** for French words.` }]
        }],
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const getVerbConjugation = async (verb: string, language: Language): Promise<VerbConjugation> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Conjugate "${verb}" for B1 level in ${language}. ${context} Return JSON.` }] }],
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<VerbConjugation>(response.candidates?.[0]?.content?.parts?.[0]?.text);
};

export const getQuiz = async (topicTitle: string, language: Language): Promise<QuizQuestion[]> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{
            role: "user", parts: [{
                text: `Generate 10 B1 quiz questions for Ahmad: "${topicTitle}" in ${language}. 
        ${context}
        Use Ahmad's context (Liège/Lebanon). return JSON object: {"questions": [{"question": "...", "options": ["A","B","C","D"], "correctAnswerIndex": 0, "explanation": "..."}]}.`
            }]
        }],
        config: { responseMimeType: "application/json" }
    });
    const parsed = parseGeminiJson<{ questions: QuizQuestion[] }>(response.candidates?.[0]?.content?.parts?.[0]?.text);
    return parsed.questions || [];
};

export const getFlashcards = async (category: string, language: Language): Promise<Flashcard[]> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Generate 10 B1 flashcards for Ahmad: "${category}" in ${language}. ${context} Use Liège/Lebanon examples. Return JSON object: {"cards": [{"front": "...", "back": "...", "example": "..."}]}.` }] }],
        config: { responseMimeType: "application/json" }
    });
    const parsed = parseGeminiJson<{ cards: Flashcard[] }>(response.candidates?.[0]?.content?.parts?.[0]?.text);
    return parsed.cards || [];
};

export const getDailyPhrases = async (topic: string, tense: string, language: Language): Promise<Phrase[]> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Generate 8 B1 phrases for Ahmad: "${topic}" in "${tense}" for Ahmad. ${context} Use his life (Liège/Lebanon). Return JSON object: {"phrases": [{"french": "...", "translation": "...", "context": "..."}]}.` }] }],
        config: { responseMimeType: "application/json" }
    });
    const parsed = parseGeminiJson<{ phrases: Phrase[] }>(response.candidates?.[0]?.content?.parts?.[0]?.text);
    return parsed.phrases || [];
};

export const getExamPrompts = async (): Promise<any> => {
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Generate 5 B1 practice prompts for listening, reading, writing, speaking (continuous and interaction). Use Liège context. Return JSON.` }] }],
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<any>(response.candidates?.[0]?.content?.parts?.[0]?.text);
};

export const getWritingFeedback = async (prompt: string, userText: string, language: Language): Promise<string> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{
            role: "user", parts: [{
                text: `Encouraging B1 feedback for Ahmad on prompt "${prompt}": "${userText}". ${context}
        Output in ${language} with Appreciation, "For Dummies" error guide, and a "Champion version" correcting everything.`
            }]
        }],
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

export const getWritingExample = async (prompt: string): Promise<any> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{
            role: "user", parts: [{
                text: `Provide a model answer for B1 prompt: "${prompt}". 
        ${context}
        Return JSON with modelAnswer and analysis.` }]
        }],
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson<any>(response.candidates?.[0]?.content?.parts?.[0]?.text);
};

export const getSpeakingExample = async (prompt: string, language: Language): Promise<any> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Provide a B1 speaking model for prompt: "${prompt}". ${context}` }] }],
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const audio = await getSpeech(text);
    return { text, audio };
};

export const getListeningExample = async (prompt: string): Promise<any> => {
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Provide a B1 listening dialogue for prompt: "${prompt}". Use 2 speakers.` }] }],
    });
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const audio = await getSpeech(text);
    return { text, audio };
};

export const getReadingExample = async (prompt: string): Promise<any> => {
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Provide a B1 reading text (email/blog) for prompt: "${prompt}".` }] }],
    });
    return { text: response.candidates?.[0]?.content?.parts?.[0]?.text || "" };
};

export const getComprehensiveExamData = async (language: Language): Promise<any> => {
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: `Generate a full B1 exam in ${language}. Return JSON with listening, reading, writing, speaking sections.` }] }],
        config: { responseMimeType: "application/json" }
    });
    const data = parseGeminiJson<any>(response.candidates?.[0]?.content?.parts?.[0]?.text);
    if (data.listening?.text) {
        data.listening.audio = await getSpeech(data.listening.text);
    }
    return data;
};

export const getExamenBlancGeneratorData = async (language: Language): Promise<any> => {
    const context = getUserContext();
    const response: any = await ai.models.generateContent({
        model: modelName,
        contents: [{
            role: "user", parts: [{
                text: `Generate a full Examen Blanc B1 for Ahmad in ${language}. 
        ${context}
        Use his life in Liège (Citadelle) and Lebanon as context. 
        Return JSON object with exactly this schema:
        {
          "listening": { "text": "...", "questions": [{"question": "...", "answer": "..."}] },
          "reading": { "text": "...", "questions": [...], "trueFalse": [{"statement": "...", "answer": "..."}] },
          "writing": { "topicA": "...", "topicB": "...", "correctionModels": {"topicA": "...", "topicB": "..."} },
          "speakingInteraction": { "situation1": {"title": "...", "points": ["..."], "rolePlayKey": "..."}, "situation2": {...} },
          "speakingContinuous": { "theme1": "...", "theme2": "...", "modelPoints": {"theme1": [...], "theme2": [...]} },
          "grammar": { 
             "exercise1": {"instruction": "...", "sentences": [{"phrase": "...", "answer": "..."}]},
             "exercise2": {...}, "exercise3": {...}, 
             "lexicon": {"instruction": "...", "theme": "...", "solution": [...]}
          }
        }`
            }]
        }],
        config: { responseMimeType: "application/json" }
    });
    const data = parseGeminiJson<any>(response.candidates?.[0]?.content?.parts?.[0]?.text);
    if (data.listening?.text) {
        data.listening.audio = await getSpeech(data.listening.text);
    }
    return data;
};
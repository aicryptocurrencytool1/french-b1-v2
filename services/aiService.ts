// DeepSeek Service - Routes text generation to DeepSeek for better quota management
// Audio generation still uses Gemini from the main geminiService

import * as geminiService from './geminiService';
import { VerbConjugation, QuizQuestion, Flashcard, Phrase, Language } from "../types";
import { getUserContext } from '../userProfile';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

const getDeepSeekApiKey = () => {
    // @ts-ignore - process.env is defined by vite
    const key = process.env.VITE_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
    // Check if it's an empty string or the literal string "undefined" (sometimes happens with Vite define)
    if (!key || key === 'undefined' || key === 'null') return null;
    return key;
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

// Helper to call DeepSeek API with retry
const callDeepSeek = async (prompt: string, systemPrompt?: string, expectJSON: boolean = false): Promise<string> => {
    const maxRetries = 2;
    let attempt = 0;

    const executeCall = async (): Promise<string> => {
        const apiKey = getDeepSeekApiKey();
        const isLocal = window.location.hostname === 'localhost';

        if (!apiKey && isLocal) {
            console.warn('DEEPSEEK_API_KEY not set locally, falling back to Gemini API');
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
            ...(expectJSON ? { response_format: { type: 'json_object' } } : {}),
        };

        const apiUrl = isLocal ? DEEPSEEK_API_URL : '/api/deepseek';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (isLocal && apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DEEPSEEK_API_ERROR: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content || '';
    };

    while (attempt < maxRetries) {
        try {
            return await executeCall();
        } catch (error: any) {
            attempt++;
            console.warn(`DeepSeek attempt ${attempt} failed:`, error.message);
            if (attempt >= maxRetries) {
                if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('DEEPSEEK_API_ERROR')) {
                    throw new Error('DEEPSEEK_NETWORK_ERROR');
                }
                throw error;
            }
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
    }
    throw new Error('DEEPSEEK_FAILED_AFTER_RETRIES');
};

// Parse JSON from response
const parseJSON = <T>(text: string): T => {
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
        console.error("JSON Parse Error. Cleaned text:", cleanedText);
        throw e;
    }
};

// Export all functions - text generation uses DeepSeek, audio uses Gemini
export const getSpeech = geminiService.getSpeech;
export const playAudio = geminiService.playAudio;
export const resumeAudioContext = geminiService.resumeAudioContext;

// Text generation functions using DeepSeek
export const getGrammarExplanation = async (topicTitle: string, language: Language): Promise<string> => {
    try {
        const systemPrompt = "You are an expert French grammar teacher. Accuracy is your top priority.";
        const userContext = getUserContext();
        const prompt = `Explain the French B1 grammar topic: "${topicTitle}" for a student named Ahmad. 
Provide the explanation in ${language} language.
${userContext}

**PEDAGOGICAL STYLE (DEEP DIVE & SIMPLE):**
- Persona: A friendly, slightly funny French coach.
- Tone: Extremely simple language, no academic jargon, but **DETAILED**.
- Metaphors: Essential! (e.g., "The Subjunctive is for when you're feeling 'weird', not for facts").
- Sections:
  1. **Son Job (Its Job):** Provide a **LONG**, detailed explanation (2-3 paragraphs) on why this exists and when to use it.
  2. **The Metaphor:** A funny or relatable way to remember it.
  3. **Dans ma vraie vie (In my real life):** Provide **at least 4 detailed examples**. 
     **CRITICAL RULE:** All examples MUST use the first person **"je"** (I). Ahmad must be the protagonist.
     Use Ahmad's life in **Liège** or memories of **Libanon**.
  4. **The "Secret Trick":** A simple, clever rule of thumb for dummies.

**FORMATTING RULES:**
- Use ## for main headings.
- Use **bold** for ALL French words.
- Return ONLY the formatted Markdown.`;

        return await callDeepSeek(prompt, systemPrompt);
    } catch (error: any) {
        console.warn("DeepSeek grammar fetch failed, falling back to Gemini:", error);
        return await geminiService.getGrammarExplanation(topicTitle, language);
    }
};

export const getVerbConjugation = async (verb: string, language: Language): Promise<VerbConjugation> => {
    try {
        const systemPrompt = "You are an expert French grammar teacher. Accuracy is your top priority.";
        const userContext = getUserContext();
        const prompt = `Conjugate the French verb "${verb}" for a B1 student. 
Provide the translation in ${language}.
${userContext}

**AUXILIARY RULES:**
- For Passé Composé and Plus-que-parfait, use **être** if the verb is reflexive or among the 17 movement verbs (DR & MRS VANDERTRAMP like partir, arriver, venir, etc.).
- Use **avoir** for others.
- Ensure past participle agreement where necessary.

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

        const response = await callDeepSeek(prompt, systemPrompt, true);
        return parseJSON<VerbConjugation>(response);
    } catch (error: any) {
        console.warn("DeepSeek conjugation fetch failed, falling back to Gemini:", error);
        return await geminiService.getVerbConjugation(verb, language);
    }
};

export const getQuiz = async (topicTitle: string, language: Language): Promise<QuizQuestion[]> => {
    try {
        const userContext = getUserContext();
        const promptText = `Generate exactly 10 multiple-choice questions for the French B1 grammar topic: "${topicTitle}" for a student named Ahmad.
        ${userContext}
        **CONTENT STRATEGY:** Use Ahmad's life in **Liège (Citadelle)** and his memories of **Lebanon**.
        **CRITICAL RULES:**
        1. **Auxiliary Verbs:** Use correct être/avoir in compound tenses.
        2. **Logic:** The correct answer MUST be perfectly correct.
        3. **Protagonist:** Use "je" frequently where appropriate.
        Return ONLY a valid JSON object with structure: 
        {
          "questions": [
            {
              "question": "French text",
              "options": ["A", "B", "C", "D"],
              "correctAnswerIndex": 0,
              "explanation": "Simple pedagogical explanation in ${language}"
            }
          ]
        }`;

        const response = await callDeepSeek(promptText, undefined, true);
        const parsed = parseJSON<{ questions: QuizQuestion[] }>(response);

        // Final sanity check: ensure correctAnswerIndex is a number
        const questions = (parsed.questions || []).map(q => ({
            ...q,
            correctAnswerIndex: Number(q.correctAnswerIndex)
        }));

        return questions;
    } catch (error: any) {
        console.warn("DeepSeek quiz generation failed, falling back to Gemini:", error);
        return await geminiService.getQuiz(topicTitle, language);
    }
};

export const getFlashcards = async (category: string, language: Language): Promise<Flashcard[]> => {
    try {
        const userContext = getUserContext();
        let promptText = `Generate 10 French B1 flashcards for the topic: "${category}" for Ahmad. 
${userContext}
**CONTENT STRATEGY:** Use Ahmad's life in **Liège (Citadelle)** and his memories of **Lebanon**.
The back of the card must be the translation in ${language}.
Return ONLY a valid JSON object with structure: 
{
  "cards": [{"front": "French phrase", "back": "translation", "example": "Personalized example sentence"}]
}`;

        if (category === 'Le Plus-que-parfait' || category === 'Exprimer le Regret (Si seulement...)') {
            promptText = `Generate 10 French B1 flashcards for "${category}" for Ahmad. 
${userContext}
**CONTENT STRATEGY:** Use Ahmad's life in **Liège (Citadelle)** and his memories of **Lebanon**. Focus on "Si seulement...".
The back of the card must be the translation in ${language}.
Return ONLY a valid JSON object with structure: 
{
  "cards": [{"front": "French phrase", "back": "translation", "example": "Personalized example sentence"}]
}`;
        }

        const response = await callDeepSeek(promptText, undefined, true);
        const parsed = parseJSON<{ cards: Flashcard[] }>(response);
        return parsed.cards || [];
    } catch (error: any) {
        console.warn("DeepSeek flashcard generation failed, falling back to Gemini:", error);
        return await geminiService.getFlashcards(category, language);
    }
};

export const getDailyPhrases = async (topic: string, tense: string, language: Language): Promise<Phrase[]> => {
    try {
        const userContext = getUserContext();
        let promptText = `Generate 8 useful French sentences for the topic: "${topic}", using "${tense}" for Ahmad.
${userContext}
**CONTENT STRATEGY:** Use Ahmad's life (Liège/Lebanon).
Return a valid JSON object with structure: 
{
  "phrases": [{"french": "sentence", "translation": "translation", "context": "context"}]
}`;

        if (topic === 'Si Conditionnel (If Conditional)') {
            promptText = `Generate 8 French conditional sentences for Ahmad.
${userContext}
**CONTENT STRATEGY:** Use Ahmad's life (Liège/Lebanon).
The "si" clause should use "${tense}".
Return a valid JSON object with structure: 
{
  "phrases": [{"french": "sentence", "translation": "translation", "context": "context"}]
}`;
        } else if (topic === 'Si Seulement (If Only)') {
            promptText = `Generate 8 French "Si seulement..." sentences for Ahmad.
${userContext}
**CONTENT STRATEGY:** Use Ahmad's life (Liège/Lebanon).
The verb following "Si seulement" should be in "${tense}".
Return a valid JSON object with structure: 
{
  "phrases": [{"french": "sentence", "translation": "translation", "context": "context"}]
}`;
        }

        const response = await callDeepSeek(promptText, undefined, true);
        const parsed = parseJSON<{ phrases: Phrase[] }>(response);
        return parsed.phrases || [];
    } catch (error: any) {
        console.warn("DeepSeek phrase generation failed, falling back to Gemini:", error);
        return await geminiService.getDailyPhrases(topic, tense, language);
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
        console.warn("DeepSeek exam prompt generation failed, falling back to Gemini:", error);
        return await geminiService.getExamPrompts();
    }
};

export const getWritingFeedback = async (promptText: string, userText: string, language: Language): Promise<string> => {
    try {
        const userContext = getUserContext();
        const prompt = `En tant que professeur de FLE encourageant, évaluez la production écrite suivante pour un niveau B1 de Ahmad.
        ${userContext}
        Consigne: "${promptText}"
        Texte de l'étudiant: "${userText}"
        
        **PEDAGOGICAL STYLE:** Soyez bienveillant et clair. Utilisez le style "For Dummies" pour les explications d'erreurs.
        
        Fournissez un feedback constructif en ${language} selon cette STRUCTURE STRICTE :
        ## 1. Appréciation globale
        (Une phrase positive sur l'effort de Ahmad et la qualité générale)
        
        ## 2. Guide des erreurs (Style simple)
        (Listez les erreurs spécifiques. Pour chaque erreur, expliquez POURQUOI c'est une erreur de manière simple, comme à un ami).
        
        ## 3. Version "Champion" (Texte corrigé)
        (Réécrivez l'INTÉGRALITÉ du texte de Ahmad de manière naturelle pour un B1, en intégrant des éléments de son profil si possible).
        
        Utilisez le Markdown pour la mise en forme (##, *, **).`;

        return await callDeepSeek(prompt);
    } catch (error: any) {
        console.warn("DeepSeek writing feedback failed, falling back to Gemini:", error);
        return await geminiService.getWritingFeedback(promptText, userText, language);
    }
};

export const getWritingExample = async (promptText: string): Promise<{ modelAnswer: string; analysis: string; }> => {
    try {
        const userContext = getUserContext();
        const prompt = `Pour une consigne B1: "${promptText}", générez un objet JSON pour l'étudiant Ahmad :
        1. Un texte modèle ('modelAnswer') de EXACTEMENT **8 à 10 phrases**. 
           ${userContext}
           Use a **SIMPLE VOCABULARY** (A2-B1). Highlight (**bold**) conjugated verbs and connectors.
           Personalize the response based on the profile (Liège, Citadelle, Lebanon).
        2. Une brève analyse ('analysis') en français (style pédagogique simple) expliquant pourquoi c'est un bon exemple.`;

        const response = await callDeepSeek(prompt, undefined, true);
        return parseJSON<{ modelAnswer: string; analysis: string; }>(response);
    } catch (error: any) {
        console.warn("DeepSeek writing example failed, falling back to Gemini:", error);
        return await geminiService.getWritingExample(promptText);
    }
};

export const getSpeakingExample = async (promptText: string, language: Language): Promise<{ text: string; audio: string }> => {
    try {
        const userContext = getUserContext();
        const prompt = `Générez une réponse modèle en français pour Ahmad (Niveau B1) pour: "${promptText}". 
        ${userContext}
        **RÈGLE CRUCIALE :** Texte de EXACTEMENT **8 à 10 phrases**.
        Use personalized info (Liège, Citadelle, Lebanon).`;

        const text = await callDeepSeek(prompt);
        let audio = "";
        try {
            audio = await getSpeech(text);
        } catch (e) {
            console.error("Speaking example audio failed", e);
        }
        return { text, audio };
    } catch (error: any) {
        console.warn("DeepSeek speaking example failed, falling back to Gemini:", error);
        return await geminiService.getSpeakingExample(promptText, language);
    }
};

export const getListeningExample = async (promptText: string): Promise<{ text: string; audio: string }> => {
    try {
        const prompt = `Pour la consigne de compréhension orale suivante: "${promptText}", générez un dialogue naturel en français (niveau B1) entre deux personnes. Le vocabulaire doit être simple et courant. Si le sujet s'y prête, utilisez un contexte belge. Utilisez des sauts de ligne entre chaque intervenant (ex: Intervenant 1: ...\nIntervenant 2: ...).`;

        const text = await callDeepSeek(prompt);
        let audio = "";
        try {
            audio = await getSpeech(text);
        } catch (e) {
            console.error("Listening example audio failed", e);
        }
        return { text, audio };
    } catch (error: any) {
        console.warn("DeepSeek listening example failed, falling back to Gemini:", error);
        return await geminiService.getListeningExample(promptText);
    }
};

export const getReadingExample = async (promptText: string): Promise<{ text: string }> => {
    try {
        const prompt = `Pour la consigne de compréhension écrite suivante: "${promptText}", générez un court texte en français (niveau B1) d'environ 150 mots. Il peut s'agir d'un email, d'un article de blog, ou d'une histoire. Le vocabulaire doit être simple. Si le sujet s'y prête, utilisez un contexte belge.`;

        const text = await callDeepSeek(prompt);
        return { text };
    } catch (error: any) {
        console.warn("DeepSeek reading example failed, falling back to Gemini:", error);
        return await geminiService.getReadingExample(promptText);
    }
};

export const getComprehensiveExamData = async (language: Language) => {
    try {
        const userContext = getUserContext();
        const prompt = `
    Créez un examen complet B1 pour Ahmad, en respectant le syllabus. Vocabulaire A2-B1.
    ${userContext}
    
    **SYLLABUS & CONTEXTE:**
    - Logement/Quartier: **Liège (Citadelle)**.
    - Enfance/Projets: **Liban**.
    - Grammaire: PC, Imparfait, PQP, Conditionnel.
    
    **JSON Structure:**
    {
      "listening": {
        "text": "Dialogue (~120 mots) entre deux personnes. Format: Sophie: ...\nMarc: ...",
        "questions": [ { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswerIndex": 0, "explanation": "Simple pédagogie en ${language}" } ]
      },
      "reading": {
        "text": "Texte court (~150 mots). Utiliser le contexte de Liège ou du Liban.",
        "questions": [ { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswerIndex": 0, "explanation": "Simple pédagogie en ${language}" } ]
      },
      "writing": {
        "prompt": "Sujet personnalisé demandant de raconter une expérience (PC/Imparfait) ou projet futur."
      },
      "speaking": {
        "continuousPrompt": "Monologue sur un souvenir au Liban ou un projet à Liège.",
        "interactionPrompt": "Jeu de rôle à Liège."
      }
    }`;

        const response = await callDeepSeek(prompt.replace('${language}', language), "Expert French Teacher", true);
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
        console.warn("DeepSeek comprehensive exam failed, falling back to Gemini:", error);
        return await geminiService.getComprehensiveExamData(language);
    }
};

export const getExamenBlancGeneratorData = async (language: Language): Promise<any> => {
    try {
        const userContext = getUserContext();
        const promptText = `
    Generate a complete EXAMEN BLANC (B1 FLE type) for Ahmad.
    ${userContext}
    
    **PERSONALIZATION RULES:**
    - Use Ahmad's life in **Liège (Citadelle)** or memories of **Libanon** for all content.
    - Style: "For Dummies" (Simple, helpful, slightly funny coach persona).
    - Ahmad is the protagonist in dialogues and texts.

    **SYLLABUS (B1):**
    1. **Themes:** Housing (Logement/Citadelle), Neighborhood (Liège), Childhood (Lebanon), Future plans.
    2. **Grammar:** Passé Composé, Imparfait, Plus-que-parfait, Conditionnel, "Si seulement...".

    **REQUIRED JSON STRUCTURE:**
    {
      "listening": {
        "text": "French dialogue between two people (~150 words). Format: Name: Text\\nName: Text",
        "questions": [{ "question": "...", "answer": "..." }]
      },
      "reading": {
        "text": "A French blog post or email from Ahmad (~200 words).",
        "questions": [{ "question": "...", "answer": "..." }],
        "trueFalse": [{ "statement": "...", "answer": "Vrai/Faux because..." }]
      },
      "writing": {
        "topicA": "A topic about moving to Liège.",
        "topicB": "A topic about memories of Lebanon.",
        "correctionModels": { "topicA": "Key points...", "topicB": "Key points..." }
      },
      "speakingInteraction": {
         "situation1": { "title": "Roleplay at the Citadelle", "points": ["..."], "rolePlayKey": "Tips..." },
         "situation2": { "title": "Roleplay in a Lebanese restaurant", "points": ["..."], "rolePlayKey": "Tips..." }
      },
      "speakingContinuous": {
         "theme1": "Monologue about my journey from Lebanon to Belgium.",
         "theme2": "Monologue about my favorite place in Liège.",
         "modelPoints": { "theme1": ["Point 1", "Point 2"], "theme2": ["..."] }
      },
      "grammar": {
         "exercise1": { "instruction": "Fill in with Passé Composé/Imparfait", "sentences": [ { "phrase": "...", "answer": "..." } ] },
         "exercise2": { "instruction": "Fill in with Plus-que-parfait", "sentences": [ { "phrase": "...", "answer": "..." } ] },
         "exercise3": { "instruction": "Fill in with Conditionnel", "sentences": [ { "phrase": "...", "answer": "..." } ] },
         "lexicon": { "instruction": "Write 5 words about housing", "theme": "Housing", "solution": ["..."] }
      }
    }

    **IMPORTANT:** Return ONLY the JSON object. All sections MUST exist.
    `;

        const response = await callDeepSeek(promptText, "Expert French Coach", true);
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
        console.warn("DeepSeek Examen Blanc generation failed, falling back to Gemini:", error);
        return await geminiService.getExamenBlancGeneratorData(language);
    }
};


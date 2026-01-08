import React, { useState, useEffect } from 'react';
import { PHRASE_TOPICS, TENSE_OPTIONS } from '../constants';
import { getDailyPhrases, getSpeech, playAudio } from '../services/aiService';
import { Phrase, Language } from '../types';
import { Loader2, Quote, Volume2, ChevronDown, Info } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface PhrasesProps {
    language: Language;
}

const Phrases: React.FC<PhrasesProps> = ({ language }) => {
    const [selectedTopic, setSelectedTopic] = useState<string>(PHRASE_TOPICS[0]);
    const [selectedTense, setSelectedTense] = useState<string>(TENSE_OPTIONS[0]);
    const [phrases, setPhrases] = useState<Phrase[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingAudioFor, setLoadingAudioFor] = useState<number | null>(null);
    const [audioError, setAudioError] = useState<{ index: number; message: string } | null>(null);
    const [availableTenses, setAvailableTenses] = useState<string[]>(TENSE_OPTIONS);
    const [helperText, setHelperText] = useState<string | null>(null);
    const { t } = useTranslation(language);

    useEffect(() => {
        let currentTense = selectedTense;
        if (selectedTopic === 'Si Seulement (If Only)') {
            const validTenses = ['Imparfait', 'Plus-que-parfait'];
            setAvailableTenses(validTenses);
            if (!validTenses.includes(selectedTense)) {
                currentTense = 'Imparfait';
                setSelectedTense(currentTense);
            }
            setHelperText('Use Imparfait for present wishes and Plus-que-parfait for past regrets.');
        } else if (selectedTopic === 'Si Conditionnel (If Conditional)') {
            const validTenses = ['Présent', 'Imparfait', 'Plus-que-parfait'];
            setAvailableTenses(validTenses);
            if (!validTenses.includes(selectedTense)) {
                currentTense = 'Imparfait';
                setSelectedTense(currentTense);
            }
            setHelperText('Select the tense for the "si" clause. The AI will generate the complete sentence with the correct structure.');
        } else {
            setAvailableTenses(TENSE_OPTIONS);
            setHelperText(null);
        }
    }, [selectedTopic]);

    useEffect(() => {
        const loadPhrases = async () => {
            if (!availableTenses.includes(selectedTense)) return;

            setLoading(true);
            try {
                const data = await getDailyPhrases(selectedTopic, selectedTense, language);
                setPhrases(data || []);
            } catch (err) {
                console.error("Failed to fetch phrases:", err);
                setPhrases([]);
            } finally {
                setLoading(false);
            }
        };

        loadPhrases();
    }, [selectedTopic, selectedTense, language, availableTenses]);


    const handlePlayAudio = async (text: string, index: number) => {
        if (loadingAudioFor !== null) return;
        setAudioError(null);
        setLoadingAudioFor(index);
        try {
            const audio = await getSpeech(text);
            await playAudio(audio);
        } catch (error: any) {
            console.error("Failed to play audio for phrase", error);
            let message = t('errors.audioFail');
            if (error.message && error.message.includes("429")) {
                message = t('errors.rateLimit');
            }
            setAudioError({ index, message });
            setTimeout(() => setAudioError(null), 5000);
        } finally {
            setLoadingAudioFor(null);
        }
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2 font-heading">{t('phrases.title')}</h2>
                <p className="text-slate-500 mb-4">{t('phrases.description')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-3 ps-4 pe-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-medium transition-all"
                        >
                            {PHRASE_TOPICS.map(topic => (
                                <option key={topic} value={topic}>
                                    {topic}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-3 text-slate-400">
                            <ChevronDown size={20} />
                        </div>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedTense}
                            onChange={(e) => setSelectedTense(e.target.value)}
                            className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-3 ps-4 pe-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-medium transition-all"
                        >
                            {availableTenses.map(tense => (
                                <option key={tense} value={tense}>
                                    {tense}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-3 text-slate-400">
                            <ChevronDown size={20} />
                        </div>
                    </div>
                </div>
                {helperText && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm flex items-start space-x-2 animate-in fade-in">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <span>{helperText}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                        <p className="text-slate-400">{t('phrases.loading', { topic: selectedTopic, tense: selectedTense, language })}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                        {phrases.length > 0 ? phrases.map((phrase, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                                <div className="absolute top-4 end-4 text-slate-200 group-hover:text-blue-100 transition-colors">
                                    <Quote size={40} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-xl font-bold text-slate-800 mb-2 flex-1 font-heading">{phrase.french}</h3>
                                        <button
                                            onClick={() => handlePlayAudio(phrase.french, idx)}
                                            disabled={loadingAudioFor !== null}
                                            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-blue-500 transition-colors disabled:opacity-50 shrink-0"
                                            aria-label={`Listen to pronunciation for "${phrase.french}"`}
                                        >
                                            {loadingAudioFor === idx ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                                        </button>
                                    </div>
                                    <p className="text-blue-600 font-medium mb-3">{phrase.translation}</p>
                                    {audioError && audioError.index === idx && (
                                        <p className="text-red-500 text-xs mb-3 p-2 bg-red-50 rounded-md animate-in fade-in">
                                            {audioError.message}
                                        </p>
                                    )}
                                    <div className="inline-block bg-slate-100 px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        {phrase.context}
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="md:col-span-2 text-center py-20 text-slate-500">
                                <p>{t('phrases.noPhrases')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Phrases;

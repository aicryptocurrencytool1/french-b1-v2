import React, { useState } from 'react';
import { getExamPrompts, getWritingFeedback, getWritingExample, getSpeakingExample, playAudio } from '../services/geminiService';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Loader2, RefreshCw, PenSquare, Mic, Wand2, PlayCircle } from 'lucide-react';

// Re-usable FormattedContent component from Grammar.tsx
const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-blue-600 bg-blue-100 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const blocks = text.split(/\n\s*\n/);
    return (
        <div className="prose max-w-none">
            {blocks.map((block, index) => {
                block = block.trim();
                if (!block) return null;
                if (block.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2 border-slate-200 font-heading">{block.substring(3)}</h2>;
                }
                if (block.startsWith('* ')) {
                    const items = block.split('\n').map(item => item.replace(/^\*\s*/, '').trim());
                    return (
                        <ul key={index} className="list-disc list-outside space-y-2 my-4 ps-6">
                            {items.map((li, i) => (
                                <li key={i} className="text-slate-600 ps-2 leading-relaxed">{renderInlineFormatting(li)}</li>
                            ))}
                        </ul>
                    );
                }
                return <p key={index} className="text-slate-700 leading-relaxed mb-4">{renderInlineFormatting(block)}</p>;
            })}
        </div>
    );
};


interface ExamStudyProps {
    language: Language;
}

type Prompts = { writing: string; speakingContinuous: string; speakingInteraction: string; };

const ExamStudy: React.FC<ExamStudyProps> = ({ language }) => {
    const { t } = useTranslation(language);
    const [prompts, setPrompts] = useState<Prompts | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPrompts = async () => {
        setLoading(true);
        const data = await getExamPrompts();
        setPrompts(data);
        setLoading(false);
    };

    React.useEffect(() => {
        fetchPrompts();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('examStudy.title')}</h2>
                <p className="text-slate-500 max-w-3xl mx-auto">{t('examStudy.description')}</p>
            </div>

            <div className="text-center">
                <button
                    onClick={fetchPrompts}
                    disabled={loading}
                    className="px-6 py-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors font-semibold text-slate-700 flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={16} />}
                    {t('examStudy.generateNewPrompt')}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-blue-500" size={40} />
                </div>
            ) : prompts && (
                <div className="space-y-12">
                    <WritingPractice prompt={prompts.writing} language={language} t={t} />
                    <SpeakingPractice prompt={prompts.speakingContinuous} language={language} t={t} />
                </div>
            )}
        </div>
    );
};


const WritingPractice: React.FC<{ prompt: string; language: Language; t: (k: string) => string }> = ({ prompt, language, t }) => {
    const [userText, setUserText] = useState('');
    const [result, setResult] = useState<{ feedback: string; model: string; } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showModel, setShowModel] = useState(false);
    const [loadingModelOnly, setLoadingModelOnly] = useState(false);

    const handleGetFeedback = async () => {
        if (!userText.trim()) return;
        setLoading(true);
        setResult(null);
        setShowModel(false);
        const res = await getWritingExample(prompt); // get example first
        const feedback = await getWritingFeedback(prompt, userText, language);
        setResult({ feedback, model: res.modelAnswer });
        setLoading(false);
    };

    const handleShowExample = async () => {
        setLoadingModelOnly(true);
        setResult(null);
        const res = await getWritingExample(prompt);
        setResult({ feedback: '', model: res.modelAnswer });
        setShowModel(true);
        setLoadingModelOnly(false);
    };


    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
                    <PenSquare size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 font-heading">{t('examStudy.writingPractice')}</h3>
                    <p className="text-slate-600">{prompt}</p>
                </div>
            </div>

            <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                rows={6}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition mt-4"
                placeholder={t('examStudy.yourText')}
                disabled={loading || showModel}
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <button
                    onClick={handleGetFeedback}
                    disabled={loading || !userText.trim() || showModel}
                    className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                    {t('examStudy.getFeedback')}
                </button>
                <button
                    onClick={handleShowExample}
                    disabled={loading || loadingModelOnly || !!userText.trim()}
                    className="flex-1 sm:flex-auto py-3 px-6 bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors flex justify-center items-center"
                >
                    {loadingModelOnly ? <Loader2 className="animate-spin" /> : t('examStudy.showExample')}
                </button>
            </div>

            {result && (
                <div className="mt-6 space-y-6 pt-6 border-t border-slate-200 animate-in fade-in">
                    {result.feedback && !showModel && (
                        <div>
                            <h4 className="font-bold text-lg font-heading text-slate-800 mb-2">{t('examStudy.feedback')}</h4>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <FormattedContent text={result.feedback} />
                            </div>
                        </div>
                    )}
                    {result.model && (
                        <div>
                            <h4 className="font-bold text-lg font-heading text-slate-800 mb-2">{t('examStudy.modelAnswer')}</h4>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 italic">
                                {renderInlineFormatting(result.model)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const SpeakingPractice: React.FC<{ prompt: string; language: Language; t: (k: string) => string }> = ({ prompt, language, t }) => {
    const [example, setExample] = useState<{ text: string; audio: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleGetExample = async () => {
        setLoading(true);
        setExample(null);
        const res = await getSpeakingExample(prompt, language);
        setExample(res);
        setLoading(false);
    }

    const handlePlayAudio = async () => {
        if (!example?.audio || isPlaying) return;
        setIsPlaying(true);
        await playAudio(example.audio);
        setIsPlaying(false);
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                    <Mic size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 font-heading">{t('examStudy.speakingPractice')}</h3>
                    <p className="text-slate-600">{prompt}</p>
                </div>
            </div>

            <div className="mt-4">
                <button
                    onClick={handleGetExample}
                    disabled={loading}
                    className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                    {t('examStudy.showExample')}
                </button>
            </div>

            {example && (
                <div className="mt-6 pt-6 border-t border-slate-200 animate-in fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-lg font-heading text-slate-800">{t('examStudy.modelAnswer')}</h4>
                        <button
                            onClick={handlePlayAudio}
                            disabled={isPlaying}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                            {isPlaying ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                            {t('examStudy.listenToExample')}
                        </button>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 italic">
                        {renderInlineFormatting(example.text)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamStudy;
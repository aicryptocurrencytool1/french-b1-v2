import React, { useState, useRef } from 'react';
import { essays } from './essayData';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { getSpeech, playAudio } from '../services/aiService';
import { Loader2, Volume2, PenSquare } from 'lucide-react';

interface EssayWriterProps {
    language: Language;
}

const EssayWriter: React.FC<EssayWriterProps> = ({ language }) => {
    const { t } = useTranslation(language);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <div className="inline-block bg-fuchsia-100 text-fuchsia-700 p-4 rounded-full">
                    <PenSquare size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('essayWriter.title')}</h2>
                <p className="text-slate-500 max-w-3xl mx-auto">{t('essayWriter.description')}</p>
            </div>

            <div className="space-y-12">
                {essays.map((essay, index) => (
                    <EssayCard key={index} essay={essay} language={language} t={t} />
                ))}
            </div>
        </div>
    );
};

interface EssayCardProps {
    essay: any;
    language: Language;
    t: (key: string) => string;
}

const EssayCard: React.FC<EssayCardProps> = ({ essay, language, t }) => {
    const [showTranslation, setShowTranslation] = useState(false);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioError, setAudioError] = useState('');
    const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const handlePlayAudio = async (text: string) => {
        if (isAudioLoading) return;
        setAudioError('');
        setIsAudioLoading(true);
        try {
            const audio = await getSpeech(text);
            await playAudio(audio);
        } catch (error: any) {
            let message = t('errors.audioFail');
            if (error.message && error.message.includes("429")) {
                message = t('errors.rateLimit');
            }
            setAudioError(message);
            setTimeout(() => setAudioError(''), 5000);
        } finally {
            setIsAudioLoading(false);
        }
    };

    const handleHighlightClick = (e: React.MouseEvent<HTMLSpanElement>, explanation: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const cardRect = cardRef.current?.getBoundingClientRect();
        if (cardRect) {
            setTooltip({
                content: explanation,
                x: e.clientX - cardRect.left,
                y: e.clientY - cardRect.top - rect.height,
            });
        }
    };
    
    const handleMouseLeave = () => {
         setTimeout(() => setTooltip(null), 300);
    }

    const renderEssayText = () => {
        let lastIndex = 0;
        const parts = [];
        const regex = /\[\[(.*?)\]\]/g;
        let match;
        while ((match = regex.exec(essay.french)) !== null) {
            if (match.index > lastIndex) {
                parts.push(essay.french.substring(lastIndex, match.index));
            }
            const [text, explanation] = match[1].split('|');
            parts.push(
                <span
                    key={match.index}
                    onClick={(e) => handleHighlightClick(e, explanation)}
                    className="bg-blue-100 text-blue-800 font-medium rounded-md px-1 cursor-pointer hover:bg-blue-200 transition-colors"
                >
                    {text}
                </span>
            );
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < essay.french.length) {
            parts.push(essay.french.substring(lastIndex));
        }
        return <p className="text-slate-700 leading-loose whitespace-pre-line">{parts}</p>;
    };
    
    const plainTextEssay = essay.french.replace(/\[\[(.*?)\]\]/g, (match, content) => content.split('|')[0]);

    return (
        <div ref={cardRef} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200 relative" onMouseLeave={handleMouseLeave}>
            {tooltip && (
                <div
                    className="absolute z-10 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-xl animate-in fade-in zoom-in-95"
                    style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px`, transform: 'translate(-50%, -100%)', whiteSpace: 'nowrap' }}
                >
                    {tooltip.content}
                </div>
            )}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 font-heading">{essay.title}</h3>
                <button
                    onClick={() => handlePlayAudio(plainTextEssay)}
                    disabled={isAudioLoading}
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-blue-500 transition-colors disabled:opacity-50"
                    aria-label={`Listen to essay: ${essay.title}`}
                >
                    {isAudioLoading ? <Loader2 className="animate-spin" size={20} /> : <Volume2 size={20} />}
                </button>
            </div>

            {renderEssayText()}

            {audioError && (
                 <p className="text-red-500 text-xs mt-3 p-2 bg-red-50 rounded-md animate-in fade-in text-center">
                    {audioError}
                </p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200">
                <button onClick={() => setShowTranslation(!showTranslation)} className="text-blue-600 font-semibold text-sm">
                    {showTranslation ? t('essayWriter.hideTranslation') : t('essayWriter.showTranslation')}
                </button>
                {showTranslation && (
                    <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in">
                        <p className="text-slate-600 italic leading-relaxed whitespace-pre-line">{essay.translations[language] || essay.translations['English']}</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default EssayWriter;

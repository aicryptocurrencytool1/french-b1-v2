import React, { useState } from 'react';
import { getFlashcards, getSpeech, playAudio } from '../services/geminiService';
import { Flashcard, Language } from '../types';
import { Loader2, RefreshCw, Volume2, ArrowLeft, ArrowRight } from 'lucide-react';
import { GRAMMAR_TOPICS, VOCAB_CATEGORIES, FLASHCARD_GRAMMAR_TOPIC_IDS } from '../constants';
import { useTranslation } from '../hooks/useTranslation';

interface FlashcardsProps {
  language: Language;
}

const Flashcards: React.FC<FlashcardsProps> = ({ language }) => {
  const [category, setCategory] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string>('');
  const { t } = useTranslation(language);

  const startSession = async (cat: string) => {
    setCategory(cat);
    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    const data = await getFlashcards(cat, language);
    setCards(data);
    setLoading(false);
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150); // Wait for flip back
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handlePlayAudio = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation(); // prevent card from flipping
    if (isAudioLoading) return;
    setAudioError('');
    setIsAudioLoading(true);
    try {
        const audio = await getSpeech(text);
        await playAudio(audio);
    } catch (error: any) {
        console.error("Failed to play audio for flashcard", error);
        let message = t('errors.audioFail');
        if (error.message && error.message.includes("429")) {
            message = t('errors.rateLimit');
        }
        setAudioError(message);
        setTimeout(() => setAudioError(''), 5000);
    } finally {
        setIsAudioLoading(false);
    }
  }

  if (!category) {
    const topicsForFlashcards = GRAMMAR_TOPICS.filter(topic => FLASHCARD_GRAMMAR_TOPIC_IDS.includes(topic.id));
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('flashcards.title')}</h2>
                <p className="text-slate-500">{t('flashcards.description')}</p>
            </div>
            
            <div className="space-y-4">
                <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">{t('flashcards.vocabTopics')}</h3>
                <div className="flex flex-wrap gap-3">
                    {VOCAB_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => startSession(cat)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all font-medium">
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">{t('flashcards.grammarBased')}</h3>
                <div className="flex flex-wrap gap-3">
                    {topicsForFlashcards.map(topic => (
                        <button key={topic.id} onClick={() => startSession(topic.title)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all font-medium">
                            {topic.title} {t('flashcards.words')}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  if (loading) {
      return (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-500">{t('flashcards.loading', { category, language })}</p>
          </div>
      )
  }

  if (cards.length === 0) {
      return (
          <div className="text-center pt-20">
              <p>{t('flashcards.noCards')}</p>
              <button onClick={() => setCategory(null)} className="text-blue-600 mt-4 underline font-medium">{t('flashcards.chooseAnother')}</button>
          </div>
      )
  }
  
  const card = cards[currentIndex];

  return (
    <div className="h-full flex flex-col items-center justify-center animate-in fade-in">
        <div className="w-full max-w-lg mb-8 text-center relative">
            <button
              onClick={() => setCategory(null)}
              className="absolute start-0 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} className="rtl:rotate-180" />
              <span>{t('flashcards.categories')}</span>
            </button>
            <h2 className="text-2xl font-bold text-slate-800 font-heading">{category}</h2>
            <p className="text-slate-500">{t('flashcards.card', { current: (currentIndex + 1).toString(), total: cards.length.toString() })}</p>
        </div>
        
        {/* Flashcard */}
        <div className="w-full max-w-lg h-72 perspective-1000">
            <div 
                className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 flex flex-col justify-center items-center text-center cursor-pointer">
                    <button 
                        onClick={(e) => handlePlayAudio(e, card.front)}
                        className="absolute top-6 end-6 p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-500 rounded-full transition-colors"
                    >
                       {isAudioLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
                    </button>
                    <h3 className="text-4xl font-bold text-slate-900 font-heading">{card.front}</h3>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden bg-blue-600 text-white rounded-3xl shadow-2xl p-8 flex flex-col justify-center items-center text-center cursor-pointer rotate-y-180">
                    <h4 className="text-3xl font-bold mb-4 font-heading">{card.back}</h4>
                    <p className="text-blue-100 italic">"{card.example}"</p>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mt-8 w-full max-w-lg">
            <button onClick={prevCard} className="p-4 bg-white rounded-full shadow-lg border hover:bg-slate-50 transition-colors">
                <ArrowLeft className="text-slate-600 rtl:rotate-180" />
            </button>
            <button onClick={() => setIsFlipped(!isFlipped)} className="px-10 py-4 bg-blue-600 text-white rounded-full shadow-lg font-bold hover:bg-blue-700 transition-colors">
                {t('flashcards.flip')}
            </button>
            <button onClick={nextCard} className="p-4 bg-white rounded-full shadow-lg border hover:bg-slate-50 transition-colors">
                <ArrowRight className="text-slate-600 rtl:rotate-180" />
            </button>
        </div>
        
        {audioError && (
            <div className="mt-4 w-full max-w-lg animate-in fade-in">
                <p className="text-red-500 text-sm p-3 bg-red-50 rounded-xl text-center">{audioError}</p>
            </div>
        )}

        <button onClick={() => startSession(category)} className="mt-8 flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors">
            <RefreshCw size={16}/>
            <span className="text-sm font-medium">{t('flashcards.restart')}</span>
        </button>
    </div>
  );
};

export default Flashcards;
import React, { useState } from 'react';
import { COMMON_VERBS } from '../constants';
import { getVerbConjugation, getSpeech, playAudio } from '../services/geminiService';
import { VerbConjugation, Language } from '../types';
import { Search, Loader2, Volume2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface VerbsProps {
  language: Language;
}

const Verbs: React.FC<VerbsProps> = ({ language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [conjugation, setConjugation] = useState<VerbConjugation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingAudioFor, setLoadingAudioFor] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<{ tense: string; message: string } | null>(null);
  const { t } = useTranslation(language);

  const handleSearch = async (verb: string) => {
    if (!verb.trim()) return;
    setLoading(true);
    setConjugation(null);
    setError('');
    try {
      const data = await getVerbConjugation(verb, language);
      setConjugation(data);
    } catch (e) {
      setError(t('verbs.error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTenseAudio = async (tenseTitle: string, conjugations: string[]) => {
    if (loadingAudioFor) return;
    setAudioError(null);
    setLoadingAudioFor(tenseTitle);
    try {
        const textToSpeak = conjugations.join(', ');
        const audio = await getSpeech(textToSpeak);
        await playAudio(audio);
    } catch (error: any) {
        console.error(`Failed to play audio for tense ${tenseTitle}`, error);
        let message = t('errors.audioFail');
        if (error.message && error.message.includes("429")) {
            message = t('errors.rateLimit');
        }
        setAudioError({ tense: tenseTitle, message });
        setTimeout(() => setAudioError(null), 5000);
    } finally {
        setLoadingAudioFor(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('verbs.title')}</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">{t('verbs.description')}</p>
      </div>

      {/* Search Section */}
      <div className="max-w-xl mx-auto w-full">
        <div className="relative group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
            placeholder={t('verbs.placeholder')}
            className="w-full p-4 ps-12 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-lg bg-white text-slate-900"
          />
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
          <button 
            onClick={() => handleSearch(searchTerm)}
            className="absolute end-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : t('verbs.conjugate')}
          </button>
        </div>

        {/* Common Suggestions */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
            {COMMON_VERBS.slice(0, 8).map(v => (
                <button 
                    key={v}
                    onClick={() => { setSearchTerm(v); handleSearch(v); }}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                    {v}
                </button>
            ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
            {error}
        </div>
      )}

      {/* Result Section */}
      {conjugation && (
        <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6 pb-12">
            <div className="text-center mb-8">
                <h3 className="text-4xl font-bold text-blue-600 capitalize mb-2 font-heading">{conjugation.verb}</h3>
                <p className="text-xl text-slate-500 font-medium bg-slate-100 inline-block px-4 py-1 rounded-full">{conjugation.translation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: "Présent", data: conjugation.tenses.present, color: "blue" },
                    { title: "Passé Composé", data: conjugation.tenses.passeCompose, color: "indigo" },
                    { title: "Imparfait", data: conjugation.tenses.imparfait, color: "violet" },
                    { title: "Plus-que-parfait", data: conjugation.tenses.plusQueParfait, color: "cyan" },
                    { title: "Futur Simple", data: conjugation.tenses.futurSimple, color: "fuchsia" },
                    { title: "Conditionnel", data: conjugation.tenses.conditionnel, color: "pink" },
                    { title: "Subjonctif", data: conjugation.tenses.subjonctifPresent, color: "rose" },
                ].map((tense, idx) => (
                    <div key={idx} className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow`}>
                        <div className={`p-4 bg-${tense.color}-50 border-b border-${tense.color}-100 flex items-center justify-between`}>
                            <h4 className={`font-bold text-${tense.color}-700 font-heading`}>{tense.title}</h4>
                            <button
                                onClick={() => handlePlayTenseAudio(tense.title, tense.data)}
                                disabled={loadingAudioFor !== null}
                                className={`text-${tense.color}-400 hover:text-${tense.color}-600 transition-colors disabled:opacity-50`}
                                aria-label={`Listen to ${tense.title} conjugation`}
                            >
                                {loadingAudioFor === tense.title ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Volume2 size={20} />
                                )}
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            {tense.data.map((line, i) => (
                                <div key={i} className="flex items-center text-slate-700">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full me-3"></div>
                                    <span className="font-medium">{line}</span>
                                </div>
                            ))}
                            {audioError && audioError.tense === tense.title && (
                                <p className="text-red-500 text-xs p-2 bg-red-50 rounded-md mt-2 animate-in fade-in">
                                    {audioError.message}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Verbs;
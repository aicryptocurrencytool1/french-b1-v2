import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Loader2, PlayCircle, Eye, EyeOff, RefreshCw, PenSquare, MessageCircle, Mic, Sparkles, Headphones, ArrowRight, XCircle } from 'lucide-react';
import { getExamenBlancGeneratorData, getSpeech, playAudio, getWritingExample, getSpeakingExample, getWritingFeedback } from '../services/aiService';
import { Language } from '../types';

interface ExamenBlancGeneratorProps {
    language: Language;
}

const ModelAnswerGenerator: React.FC<{ prompt: string; type: 'writing' | 'speaking'; language: Language; context?: string }> = ({ prompt, type, language, context }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            if (type === 'writing') {
                const res = await getWritingExample(prompt + (context ? ` Context: ${context}` : ''));
                setData(res);
            } else {
                const res = await getSpeakingExample(prompt + (context ? ` Context: ${context}` : ''), language);
                setData(res);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate model answer. Please try again.");
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-blue-600 animate-pulse mt-4">
                <Sparkles size={18} /> Generating tailored model answer...
            </div>
        );
    }

    if (!data) {
        return (
            <button
                onClick={generate}
                className="flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md"
            >
                <Sparkles size={18} /> Generate AI Model {type === 'writing' ? 'Dissertation' : 'Response'}
            </button>
        );
    }

    return (
        <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <h5 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                <Sparkles size={16} /> AI Model Response
            </h5>
            {type === 'writing' ? (
                <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-indigo-100 text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {data.modelAnswer}
                    </div>
                    {data.analysis && (
                        <div className="text-sm text-indigo-800 bg-indigo-100/50 p-2 rounded">
                            <strong>Analysis:</strong>
                            <div className="prose prose-sm prose-indigo mt-1">{data.analysis}</div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-indigo-100 text-slate-800 italic">
                        "{data.text}"
                    </div>
                    {data.audio && (
                        <div className="mt-2">
                            <button
                                onClick={() => playAudio(data.audio)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm font-semibold"
                            >
                                <PlayCircle size={16} /> Listen to Response
                            </button>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};

const renderInlineFormatting = (text: string) => {
    // Split by bold patterns (**...**)
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            // Highlight bold content (usually French words) with a blue background pill
            const content = part.slice(2, -2);
            return (
                <strong key={i} className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 mx-0.5">
                    {content}
                </strong>
            );
        }
        return part;
    });
};

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split(/\n/);
    const content: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushList = (key: string | number) => {
        if (currentList.length > 0) {
            content.push(
                <ul key={`list-${key}`} className="list-disc list-outside space-y-2 my-4 ps-6">
                    {currentList.map((li, i) => (
                        <li key={i} className="text-slate-600 ps-2 leading-relaxed">{renderInlineFormatting(li)}</li>
                    ))}
                </ul>
            );
            currentList = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
            flushList(index);
            return;
        }

        if (trimmedLine.startsWith('### ')) {
            flushList(index);
            content.push(<h3 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3 font-heading">{trimmedLine.substring(4)}</h3>);
        } else if (trimmedLine.startsWith('## ')) {
            flushList(index);
            content.push(<h2 key={index} className="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2 border-slate-200 font-heading">{trimmedLine.substring(3)}</h2>);
        } else if (trimmedLine.startsWith('# ')) {
            flushList(index);
            content.push(<h1 key={index} className="text-3xl font-bold text-slate-900 mt-10 mb-6 font-heading">{trimmedLine.substring(2)}</h1>);
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            currentList.push(trimmedLine.substring(2));
        } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length < 50) {
            flushList(index);
            content.push(<p key={index} className="text-lg font-bold text-slate-800 mt-6 mb-2">{trimmedLine.slice(2, -2)}</p>);
        } else {
            flushList(index);
            content.push(<p key={index} className="text-slate-700 leading-relaxed mb-4">{renderInlineFormatting(trimmedLine)}</p>);
        }
    });

    flushList('final');
    return <div className="prose prose-sm max-w-none pb-4 text-neutral-900 text-left">{content}</div>;
};

const WritingCorrection: React.FC<{ prompt: string; userText: string; language: Language; t: any }> = ({ prompt, userText, language, t }) => {
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getCorrection = async () => {
        if (!userText.trim()) {
            alert(t('examStudy.yourText'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await getWritingFeedback(prompt, userText, language);
            setFeedback(res);
        } catch (err) {
            console.error(err);
            setError("Failed to get AI feedback. Please try again.");
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-green-600 animate-pulse mt-4">
                <Loader2 size={18} className="animate-spin" /> {t('exam.analyzing')}
            </div>
        );
    }

    if (feedback) {
        return (
            <div className="mt-4 bg-green-50 border border-green-100 p-5 rounded-xl animate-in fade-in slide-in-from-top-2">
                <h5 className="font-bold text-green-900 flex items-center gap-2 mb-3">
                    <PenSquare size={18} /> {t('exam.feedbackTitle')}
                </h5>
                <div className="prose prose-sm prose-slate max-w-none text-slate-800 leading-relaxed text-left">
                    <div className="bg-white/50 p-4 rounded-lg border border-green-100 italic mb-4">
                        "{userText}"
                    </div>
                    <div className="bg-white p-5 rounded-lg border border-green-100 shadow-sm">
                        <FormattedContent text={feedback} />
                    </div>
                </div>
                <button
                    onClick={() => setFeedback(null)}
                    className="mt-4 text-sm text-green-700 hover:underline font-medium"
                >
                    {t('soraliaExercises.reset')} & {t('examStudy.getFeedback')}
                </button>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <button
                onClick={getCorrection}
                disabled={!userText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                <PenSquare size={18} className="group-hover:scale-110 transition-transform" /> {t('exam.correctWriting')}
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};

const ExamenBlancGenerator: React.FC<ExamenBlancGeneratorProps> = ({ language }) => {
    const { t } = useTranslation(language);
    const [examData, setExamData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [audioLoading, setAudioLoading] = useState(false);

    const handleInputChange = (key: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [key]: value }));
    };

    const [error, setError] = useState<string | null>(null);

    const generateExam = async () => {
        setLoading(true);
        setExamData(null);
        setCurrentSection(0);
        setShowAnswers(false);
        setUserAnswers({});
        setError(null);
        try {
            const data = await getExamenBlancGeneratorData(language);
            if (!data) throw new Error("No data returned from AI");

            // Sanity check for critical structure
            if (!data.listening || !data.reading || !data.grammar) {
                console.warn("Received incomplete exam data:", data);
            }

            setExamData(data);
        } catch (err: any) {
            console.error("Failed to generate exam", err);
            setError(err.message || "Failed to generate exam. Please check your connection or try again.");
        }
        setLoading(false);
    };

    const formatDialogue = (text: string) => {
        if (!text) return text;
        // This regex looks for names followed by a colon (e.g., "Sophie:", "Marc :")
        // and adds a newline before them if there isn't one already.
        return text.replace(/([A-Z][a-zàâçéèêëîïôûù]+)\s*:/g, (match, speaker, offset) => {
            if (offset === 0) return match;
            const before = text.substring(0, offset);
            if (before.endsWith('\n') || before.endsWith('\n ')) return match;
            return '\n' + match;
        }).replace(/\n\s*\n/g, '\n\n'); // Clean up excessive newlines
    };

    const renderSections = () => {
        if (!examData) return null;

        const sections = [
            {
                title: "I. COMPRÉHENSION DE L'ORAL (20 points)",
                icon: <Headphones size={24} className="text-blue-600" />,
                content: (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 italic whitespace-pre-wrap leading-relaxed text-slate-800">
                            {formatDialogue(examData.listening?.text || "No listening text available.")}
                        </div>
                        {examData.listening?.text && (
                            <div className="flex gap-4 items-center mt-4">
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={async () => {
                                            if (audioLoading) return;
                                            setError(null);
                                            if (!examData.listening.audio) {
                                                setAudioLoading(true);
                                                try {
                                                    const audio = await getSpeech(examData.listening.text);
                                                    setExamData({ ...examData, listening: { ...examData.listening, audio } });
                                                    await playAudio(audio);
                                                } catch (e: any) {
                                                    console.error('Audio generation failed:', e);
                                                    setError(e.message || "Failed to generate audio.");
                                                }
                                                setAudioLoading(false);
                                            } else {
                                                playAudio(examData.listening.audio);
                                            }
                                        }}
                                        disabled={audioLoading}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 w-fit"
                                    >
                                        {audioLoading ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                                        {audioLoading ? 'Générant l\'audio...' : 'Écouter le Dialogue'}
                                    </button>
                                    {error && error.includes('RATE_LIMIT') && (
                                        <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 animate-in fade-in max-w-sm">
                                            ⚠️ Gemini est fatigué (limite de quota). Veuillez attendre une minute avant de réessayer.
                                        </div>
                                    )}
                                </div>
                                <details className="text-xs text-slate-500 cursor-pointer">
                                    <summary>Voir la transcription</summary>
                                    <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 whitespace-pre-wrap">
                                        {examData.listening.text}
                                    </div>
                                </details>
                            </div>
                        )}
                        <div className="space-y-4 mt-8">
                            <h4 className="font-bold text-slate-800 border-b pb-2">Questions de Compréhension :</h4>
                            {(examData.listening?.questions || []).map((q: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-slate-700 font-medium">{i + 1}. {q.question}</p>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="Votre réponse..."
                                        value={userAnswers[`listening_${i}`] || ''}
                                        onChange={(e) => handleInputChange(`listening_${i}`, e.target.value)}
                                    />
                                    {showAnswers && (
                                        <div className="text-green-600 text-sm font-medium animate-in fade-in">Correct Answer: {q.answer}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            },
            {
                title: "II. COMPRÉHENSION DE L'ÉCRIT (20 points)",
                icon: <Eye size={24} className="text-emerald-600" />,
                content: (
                    <div className="space-y-6">
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl leading-relaxed whitespace-pre-wrap text-slate-800">
                            {formatDialogue(examData.reading?.text || "No reading text available.")}
                        </div>
                        <div className="space-y-4 mt-8">
                            <h4 className="font-bold text-slate-800 border-b pb-2">Questions :</h4>
                            {(examData.reading?.questions || []).map((q: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-slate-700 font-medium">{i + 1}. {q.question}</p>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Votre réponse..."
                                        value={userAnswers[`reading_${i}`] || ''}
                                        onChange={(e) => handleInputChange(`reading_${i}`, e.target.value)}
                                    />
                                    {showAnswers && (
                                        <div className="text-green-600 text-sm font-medium animate-in fade-in">Correct Answer: {q.answer}</div>
                                    )}
                                </div>
                            ))}
                            {(examData.reading?.trueFalse || []).length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-bold text-slate-800 mb-4">Vrai ou Faux ? Justifiez :</h4>
                                    {examData.reading.trueFalse.map((tf: any, i: number) => (
                                        <div key={i} className="space-y-2 mb-4">
                                            <p className="text-slate-700 font-medium">{i + 1}. {tf.statement}</p>
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Vrai/Faux + justification..."
                                                value={userAnswers[`reading_tf_${i}`] || ''}
                                                onChange={(e) => handleInputChange(`reading_tf_${i}`, e.target.value)}
                                            />
                                            {showAnswers && (
                                                <div className="text-green-600 text-sm font-medium animate-in fade-in">Correct Answer: {tf.answer}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )
            },
            {
                title: "III. PRODUCTION ÉCRITE (20 points)",
                icon: <PenSquare size={24} className="text-purple-600" />,
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Choisissez UN des deux sujets suivants et rédigez un texte d'environ 150 mots.</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <h4 className="font-bold text-lg mb-2 text-purple-700">Sujet 1</h4>
                                <p className="text-slate-700 mb-2">{examData.writing?.topicA || "No topic available."}</p>
                                {showAnswers && examData.writing?.correctionModels?.topicA && (
                                    <>
                                        <div className="text-xs text-purple-800 bg-purple-50 p-2 rounded mb-2">
                                            <strong>Points clés:</strong> {examData.writing.correctionModels.topicA}
                                        </div>
                                        <ModelAnswerGenerator language={language} type="writing" prompt={examData.writing.topicA} context={examData.writing.correctionModels.topicA} />
                                    </>
                                )}
                            </div>
                            <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <h4 className="font-bold text-lg mb-2 text-purple-700">Sujet 2</h4>
                                <p className="text-slate-700 mb-2">{examData.writing?.topicB || "No topic available."}</p>
                                {showAnswers && examData.writing?.correctionModels?.topicB && (
                                    <>
                                        <div className="text-xs text-purple-800 bg-purple-50 p-2 rounded mb-2">
                                            <strong>Points clés:</strong> {examData.writing.correctionModels.topicB}
                                        </div>
                                        <ModelAnswerGenerator language={language} type="writing" prompt={examData.writing.topicB} context={examData.writing.correctionModels.topicB} />
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="mt-6">
                            <label className="block text-slate-800 font-bold mb-2">Votre Rédaction:</label>
                            <textarea
                                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-64 shadow-inner"
                                placeholder="Écrivez votre texte ici..."
                                value={userAnswers[`writing`] || ''}
                                onChange={(e) => handleInputChange(`writing`, e.target.value)}
                            ></textarea>
                            <WritingCorrection
                                language={language}
                                prompt={(examData.writing?.topicA || "") + " OR " + (examData.writing?.topicB || "")}
                                userText={userAnswers[`writing`] || ''}
                                t={t}
                            />
                        </div>
                    </div>
                )
            },
            {
                title: "IV. INTERACTION ORALE (Simulation - 20 points)",
                icon: <MessageCircle size={24} className="text-rose-600" />,
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Préparez des réponses aux situations suivantes :</p>
                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100 shadow-sm">
                            <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction?.situation1?.title || "Simulation 1"}</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                {(examData.speakingInteraction?.situation1?.points || []).map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                            {showAnswers && (
                                <>
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Conseil:</strong> {examData.speakingInteraction?.situation1?.rolePlayKey}
                                    </div>
                                    <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingInteraction?.situation1?.title} context={examData.speakingInteraction?.situation1?.points?.join(', ')} />
                                </>
                            )}
                        </div>
                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100 mt-4 shadow-sm">
                            <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction?.situation2?.title || "Simulation 2"}</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                {(examData.speakingInteraction?.situation2?.points || []).map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                            {showAnswers && (
                                <>
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Conseil:</strong> {examData.speakingInteraction?.situation2?.rolePlayKey}
                                    </div>
                                    <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingInteraction?.situation2?.title} context={examData.speakingInteraction?.situation2?.points?.join(', ')} />
                                </>
                            )}
                        </div>
                    </div>
                )
            },
            {
                title: "V. PRODUCTION ORALE EN CONTINU (20 points)",
                icon: <Mic size={24} className="text-indigo-600" />,
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Préparez une présentation courte (1-2 minutes) sur UN des thèmes suivants :</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <h4 className="font-bold text-lg mb-2 text-indigo-700">Thème 1</h4>
                                <p className="text-slate-700 mb-2">{examData.speakingContinuous?.theme1 || "No theme available."}</p>
                                {showAnswers && (
                                    <>
                                        <div className="text-xs text-indigo-800 bg-indigo-50 p-2 rounded mb-2">
                                            <strong>Points clés:</strong> {examData.speakingContinuous?.modelPoints?.theme1?.join(', ')}
                                        </div>
                                        <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingContinuous?.theme1} />
                                    </>
                                )}
                            </div>
                            <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <h4 className="font-bold text-lg mb-2 text-indigo-700">Thème 2</h4>
                                <p className="text-slate-700 mb-2">{examData.speakingContinuous?.theme2 || "No theme available."}</p>
                                {showAnswers && (
                                    <>
                                        <div className="text-xs text-indigo-800 bg-indigo-50 p-2 rounded mb-2">
                                            <strong>Points clés:</strong> {examData.speakingContinuous?.modelPoints?.theme2?.join(', ')}
                                        </div>
                                        <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingContinuous?.theme2} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            },
            {
                title: "VI. GRAMMAIRE & LEXIQUE (20 points)",
                icon: <RefreshCw size={24} className="text-teal-600" />,
                content: (
                    <div className="space-y-8">
                        {[1, 2, 3].map((exerciseNum) => {
                            const exKey = `exercise${exerciseNum}`;
                            const ex = examData.grammar?.[exKey];
                            if (!ex) return null;
                            return (
                                <div key={exerciseNum}>
                                    <h4 className="font-bold text-lg mb-4 text-slate-800 border-b pb-1">{ex.instruction}</h4>
                                    {(ex.sentences || []).map((s: any, i: number) => (
                                        <div key={i} className="mb-4">
                                            <p className="text-slate-700 mb-1">{i + 1}. {s.phrase}</p>
                                            <input
                                                type="text"
                                                className="w-full p-2 border border-slate-300 rounded focus:border-blue-500"
                                                placeholder="Réponse..."
                                                value={userAnswers[`grammar_ex${exerciseNum}_${i}`] || ''}
                                                onChange={(e) => handleInputChange(`grammar_ex${exerciseNum}_${i}`, e.target.value)}
                                            />
                                            {showAnswers && (
                                                <div className="text-green-600 text-sm mt-1 font-medium bg-green-50 px-2 py-1 rounded inline-block">Correction: {s.answer}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                        {examData.grammar?.lexicon && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-lg mb-2 text-teal-800">Lexique : {examData.grammar.lexicon.theme}</h4>
                                <p className="text-slate-700 mb-3">{examData.grammar.lexicon.instruction}</p>
                                <textarea
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 mb-2"
                                    placeholder="Vos mots..."
                                    rows={2}
                                    value={userAnswers[`lexicon`] || ''}
                                    onChange={(e) => handleInputChange(`lexicon`, e.target.value)}
                                ></textarea>
                                {showAnswers && (
                                    <div className="bg-green-50 p-3 rounded-lg text-green-800 text-sm border border-green-200">
                                        <strong>Solution:</strong> {(examData.grammar.lexicon.solution || []).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            }
        ];

        return (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-50">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            {currentSection + 1}
                        </div>
                        <div className="flex items-center gap-2">
                            {sections[currentSection].icon}
                            <h3 className="font-bold text-slate-800 text-lg">{sections[currentSection].title}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowAnswers(!showAnswers)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${showAnswers ? 'bg-amber-100 text-amber-800' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {showAnswers ? <EyeOff size={18} /> : <Eye size={18} />}
                            {showAnswers ? 'Hide Answers' : 'Show Answers'}
                        </button>
                        <div className="text-sm text-slate-500 font-medium">Part {currentSection + 1} of {sections.length}</div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {sections[currentSection].content}
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                        disabled={currentSection === 0}
                        className="px-6 py-2 rounded-lg font-semibold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all font-medium"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                        disabled={currentSection === sections.length - 1}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md shadow-blue-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        Next Section <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">Examen Blanc Generator</h2>
                <p className="text-slate-500">Evaluations de Janvier 2025</p>
            </div>

            {!examData && !loading && (
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 border border-slate-200">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
                        <Sparkles size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800">Prêt pour votre examen blanc ?</h3>
                    <p className="text-slate-600 max-w-lg mx-auto">
                        L'IA va générer un examen unique basé sur le syllabus (Logement, Enfance, Grammaire B1).
                    </p>
                    <button
                        onClick={generateExam}
                        className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                    >
                        <Sparkles size={20} />
                        Générer un Nouvel Examen
                    </button>
                    <p className="text-xs text-slate-400 mt-4">Génération via Google Gemini 2.0 Flash</p>
                </div>
            )}

            {loading && (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-slate-200">
                    <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-bold text-slate-800 animate-pulse">Création de votre examen en cours...</h3>
                    <p className="text-slate-500 mt-2">Rédaction des dialogues, questions et exercices...</p>
                </div>
            )}

            {error && (
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-red-200">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
                        <XCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Generation Failed</h3>
                    <p className="text-red-600 mt-2 mb-6">{error}</p>
                    <button
                        onClick={generateExam}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                    >
                        <RefreshCw size={18} /> Try Again
                    </button>
                </div>
            )}

            {renderSections()}

            {examData && (
                <div className="flex justify-center mt-8">
                    <button
                        onClick={generateExam}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                    >
                        <RefreshCw size={18} /> New Exam
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExamenBlancGenerator;

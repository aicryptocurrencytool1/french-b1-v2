import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Loader2, PlayCircle, Eye, EyeOff, RefreshCw, PenSquare, MessageCircle, Mic, Sparkles, Headphones, ArrowRight } from 'lucide-react';
import { getExamenBlancGeneratorData, getSpeech, playAudio, getWritingExample, getSpeakingExample } from '../services/aiService';
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

const ExamenBlancGenerator: React.FC<ExamenBlancGeneratorProps> = ({ language }) => {
    const { t } = useTranslation(language);
    const [examData, setExamData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [currentSection, setCurrentSection] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

    const handleInputChange = (key: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [key]: value }));
    };

    const generateExam = async () => {
        setLoading(true);
        setExamData(null);
        setCurrentSection(0);
        setShowAnswers(false);
        setUserAnswers({});
        try {
            const data = await getExamenBlancGeneratorData(language);
            setExamData(data);
        } catch (error) {
            console.error("Failed to generate exam", error);
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
                title: "I. COMPRÉHENSION DE L'ORAL (10 points)",
                icon: <Headphones size={24} className="text-blue-600" />,
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Lisez le texte (ou écoutez-le s'il est disponible) et répondez aux questions.</p>
                        {examData.listening.audio && (
                            <div className="mb-4">
                                <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold" onClick={() => playAudio(examData.listening.audio)}>
                                    <PlayCircle size={20} /> Listen to Dialogue
                                </button>
                            </div>
                        )}
                        <details className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                            <summary className="px-4 py-2 text-sm font-semibold text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors">
                                Show Transcription
                            </summary>
                            <div className="p-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed font-mono">
                                {formatDialogue(examData.listening.text)}
                            </div>
                        </details>
                        <div className="space-y-4 mt-6">
                            <h4 className="font-bold">Questions :</h4>
                            {examData.listening.questions.map((q: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <label className="block text-slate-700 font-medium">{i + 1}. {q.question}</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Votre réponse..."
                                        value={userAnswers[`listening_${i}`] || ''}
                                        onChange={(e) => handleInputChange(`listening_${i}`, e.target.value)}
                                    />
                                    {showAnswers && (
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 mt-2">
                                            <strong>Réponse suggérée:</strong> {q.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            },
            {
                title: "II. COMPRÉHENSION DE L'ÉCRIT (10 points)",
                icon: <Eye size={24} className="text-amber-600" />,
                content: (
                    <div className="space-y-6">
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl leading-relaxed whitespace-pre-line text-slate-800">
                            {formatDialogue(examData.reading.text)}
                        </div>
                        <div className="space-y-4 mt-6">
                            <h4 className="font-bold">Questions :</h4>
                            {examData.reading.questions.map((q: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <label className="block text-slate-700 font-medium">{i + 1}. {q.question}</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Votre réponse..."
                                        value={userAnswers[`reading_${i}`] || ''}
                                        onChange={(e) => handleInputChange(`reading_${i}`, e.target.value)}
                                    />
                                    {showAnswers && (
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 mt-2">
                                            <strong>Réponse suggérée:</strong> {q.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {examData.reading.trueFalse.map((q: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <p className="font-medium text-slate-700">{q.statement}</p>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name={`tf_${i}`} value="Vrai" onChange={(e) => handleInputChange(`reading_tf_${i}`, e.target.value)} checked={userAnswers[`reading_tf_${i}`] === 'Vrai'} /> Vrai
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name={`tf_${i}`} value="Faux" onChange={(e) => handleInputChange(`reading_tf_${i}`, e.target.value)} checked={userAnswers[`reading_tf_${i}`] === 'Faux'} /> Faux
                                        </label>
                                    </div>
                                    {showAnswers && (
                                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 mt-2">
                                            <strong>Correction:</strong> {q.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            },
            {
                title: "III. PRODUCTION ÉCRITE (20 points)",
                icon: <PenSquare size={24} className="text-purple-600" />,
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Choisissez UN des deux sujets suivants :</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 border border-slate-200 rounded-xl bg-white">
                                <h4 className="font-bold text-lg mb-2 text-purple-700">Sujet 1</h4>
                                <p className="text-slate-700 mb-2">{examData.writing.topicA}</p>
                                {showAnswers && (
                                    <>
                                        <div className="text-xs text-purple-800 bg-purple-50 p-2 rounded mb-2">
                                            <strong>Points clés:</strong> {examData.writing.correctionModels.topicA}
                                        </div>
                                        <ModelAnswerGenerator language={language} type="writing" prompt={examData.writing.topicA} context={examData.writing.correctionModels.topicA} />
                                    </>
                                )}
                            </div>
                            <div className="p-6 border border-slate-200 rounded-xl bg-white">
                                <h4 className="font-bold text-lg mb-2 text-purple-700">Sujet 2</h4>
                                <p className="text-slate-700 mb-2">{examData.writing.topicB}</p>
                                {showAnswers && (
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
                                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-64"
                                placeholder="Écrivez votre texte ici..."
                                value={userAnswers[`writing`] || ''}
                                onChange={(e) => handleInputChange(`writing`, e.target.value)}
                            ></textarea>
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
                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100">
                            <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction.situation1.title}</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                {examData.speakingInteraction.situation1.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                            {showAnswers && (
                                <>
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Conseil:</strong> {examData.speakingInteraction.situation1.rolePlayKey}
                                    </div>
                                    <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingInteraction.situation1.title} context={examData.speakingInteraction.situation1.points.join(', ')} />
                                </>
                            )}
                        </div>
                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100 mt-4">
                            <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction.situation2.title}</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                {examData.speakingInteraction.situation2.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                            </ul>
                            {showAnswers && (
                                <>
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Conseil:</strong> {examData.speakingInteraction.situation2.rolePlayKey}
                                    </div>
                                    <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingInteraction.situation2.title} context={examData.speakingInteraction.situation2.points.join(', ')} />
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
                            <div className="p-6 border border-slate-200 rounded-xl bg-white">
                                <h4 className="font-bold text-lg mb-2 text-indigo-700">Thème 1</h4>
                                <p className="text-slate-700 mb-2">{examData.speakingContinuous.theme1}</p>
                                {showAnswers && (
                                    <>
                                        <div className="text-xs text-indigo-800 bg-indigo-50 p-2 rounded mb-2">
                                            <strong>Points clés:</strong> {examData.speakingContinuous.modelPoints.theme1.join(', ')}
                                        </div>
                                        <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingContinuous.theme1} />
                                    </>
                                )}
                            </div>
                            <div className="p-6 border border-slate-200 rounded-xl bg-white">
                                <h4 className="font-bold text-lg mb-2 text-indigo-700">Thème 2</h4>
                                <p className="text-slate-700 mb-2">{examData.speakingContinuous.theme2}</p>
                                {showAnswers && (
                                    <>
                                        <div className="text-xs text-indigo-800 bg-indigo-50 p-2 rounded mb-2">
                                            <strong>Points clés:</strong> {examData.speakingContinuous.modelPoints.theme2.join(', ')}
                                        </div>
                                        <ModelAnswerGenerator language={language} type="speaking" prompt={examData.speakingContinuous.theme2} />
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
                            const ex = examData.grammar[exKey];
                            return (
                                <div key={exerciseNum}>
                                    <h4 className="font-bold text-lg mb-4">{ex.instruction}</h4>
                                    {ex.sentences.map((s: any, i: number) => (
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
                                                <div className="text-green-600 text-sm mt-1 font-medium">Correction: {s.answer}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                        <div>
                            <h4 className="font-bold text-lg mb-2">Lexique</h4>
                            <p className="text-slate-700 mb-2">{examData.grammar.lexicon.instruction} ({examData.grammar.lexicon.theme})</p>
                            <textarea
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                                placeholder="Vos mots..."
                                rows={2}
                                value={userAnswers[`lexicon`] || ''}
                                onChange={(e) => handleInputChange(`lexicon`, e.target.value)}
                            ></textarea>
                            {showAnswers && (
                                <div className="bg-green-50 p-3 rounded-lg text-green-800 text-sm border border-green-200">
                                    <strong>Solution:</strong> {examData.grammar.lexicon.solution.join(', ')}
                                </div>
                            )}
                        </div>
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

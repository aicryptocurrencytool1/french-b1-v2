import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Headphones, BookOpen, PenSquare, Mic, CheckCircle, ArrowRight, Loader2, PlayCircle, RefreshCw, Wand2, Eye, EyeOff } from 'lucide-react';
import { getExamenBlancGeneratorData, playAudio } from '../services/geminiService';

interface ExamenBlancGeneratorProps {
    language: Language;
}

const AudioPlayer: React.FC<{ audioBase64: string }> = ({ audioBase64 }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = async () => {
        if (!audioBase64 || isPlaying) return;
        setIsPlaying(true);
        try {
            await playAudio(audioBase64);
        } catch (e) {
            console.error(e);
        }
        setIsPlaying(false);
    };

    return (
        <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
        >
            {isPlaying ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
            Listen to Dialogue
        </button>
    );
};


const ExamenBlancGenerator: React.FC<ExamenBlancGeneratorProps> = ({ language }) => {
    const { t } = useTranslation(language);
    const [currentSection, setCurrentSection] = useState(0);
    const [examData, setExamData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAnswers, setShowAnswers] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

    const handleInputChange = (key: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [key]: value }));
    };

    const generateExam = async () => {
        setLoading(true);
        setError(null);
        setShowAnswers(false);
        setUserAnswers({});
        try {
            const data = await getExamenBlancGeneratorData(language);
            setExamData(data);
            setCurrentSection(0);
        } catch (err) {
            console.error(err);
            setError("Failed to generate exam. Please try again.");
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Loader2 size={48} className="animate-spin text-blue-600" />
                <p className="text-lg text-slate-600 font-medium animate-pulse">Generating custom Examen Blanc...</p>
                <p className="text-sm text-slate-500">Aligning with "Groupe de FLE Caramel" syllabus...</p>
            </div>
        );
    }

    if (!examData) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-12 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                        <Wand2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 font-heading mb-4">Examen Blanc Generator</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Create a unique B1 Practice Exam tailored to your specific syllabus (Logement, Quartier, Enfance) and current evaluation criteria.
                        <br /><br />
                        Each exam includes: Listening, Reading, Writing, Speaking, and Grammar.
                    </p>
                    <button
                        onClick={generateExam}
                        className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                        Generate New Exam
                    </button>
                    {error && <p className="text-red-500 mt-4 font-medium">{error}</p>}
                </div>
            </div>
        );
    }

    const renderSections = () => {
        const sections = [
            {
                title: "I. COMPRÉHENSION DE L'ORAL (10 points)",
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600 mb-4">Écoutez le dialogue généré :</p>
                        {examData.listening.audio && <AudioPlayer audioBase64={examData.listening.audio} />}

                        <div className="space-y-6 mt-8">
                            <h4 className="font-bold text-lg">Questions :</h4>
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
                content: (
                    <div className="space-y-6">
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl leading-relaxed whitespace-pre-line text-slate-800">
                            {examData.reading.text}
                        </div>
                        <div className="space-y-6 mt-8">
                            <h4 className="font-bold text-lg">Questions :</h4>
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

                            <h4 className="font-bold text-lg mt-6">Vrai ou Faux ?</h4>
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
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Choisissez UN des deux sujets suivants :</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                                <h4 className="font-bold text-lg mb-2 text-blue-700">Sujet A</h4>
                                <p className="text-slate-700">{examData.writing.topicA}</p>
                            </div>
                            <div className="p-6 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                                <h4 className="font-bold text-lg mb-2 text-blue-700">Sujet B</h4>
                                <p className="text-slate-700">{examData.writing.topicB}</p>
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
                        {showAnswers && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-4">
                                <h4 className="font-bold text-green-900 mb-2">Points Clés (Modèle de Correction)</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <strong className="text-green-800 block mb-1">Sujet A:</strong>
                                        <p className="text-sm text-green-700">{examData.writing.correctionModels?.topicA}</p>
                                    </div>
                                    <div>
                                        <strong className="text-green-800 block mb-1">Sujet B:</strong>
                                        <p className="text-sm text-green-700">{examData.writing.correctionModels?.topicB}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            },
            {
                title: "IV. INTERACTION ORALE (Simulation - 20 points)",
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Préparez des réponses aux situations suivantes :</p>
                        <div className="space-y-6">
                            <div className="bg-rose-50 p-6 rounded-lg border border-rose-100">
                                <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction.situation1.title}</h4>
                                <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                    {examData.speakingInteraction.situation1.points.map((p: string, i: number) => (
                                        <li key={i}>{p}</li>
                                    ))}
                                </ul>
                                {showAnswers && (
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Conseil:</strong> {examData.speakingInteraction.situation1.rolePlayKey}
                                    </div>
                                )}
                            </div>
                            <div className="bg-rose-50 p-6 rounded-lg border border-rose-100">
                                <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction.situation2.title}</h4>
                                <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                    {examData.speakingInteraction.situation2.points.map((p: string, i: number) => (
                                        <li key={i}>{p}</li>
                                    ))}
                                </ul>
                                {showAnswers && (
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Conseil:</strong> {examData.speakingInteraction.situation2.rolePlayKey}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            },
            {
                title: "V. PRODUCTION ORALE EN CONTINU (20 points)",
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Préparez une présentation courte (1-2 minutes) sur UN des thèmes suivants :</p>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-4 border border-slate-200 rounded-lg">
                                <h4 className="font-bold text-slate-800 mb-2">Thème 1</h4>
                                <p className="text-slate-600 mb-4">{examData.speakingContinuous.theme1}</p>
                                {showAnswers && examData.speakingContinuous.modelPoints?.theme1 && (
                                    <div className="bg-slate-50 p-3 rounded text-sm text-slate-700">
                                        <strong>Idées:</strong> {examData.speakingContinuous.modelPoints.theme1.join(', ')}
                                    </div>
                                )}
                            </div>
                            <div className="p-4 border border-slate-200 rounded-lg">
                                <h4 className="font-bold text-slate-800 mb-2">Thème 2</h4>
                                <p className="text-slate-600 mb-4">{examData.speakingContinuous.theme2}</p>
                                {showAnswers && examData.speakingContinuous.modelPoints?.theme2 && (
                                    <div className="bg-slate-50 p-3 rounded text-sm text-slate-700">
                                        <strong>Idées:</strong> {examData.speakingContinuous.modelPoints.theme2.join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            },
            {
                title: "VI. GRAMMAIRE & LEXIQUE (20 points)",
                content: (
                    <div className="space-y-8">
                        {/* Exercise 1 */}
                        <div>
                            <h4 className="font-bold text-lg mb-4">{examData.grammar.exercise1.instruction} (6 points)</h4>
                            {examData.grammar.exercise1.sentences.map((s: any, i: number) => (
                                <div key={i} className="mb-4">
                                    <p className="text-slate-700 mb-1">{i + 1}. {s.phrase}</p>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded focus:border-blue-500"
                                        placeholder="Réponse..."
                                        value={userAnswers[`grammar_ex1_${i}`] || ''}
                                        onChange={(e) => handleInputChange(`grammar_ex1_${i}`, e.target.value)}
                                    />
                                    {showAnswers && (
                                        <div className="text-green-600 text-sm mt-1 font-medium">Correction: {s.answer}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Exercise 2 */}
                        <div>
                            <h4 className="font-bold text-lg mb-4">{examData.grammar.exercise2.instruction} (6 points)</h4>
                            {examData.grammar.exercise2.sentences.map((s: any, i: number) => (
                                <div key={i} className="mb-4">
                                    <p className="text-slate-700 mb-1">{i + 1}. {s.phrase}</p>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded focus:border-blue-500"
                                        placeholder="Réponse..."
                                        value={userAnswers[`grammar_ex2_${i}`] || ''}
                                        onChange={(e) => handleInputChange(`grammar_ex2_${i}`, e.target.value)}
                                    />
                                    {showAnswers && (
                                        <div className="text-green-600 text-sm mt-1 font-medium">Correction: {s.answer}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Exercise 3 */}
                        <div>
                            <h4 className="font-bold text-lg mb-4">{examData.grammar.exercise3.instruction} (4 points)</h4>
                            {examData.grammar.exercise3.sentences.map((s: any, i: number) => (
                                <div key={i} className="mb-4">
                                    <p className="text-slate-700 mb-1">{i + 1}. {s.phrase}</p>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-300 rounded focus:border-blue-500"
                                        placeholder="Réponse..."
                                        value={userAnswers[`grammar_ex3_${i}`] || ''}
                                        onChange={(e) => handleInputChange(`grammar_ex3_${i}`, e.target.value)}
                                    />
                                    {showAnswers && (
                                        <div className="text-green-600 text-sm mt-1 font-medium">Correction: {s.answer}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* Lexicon */}
                        <div>
                            <h4 className="font-bold text-lg mb-2">Lexique</h4>
                            <p className="text-slate-700 mb-4">{examData.grammar.lexicon.instruction} ({examData.grammar.lexicon.theme}) (4 points)</p>
                            <textarea
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                                placeholder="Vos 5 mots..."
                                rows={3}
                                value={userAnswers[`lexicon`] || ''}
                                onChange={(e) => handleInputChange(`lexicon`, e.target.value)}
                            ></textarea>
                            {showAnswers && (
                                <div className="bg-green-50 p-3 rounded-lg text-green-800 text-sm border border-green-200">
                                    <strong>Suggestions:</strong> {examData.grammar.lexicon.solution?.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                )

            }
        ];

        return (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {currentSection + 1}
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{sections[currentSection].title}</h3>
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
                        className="px-6 py-2 rounded-lg font-semibold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
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
    }


    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex justify-between items-center text-center space-y-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 font-heading">Examen Blanc Generator</h2>
                    <p className="text-slate-500">Evaluations de Janvier 2025</p>
                </div>
                <button
                    onClick={generateExam}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-semibold"
                >
                    <RefreshCw size={18} /> New Exam
                </button>
            </div>

            {renderSections()}

        </div>
    );
};

export default ExamenBlancGenerator;

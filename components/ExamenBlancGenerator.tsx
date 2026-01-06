import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Headphones, BookOpen, PenSquare, Mic, CheckCircle, ArrowRight, Loader2, PlayCircle, RefreshCw, Wand2 } from 'lucide-react';
import { getExamenBlancGeneratorData, resumeAudioContext, playAudio } from '../services/geminiService';

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

    const generateExam = async () => {
        setLoading(true);
        setError(null);
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

                        <div className="space-y-4 mt-8">
                            <h4 className="font-bold text-lg">Questions :</h4>
                            <ul className="list-decimal pl-5 space-y-4 text-slate-700">
                                {examData.listening.questions.map((q: string, i: number) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ul>
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
                        <div className="space-y-4 mt-8">
                            <h4 className="font-bold text-lg">Questions :</h4>
                            <ul className="list-decimal pl-5 space-y-2 text-slate-700">
                                {examData.reading.questions.map((q: string, i: number) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ul>
                            <h4 className="font-bold text-lg mt-4">Vrai ou Faux ?</h4>
                            <ul className="list-disc pl-5 space-y-1 text-slate-700">
                                {examData.reading.trueFalse.map((q: string, i: number) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ul>
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
                    </div>
                )
            },
            {
                title: "IV. INTERACTION ORALE (Simulation - 20 points)",
                content: (
                    <div className="space-y-6">
                        <p className="text-slate-600">Préparez des réponses aux situations suivantes :</p>
                        <div className="space-y-4">
                            <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                                <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction.situation1.title}</h4>
                                <ul className="list-disc pl-5 text-rose-700 space-y-1">
                                    {examData.speakingInteraction.situation1.points.map((p: string, i: number) => (
                                        <li key={i}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                                <h4 className="font-bold text-rose-800 mb-2">{examData.speakingInteraction.situation2.title}</h4>
                                <ul className="list-disc pl-5 text-rose-700 space-y-1">
                                    {examData.speakingInteraction.situation2.points.map((p: string, i: number) => (
                                        <li key={i}>{p}</li>
                                    ))}
                                </ul>
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
                        <ul className="list-disc pl-5 space-y-4 text-slate-700">
                            <li>
                                <strong>Thème 1:</strong> {examData.speakingContinuous.theme1}
                            </li>
                            <li>
                                <strong>Thème 2:</strong> {examData.speakingContinuous.theme2}
                            </li>
                        </ul>
                    </div>
                )
            },
            {
                title: "VI. GRAMMAIRE & LEXIQUE (20 points)",
                content: (
                    <div className="space-y-8">
                        <div>
                            <h4 className="font-bold text-lg mb-2">{examData.grammar.exercise1.instruction} (6 points)</h4>
                            <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                                {examData.grammar.exercise1.sentences.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2">{examData.grammar.exercise2.instruction} (6 points)</h4>
                            <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                                {examData.grammar.exercise2.sentences.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2">{examData.grammar.exercise3.instruction} (4 points)</h4>
                            <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                                {examData.grammar.exercise3.sentences.map((s: string, i: number) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2">Lexique</h4>
                            <p className="text-slate-700">{examData.grammar.lexicon.instruction} ({examData.grammar.lexicon.theme}) (4 points)</p>
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
                    <div className="text-sm text-slate-500 font-medium">Part {currentSection + 1} of {sections.length}</div>
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

import React, { useState, useEffect } from 'react';
import { getComprehensiveExamData, playAudio, getWritingExample } from '../services/geminiService';
import { QuizQuestion, Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Loader2, FileText, CheckCircle2, XCircle, Headphones, BookOpen, PenSquare, Mic, PlayCircle, Trophy, ArrowRight, Wand2 } from 'lucide-react';
import { getWritingFeedback, getSpeakingExample } from '../services/geminiService';

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


type ExamState = 'intro' | 'generating' | 'listening' | 'reading' | 'writing' | 'speaking' | 'results';

interface ExamData {
  listening: { text: string; questions: QuizQuestion[]; audio: string; };
  reading: { text: string; questions: QuizQuestion[]; };
  writing: { feedback: string; userText: string; prompt: string; };
  speaking: { continuousPrompt: string; interactionPrompt: string; };
  scores: { listening: number; reading: number; };
}

const Exam: React.FC<{ language: Language }> = ({ language }) => {
    const [examState, setExamState] = useState<ExamState>('intro');
    const [examData, setExamData] = useState<Partial<ExamData>>({});
    const [error, setError] = useState('');
    const { t } = useTranslation(language);

    const startNewExam = async () => {
        setExamState('generating');
        setError('');
        setExamData({});
        try {
            const data = await getComprehensiveExamData(language);
            setExamData({
                ...data,
                writing: { ...data.writing, feedback: '', userText: '' },
                scores: { listening: 0, reading: 0 }
            });
            setExamState('listening');
        } catch (e) {
            console.error(e);
            setError(t('exam.error'));
            setExamState('intro');
        }
    };

    const handleSectionComplete = (section: 'listening' | 'reading', score: number) => {
        setExamData(prev => ({ ...prev, scores: { ...prev.scores!, [section]: score } }));
        if (section === 'listening') setExamState('reading');
        if (section === 'reading') setExamState('writing');
    };
    
    const handleWritingComplete = (feedback: string, userText: string) => {
        setExamData(prev => ({ ...prev, writing: { ...prev.writing!, feedback, userText } }));
        setExamState('speaking');
    }

    const ExamIntro = () => (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <FileText size={40} />
            </div>
            <div className="max-w-xl">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('exam.title')}</h2>
                <p className="text-slate-500 mt-2">{t('exam.description')}</p>
            </div>
            <div className="p-6 bg-slate-100 border border-slate-200 rounded-xl text-start w-full max-w-md">
                <h3 className="font-bold text-slate-700 mb-3 font-heading">{t('exam.introTitle')}</h3>
                <ul className="space-y-2">
                    {[t('exam.part1'), t('exam.part2'), t('exam.part3'), t('exam.part4')].map((part, i) => (
                        <li key={i} className="flex items-center space-x-3 text-slate-600">
                            <span className="w-5 h-5 flex items-center justify-center bg-indigo-200 text-indigo-700 rounded-full text-xs font-bold">{i+1}</span>
                            <span>{part}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <button
                onClick={startNewExam}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
            >
                {t('exam.generateButton')}
            </button>
            {error && <p className="text-red-500 p-4 bg-red-50 rounded-lg">{error}</p>}
        </div>
    );
    
    if (examState === 'intro') return <ExamIntro />;
    if (examState === 'generating') return <LoadingScreen text={t('exam.loading')} />;

    if (examState === 'listening' && examData.listening) {
        return <QuizSection 
            key="listening"
            language={language}
            title={t('exam.listeningTitle')}
            instructions={t('exam.listeningInstructions')}
            questions={examData.listening.questions}
            onComplete={(score) => handleSectionComplete('listening', score)}
            headerContent={<AudioPlayer audioBase64={examData.listening.audio} t={t} />}
            icon={Headphones}
        />
    }
    
    if (examState === 'reading' && examData.reading) {
        return <QuizSection
            key="reading"
            language={language}
            title={t('exam.readingTitle')}
            instructions={t('exam.readingInstructions')}
            questions={examData.reading.questions}
            onComplete={(score) => handleSectionComplete('reading', score)}
            headerContent={<div className="p-6 bg-slate-50 border border-slate-200 rounded-xl max-h-64 overflow-y-auto"><p className="text-slate-700 leading-relaxed whitespace-pre-line">{examData.reading.text}</p></div>}
            icon={BookOpen}
        />
    }
    
    if (examState === 'writing' && examData.writing) {
        return <WritingSection 
            language={language}
            prompt={examData.writing.prompt}
            onComplete={handleWritingComplete}
            t={t}
        />
    }
    
    if (examState === 'speaking' && examData.speaking) {
        return <SpeakingSection 
            language={language}
            continuousPrompt={examData.speaking.continuousPrompt}
            interactionPrompt={examData.speaking.interactionPrompt}
            onComplete={() => setExamState('results')}
            t={t}
        />
    }
    
     if (examState === 'results') {
        return <ResultsScreen 
            examData={examData} 
            t={t} 
            onRetake={() => setExamState('intro')}
        />
    }

    return <ExamIntro />;
};


// --- Sub-components for each exam section ---

const LoadingScreen: React.FC<{ text: string }> = ({ text }) => (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-500">{text}</p>
    </div>
);

const AudioPlayer: React.FC<{audioBase64: string, t: (k:string) => string}> = ({ audioBase64, t }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    return (
        <div className="flex justify-center">
            <button
                onClick={async () => { setIsPlaying(true); await playAudio(audioBase64); setIsPlaying(false); }}
                disabled={isPlaying}
                className="flex items-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-60"
            >
                {isPlaying ? <Loader2 className="animate-spin" size={24}/> : <PlayCircle size={24} />}
                <span className="font-bold">{t('exam.listen')}</span>
            </button>
        </div>
    );
};

const QuizSection: React.FC<{
    language: Language,
    title: string,
    instructions: string,
    questions: QuizQuestion[],
    onComplete: (score: number) => void,
    headerContent: React.ReactNode,
    icon: React.ElementType
}> = ({ language, title, instructions, questions, onComplete, headerContent, icon: Icon }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const { t } = useTranslation(language);

    const handleAnswer = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);
        if (index === questions[currentQuestionIndex].correctAnswerIndex) {
            setScore(s => s + 1);
        }
    };
    
    const next = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(p => p + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            onComplete(score);
        }
    };
    
    const currentQ = questions[currentQuestionIndex];

    return (
        <div className="max-w-3xl mx-auto flex flex-col h-full justify-center animate-in fade-in">
            <div className="text-center mb-8 space-y-3">
                 <div className="inline-block bg-blue-100 text-blue-600 p-4 rounded-full">
                    <Icon size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 font-heading">{title}</h2>
                <p className="text-slate-500">{instructions}</p>
            </div>

            {headerContent}
            
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 mt-8">
                <p className="text-sm font-bold text-slate-500 mb-4">{t('exercises.question', { current: (currentQuestionIndex + 1).toString(), total: questions.length.toString() })}</p>
                <p className="text-lg font-semibold text-slate-800 mb-6 text-center leading-relaxed">{currentQ.question}</p>
                <div className="space-y-4">
                    {currentQ.options.map((option, index) => {
                        const isCorrect = index === currentQ.correctAnswerIndex;
                        const isSelected = selectedAnswer === index;
                        let buttonClass = 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50';

                        if (isAnswered) {
                            if (isCorrect) buttonClass = 'bg-green-50 border-green-500 text-green-800 font-semibold';
                            else if (isSelected) buttonClass = 'bg-red-50 border-red-500 text-red-800';
                            else buttonClass = 'bg-slate-50 border-slate-200 text-slate-500';
                        }
                        return (
                            <button key={index} onClick={() => handleAnswer(index)} disabled={isAnswered} className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-start font-medium flex items-center justify-between group ${buttonClass}`}>
                                <span>{option}</span>
                                {isAnswered && (
                                    <span className="w-6 h-6 flex items-center justify-center rounded-full">
                                        {isCorrect ? <CheckCircle2 size={20} /> : (isSelected && <XCircle size={20} />)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                {isAnswered && (
                    <div className="mt-6 text-start animate-in fade-in">
                        <p className="font-bold text-slate-700 mb-1 font-heading">{t('exercises.explanation', { language })}</p>
                        <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
                        <button onClick={next} className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                            {t('exam.nextSection')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const WritingSection: React.FC<{
    language: Language,
    prompt: string,
    onComplete: (feedback: string, userText: string) => void,
    t: (k: string) => string
}> = ({ language, prompt, onComplete, t }) => {
    const [userText, setUserText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [modelAnswer, setModelAnswer] = useState<{ modelAnswer: string; analysis: string; } | null>(null);
    const [loadingModel, setLoadingModel] = useState(false);

    const handleAnalyze = async () => {
        if (!userText.trim()) return;
        setLoading(true);
        const fb = await getWritingFeedback(prompt, userText, language);
        setFeedback(fb);
        setLoading(false);
    };

    const handleShowModel = async () => {
        setLoadingModel(true);
        const answer = await getWritingExample(prompt);
        setModelAnswer(answer);
        setLoadingModel(false);
    };

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col justify-center animate-in fade-in">
            <div className="text-center mb-8 space-y-3">
                 <div className="inline-block bg-green-100 text-green-600 p-4 rounded-full">
                    <PenSquare size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 font-heading">{t('exam.writingTitle')}</h2>
                <p className="text-slate-500">{t('exam.writingInstructions')}</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                    <p className="font-semibold text-slate-700">{prompt}</p>
                </div>
                <textarea 
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    rows={8}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition"
                    placeholder="Écrivez votre texte ici..."
                    disabled={!!feedback || !!modelAnswer}
                />
                {!feedback && !modelAnswer && (
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <button 
                            onClick={handleAnalyze} 
                            disabled={loading || !userText.trim()}
                            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-lg shadow-green-500/30 flex justify-center items-center gap-2"
                        >
                            {loading ? <><Loader2 className="animate-spin" size={20}/> {t('exam.analyzing')}</> : t('exam.submitAndAnalyze')}
                        </button>
                        <button
                            onClick={handleShowModel}
                            disabled={loading || loadingModel || !!userText.trim()}
                            className="flex-1 sm:flex-auto py-3 px-6 bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                        >
                             {loadingModel ? <Loader2 className="animate-spin" size={20}/> : <Wand2 size={20}/>}
                             {t('examStudy.showExample')}
                        </button>
                    </div>
                )}
            </div>

            {modelAnswer && (
                 <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 mt-8 animate-in fade-in">
                    <h3 className="text-xl font-bold font-heading mb-4 text-slate-800">{t('examStudy.modelAnswer')}</h3>
                    <div className="text-slate-800 leading-loose bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6 prose max-w-none">
                        {renderInlineFormatting(modelAnswer.modelAnswer)}
                    </div>

                    <h4 className="text-lg font-bold text-slate-800 font-heading mb-2">{t('examStudy.analysisTitle')}</h4>
                    <div className="p-1">
                        <FormattedContent text={modelAnswer.analysis} />
                    </div>
                    
                    <button onClick={() => onComplete('', '')} className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                        {t('exam.nextSection')}
                    </button>
                </div>
            )}

            {feedback && (
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 mt-8 animate-in fade-in">
                    <h3 className="text-xl font-bold font-heading mb-4 text-slate-800">{t('exam.feedbackTitle')}</h3>
                    <FormattedContent text={feedback} />
                    <button onClick={() => onComplete(feedback, userText)} className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                        {t('exam.nextSection')}
                    </button>
                </div>
            )}
        </div>
    );
};


const SpeakingSection: React.FC<{
    language: Language,
    continuousPrompt: string,
    interactionPrompt: string,
    onComplete: () => void,
    t: (k:string) => string
}> = ({ language, continuousPrompt, interactionPrompt, onComplete, t }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [example, setExample] = useState<{ text: string; audio: string } | null>(null);
    const [loadingExample, setLoadingExample] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
            console.warn("Microphone permission denied.");
        });
    }, []);

    const handleRecordToggle = () => setIsRecording(!isRecording);

    const handleGetExample = async () => {
        setLoadingExample(true);
        const res = await getSpeakingExample(continuousPrompt, language);
        setExample(res);
        setLoadingExample(false);
    };
    
    const handlePlayAudio = async () => {
        if (!example || isAudioPlaying) return;
        setIsAudioPlaying(true);
        await playAudio(example.audio);
        setIsAudioPlaying(false);
    };
    
    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col justify-center animate-in fade-in">
             <div className="text-center mb-8 space-y-3">
                 <div className="inline-block bg-rose-100 text-rose-600 p-4 rounded-full">
                    <Mic size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 font-heading">{t('exam.speakingTitle')}</h2>
                <p className="text-slate-500">{t('exam.speakingInstructions')}</p>
            </div>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="font-bold text-lg font-heading text-slate-800">{t('exam.speakingContinuousTitle')}</h3>
                    <p className="text-slate-600 mt-2 mb-4">{continuousPrompt}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <h3 className="font-bold text-lg font-heading text-slate-800">{t('exam.speakingInteractionTitle')}</h3>
                    <p className="text-slate-600 mt-2 mb-4">{interactionPrompt}</p>
                </div>
            </div>
            
            <div className="mt-8 text-center flex flex-col sm:flex-row justify-center items-center gap-4">
                 <button 
                    onClick={handleRecordToggle}
                    className={`px-8 py-3 font-bold rounded-xl text-white shadow-lg transition-colors flex items-center gap-3 ${isRecording ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30'}`}
                 >
                    <Mic size={20} />
                    {isRecording ? t('exam.stopRecording') : t('exam.startRecording')}
                 </button>
                 <button 
                    onClick={handleGetExample}
                    disabled={loadingExample}
                    className="py-3 px-6 bg-slate-600 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {loadingExample ? <Loader2 className="animate-spin" size={20}/> : <Wand2 size={20}/>}
                    {t('examStudy.showExample')}
                </button>
            </div>
            {isRecording && <p className="text-red-500 font-medium mt-4 animate-pulse text-center">{t('exam.recording')}</p>}

            {example && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 animate-in fade-in mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 font-heading">{t('examStudy.modelAnswer')}</h3>
                        <button 
                            onClick={handlePlayAudio}
                            disabled={isAudioPlaying}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                            {isAudioPlaying ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />}
                             {t('examStudy.listenToExample')}
                        </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-lg border">{example.text}</p>
                </div>
            )}

             <button onClick={onComplete} className="mt-8 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                {t('exam.finishExam')}
            </button>
        </div>
    );
};

const ResultsScreen: React.FC<{
    examData: Partial<ExamData>,
    t: (k:string) => string,
    onRetake: () => void
}> = ({ examData, t, onRetake }) => {
    const { scores, writing, listening, reading } = examData;
    const totalQuestions = (listening?.questions.length || 0) + (reading?.questions.length || 0);
    const totalScore = (scores?.listening || 0) + (scores?.reading || 0);
    return (
        <div className="max-w-3xl mx-auto py-12 animate-in fade-in">
             <div className="text-center mb-8 space-y-3">
                 <div className="inline-block bg-amber-100 text-amber-600 p-4 rounded-full">
                    <Trophy size={32} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 font-heading">{t('exam.resultsTitle')}</h2>
                <p className="text-slate-500">{t('exam.resultsSummary')}</p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 space-y-6">
                <div>
                    <h3 className="text-xl font-bold font-heading text-slate-800">Score</h3>
                    <p className="text-4xl font-bold text-blue-600 font-heading my-2">{totalScore} / {totalQuestions}</p>
                    <div className="flex space-x-6 text-slate-600">
                        <span>{t('exam.part1')}: <span className="font-bold">{scores?.listening} / {listening?.questions.length}</span></span>
                        <span>{t('exam.part2')}: <span className="font-bold">{scores?.reading} / {reading?.questions.length}</span></span>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-slate-200">
                     <h3 className="text-xl font-bold font-heading text-slate-800 mb-4">{t('exam.writingTitle')}</h3>
                     <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                        <p className="font-semibold text-slate-600 italic">"{writing?.userText}"</p>
                    </div>
                    <h4 className="font-bold font-heading text-slate-700">{t('exam.feedbackTitle')}</h4>
                     <div className="mt-2">
                        <FormattedContent text={writing?.feedback || ""} />
                     </div>
                </div>
            </div>
            <div className="text-center mt-8">
                 <button onClick={onRetake} className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 transition-transform active:scale-95">
                    {t('exam.retakeExam')}
                </button>
            </div>
        </div>
    );
};

export default Exam;
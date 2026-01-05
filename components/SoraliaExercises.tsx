import React, { useState, useEffect } from 'react';
import { soraliaExercisesData } from '../soraliaData';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Check, X, RefreshCw } from 'lucide-react';

interface SoraliaExercisesProps {
    language: Language;
}

const SoraliaExercises: React.FC<SoraliaExercisesProps> = ({ language }) => {
    const { t } = useTranslation(language);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('soraliaExercises.title')}</h2>
                <p className="text-slate-500 max-w-3xl mx-auto">{t('soraliaExercises.description')}</p>
            </div>
            
            <div className="space-y-12">
                {soraliaExercisesData.map((exercise, exerciseIndex) => (
                    <Exercise key={exerciseIndex} exercise={exercise} t={t} />
                ))}
            </div>
        </div>
    );
};

const Exercise: React.FC<{ exercise: any, t: (key: string) => string }> = ({ exercise, t }) => {
    const totalBlanks = exercise.questions.reduce((acc: number, q: any) => acc + q.answers.length, 0);
    const [userAnswers, setUserAnswers] = useState<string[]>(Array(totalBlanks).fill(''));
    const [showAnswers, setShowAnswers] = useState(false);

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
    };

    const resetAnswers = () => {
        setUserAnswers(Array(totalBlanks).fill(''));
        setShowAnswers(false);
    }
    
    let blankCounter = -1;

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 font-heading mb-2">{exercise.title}</h3>
            <p className="text-slate-500 mb-6">{exercise.instructions}</p>
            
            <div className="space-y-4">
                {exercise.questions.map((q: any, qIndex: number) => {
                    let answerIndexForQuestion = 0; // This will track the answer index for the current question
                    return (
                        <div key={qIndex} className="flex flex-wrap items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="font-semibold text-slate-500 me-2">{qIndex + 1}.</span>
                             {q.sentence.map((part: string, partIndex: number) => {
                                if (part.startsWith('(') && part.endsWith(')')) {
                                    blankCounter++;
                                    const currentBlankIndex = blankCounter;
                                    const correctAnswer = q.answers[answerIndexForQuestion];
                                    answerIndexForQuestion++; // Increment for the next blank in this question

                                    // The check for undefined is important to prevent the crash
                                    if (correctAnswer === undefined) {
                                        console.error("Mismatch in placeholders and answers", q);
                                        return <span key={partIndex} className="text-red-500">[ERROR]</span>
                                    }

                                    const isCorrect = userAnswers[currentBlankIndex].trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                                    return (
                                        <div key={partIndex} className="inline-block mx-1">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={userAnswers[currentBlankIndex]}
                                                    onChange={(e) => handleAnswerChange(currentBlankIndex, e.target.value)}
                                                    placeholder={part}
                                                    className={`bg-white border-2 rounded-md px-2 py-1 w-32 focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${showAnswers ? (isCorrect ? 'border-green-400' : 'border-red-400') : 'border-slate-300'}`}
                                                />
                                                {showAnswers && (
                                                    <div className="absolute end-2 top-1/2 -translate-y-1/2">
                                                        {isCorrect ? <Check className="text-green-500" size={16}/> : <X className="text-red-500" size={16} />}
                                                    </div>
                                                )}
                                            </div>
                                            {showAnswers && !isCorrect && <p className="text-green-600 text-xs font-semibold mt-1">{correctAnswer}</p>}
                                        </div>
                                    );
                                }
                                return <span key={partIndex} className="text-slate-700 leading-loose">{part}</span>
                             })}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={() => setShowAnswers(!showAnswers)} 
                    className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                    {showAnswers ? t('soraliaExercises.hideAnswers') : t('soraliaExercises.showAnswers')}
                </button>
                 <button 
                    onClick={resetAnswers} 
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl hover:bg-slate-300 transition-colors"
                >
                    <RefreshCw size={16} /> {t('soraliaExercises.reset')}
                </button>
            </div>
        </div>
    );
};

export default SoraliaExercises;
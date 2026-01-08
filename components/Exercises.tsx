import React, { useState } from 'react';
import { GRAMMAR_TOPICS } from '../constants';
import { getQuiz } from '../services/aiService';
import { QuizQuestion, Topic, Language } from '../types';
import { Loader2, CheckCircle2, XCircle, RefreshCcw, Trophy } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface ExercisesProps {
  language: Language;
}

const Exercises: React.FC<ExercisesProps> = ({ language }) => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const { t } = useTranslation(language);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setIsQuizCompleted(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuestions([]);
    setError(null);

    try {
      const quizData = await getQuiz(topic.title, language);
      if (!quizData || quizData.length === 0) {
        throw new Error("No quiz data returned from AI");
      }
      setQuestions(quizData);
    } catch (err: any) {
      console.error("Failed to load quiz:", err);
      setError(err.message || "Failed to load quiz. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Prevent double selecting
    setSelectedAnswer(index);
    if (Number(index) === Number(questions[currentQuestionIndex].correctAnswerIndex)) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(p => p + 1);
      setSelectedAnswer(null);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const reset = () => {
    setSelectedTopic(null);
    setQuestions([]);
    setError(null);
  };

  if (!selectedTopic) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-3xl font-bold text-slate-800 font-heading">{t('exercises.title')}</h2>
          <p className="text-slate-500">{t('exercises.description', { language })}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GRAMMAR_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => startQuiz(topic)}
              className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all text-start group"
            >
              <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-600 transition-colors font-heading">{topic.title}</h3>
              <p className="text-sm text-slate-500 mt-2">{topic.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-blue-500" size={48} />
        <p className="text-slate-500">{t('exercises.loading', { topic: selectedTopic.title })}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-red-100 max-w-lg mx-auto mt-20">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4">
          <XCircle size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Quiz Generation Failed</h3>
        <p className="text-red-500 mt-2 mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-all"
          >
            {t('exercises.goBack')}
          </button>
          <button
            onClick={() => startQuiz(selectedTopic)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <RefreshCcw size={18} /> {t('exercises.tryAnother')}
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center space-y-4 pt-10">
        <p className="text-slate-500">{t('exercises.error')}</p>
        <button onClick={reset} className="text-blue-600 font-bold hover:underline">{t('exercises.goBack')}</button>
      </div>
    )
  }

  if (isQuizCompleted) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mb-4">
          <Trophy size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('exercises.completed')}</h2>
        <p className="text-xl text-slate-600">
          {t('exercises.score')} <span className="font-bold text-blue-600 font-heading">{score}</span> {t('exercises.outOf')} <span className="font-bold font-heading">{questions.length}</span>
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
        >
          {t('exercises.tryAnother')}
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-full justify-center">
      <div className="mb-8 flex justify-between items-center text-sm font-medium text-slate-500">
        <button onClick={reset} className="hover:text-slate-800">{t('exercises.quit')}</button>
        <span className="font-semibold">{t('exercises.question', { current: (currentQuestionIndex + 1).toString(), total: questions.length.toString() })}</span>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <p className="text-xl font-semibold text-slate-800 mb-6 text-center leading-relaxed">{currentQ.question}</p>
        <div className="space-y-4">
          {currentQ.options.map((option, index) => {
            const isCorrect = index === currentQ.correctAnswerIndex;
            const isSelected = selectedAnswer === index;
            let buttonClass = 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50';

            if (selectedAnswer !== null) {
              if (isCorrect) {
                buttonClass = 'bg-green-50 border-green-500 text-green-800 font-semibold';
              } else if (isSelected) {
                buttonClass = 'bg-red-50 border-red-500 text-red-800';
              } else {
                buttonClass = 'bg-slate-50 border-slate-200 text-slate-500';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-start font-medium flex items-center justify-between group ${buttonClass}`}
              >
                <span>{option}</span>
                {selectedAnswer !== null && (
                  <span className="w-6 h-6 flex items-center justify-center rounded-full">
                    {isCorrect ? <CheckCircle2 size={20} /> : (isSelected && <XCircle size={20} />)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selectedAnswer !== null && (
          <div className="mt-6 text-start animate-in fade-in">
            <p className="font-bold text-slate-700 mb-1 font-heading">{t('exercises.explanation', { language })}</p>
            <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
            <button
              onClick={nextQuestion}
              className="mt-6 w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              {currentQuestionIndex < questions.length - 1 ? t('exercises.next') : t('exercises.finish')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exercises;

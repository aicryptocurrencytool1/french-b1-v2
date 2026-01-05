import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Grammar from './components/Grammar';
import Exercises from './components/Exercises';
import Verbs from './components/Verbs';
import Flashcards from './components/Flashcards';
import Phrases from './components/Phrases';
import Settings from './components/Settings';
import SoraliaCourse from './components/SoraliaCourse';
import SoraliaExercises from './components/SoraliaExercises';
import Exam from './components/Exam';
import ExamStudy from './components/ExamStudy';
import ExamOne from './components/ExamOne';
import EssayWriter from './components/EssayWriter';
import { AppView, Language } from './types';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('English');
  const { t } = useTranslation(currentLanguage);

  useEffect(() => {
    if (currentLanguage === 'Arabic') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [currentLanguage]);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard setView={setCurrentView} t={t} />;
      case AppView.GRAMMAR:
        return <Grammar language={currentLanguage} />;
      case AppView.EXERCISES:
        return <Exercises language={currentLanguage} />;
      case AppView.VERBS:
        return <Verbs language={currentLanguage} />;
      case AppView.FLASHCARDS:
        return <Flashcards language={currentLanguage} />;
      case AppView.PHRASES:
        return <Phrases language={currentLanguage} />;
      case AppView.SETTINGS:
        return <Settings language={currentLanguage} />;
      case AppView.SORALIA_COURSE:
        return <SoraliaCourse language={currentLanguage} />;
      case AppView.SORALIA_EXERCISES:
        return <SoraliaExercises language={currentLanguage} />;
      case AppView.EXAM:
        return <Exam language={currentLanguage} />;
      case AppView.EXAM_STUDY:
        return <ExamStudy language={currentLanguage} />;
      case AppView.EXAM_ONE:
        return <ExamOne language={currentLanguage} />;
      case AppView.ESSAY_WRITER:
        return <EssayWriter language={currentLanguage} />;
      default:
        return <Dashboard setView={setCurrentView} t={t}/>;
    }
  };

  return (
    <Layout 
        currentView={currentView} 
        setView={setCurrentView} 
        currentLanguage={currentLanguage} 
        setLanguage={setCurrentLanguage}
        t={t}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
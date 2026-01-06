import React from 'react';
import { ArrowLeft, BookOpen, GraduationCap, Languages, Library, MessageCircle, Menu, X, Home, Globe, Settings as SettingsIcon, Shield, Edit, FileText, PenSquare, BookCheck, ClipboardCheck } from 'lucide-react';
import { AppView, Language } from '../types';
import { LANGUAGES } from '../constants';

interface LayoutProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  children: React.ReactNode;
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, children, currentLanguage, setLanguage, t }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: AppView.DASHBOARD, label: t('layout.navDashboard'), icon: Home },
    { id: AppView.GRAMMAR, label: t('layout.navGrammar'), icon: BookOpen },
    { id: AppView.VERBS, label: t('layout.navVerbs'), icon: Languages },
    { id: AppView.EXERCISES, label: t('layout.navExercises'), icon: GraduationCap },
    { id: AppView.FLASHCARDS, label: t('layout.navFlashcards'), icon: Library },
    { id: AppView.PHRASES, label: t('layout.navPhrases'), icon: MessageCircle },
    { id: AppView.ESSAY_WRITER, label: t('layout.navEssayWriter'), icon: PenSquare },
  ];

  const soraliaNavItems = [
    { id: AppView.SORALIA_COURSE, label: t('layout.navSoraliaCourse'), icon: Shield },
    { id: AppView.SORALIA_EXERCISES, label: t('layout.navSoraliaExercises'), icon: Edit },
    { id: AppView.EXAM_STUDY, label: t('layout.navExamStudy'), icon: BookCheck },
    { id: AppView.EXAM_ONE, label: t('layout.navExamOne'), icon: ClipboardCheck },
    { id: AppView.EXAMEN_BLANC, label: t('layout.navExamenBlanc'), icon: FileText },
    { id: AppView.EXAMEN_BLANC_GENERATOR, label: t('layout.navExamenBlancGenerator'), icon: FileText },
    { id: AppView.EXAM, label: t('layout.navExam'), icon: FileText },
  ];

  const settingsNavItem = { id: AppView.SETTINGS, label: t('layout.navSettings'), icon: SettingsIcon };


  const LanguageSelector = () => (
    <div className="relative group">
      <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg transition-colors w-full">
        <Globe size={18} className="text-blue-400" />
        <span className="flex-1 text-start text-sm font-medium">{LANGUAGES.find(l => l.code === currentLanguage)?.flag} {currentLanguage}</span>
      </button>

      <div className="hidden group-hover:block absolute bottom-full start-0 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl mb-1 overflow-hidden z-50">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full text-start px-4 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center space-x-2 ${currentLanguage === lang.code ? 'bg-slate-700 text-blue-400' : 'text-slate-300'}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderNavItem = (item: { id: AppView, label: string, icon: React.ElementType }) => (
    <button
      key={item.id}
      onClick={() => {
        setView(item.id);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === item.id
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <item.icon size={20} />
      <span className="font-medium">{item.label}</span>
    </button>
  );

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-heading">B1</div>
        <h1 className="text-xl font-bold tracking-tight font-heading">{t('layout.title')}</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map(renderNavItem)}

        <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
          {soraliaNavItems.map(renderNavItem)}
        </div>
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-4">
        <div className="px-4 py-2">
          {renderNavItem(settingsNavItem)}
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase font-semibold mb-2 tracking-wider">{t('layout.language')}</p>
          <LanguageSelector />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 rtl:flex-row-reverse">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 h-full shadow-xl z-10">
        <NavContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex rtl:flex-row-reverse">
          <div className="w-72 h-full shadow-2xl relative">
            <NavContent />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 end-4 text-white p-2"
            >
              <X size={24} />
            </button>
          </div>
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold font-heading">B1</div>
            <span className="font-bold font-heading">{t('layout.title')}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-5xl mx-auto h-full">
            {currentView !== AppView.DASHBOARD && (
              <button
                onClick={() => setView(AppView.DASHBOARD)}
                className="mb-6 flex items-center space-x-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={16} className="rtl:rotate-180" />
                <span>{t('layout.backToDashboard')}</span>
              </button>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
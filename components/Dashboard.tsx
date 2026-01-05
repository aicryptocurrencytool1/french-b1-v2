import React from 'react';
import { AppView } from '../types';
import { ArrowRight, Book, Star, Activity, Award, MessageCircle } from 'lucide-react';

interface DashboardProps {
    setView: (view: AppView) => void;
    t: (key: string) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, t }) => {
    const stats = [
      { label: t("dashboard.dailyStreak"), value: `3 ${t("dashboard.days")}`, icon: Activity, color: "amber" },
      { label: t("dashboard.topicsLearned"), value: "12 / 45", icon: Book, color: "blue" },
      { label: t("dashboard.quizScore"), value: "85%", icon: Award, color: "green" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white overflow-hidden shadow-2xl">
                <div className="absolute top-0 end-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3"></div>
                <div className="absolute bottom-0 start-0 w-32 h-32 bg-white opacity-10 rounded-full translate-y-1/3 -translate-x-1/3 rtl:translate-x-1/3"></div>
                
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block px-3 py-1 bg-blue-500/50 border border-blue-400/30 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">{t('dashboard.level')}</span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight font-heading">{t('dashboard.greeting')}</h1>
                    <p className="text-blue-100 text-lg mb-8 max-w-xl">
                        {t('dashboard.subGreeting')}
                    </p>
                    <button 
                        onClick={() => setView(AppView.GRAMMAR)}
                        className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-transform active:scale-95 transform-gpu shadow-lg flex items-center gap-2"
                    >
                        {t('dashboard.startLearning')} <ArrowRight size={20} className="rtl:rotate-180" />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${stat.color}-100 text-${stat.color}-600`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-800 font-heading">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    onClick={() => setView(AppView.VERBS)}
                    className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                >
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Star size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 font-heading">{t('dashboard.verbConjugator')}</h3>
                    <p className="text-slate-500 leading-relaxed">{t('dashboard.verbConjugatorDesc')}</p>
                </div>

                <div 
                    onClick={() => setView(AppView.PHRASES)}
                    className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-pink-300 hover:shadow-lg transition-all cursor-pointer"
                >
                    <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <MessageCircle size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 font-heading">{t('dashboard.dailyPhrases')}</h3>
                    <p className="text-slate-500 leading-relaxed">{t('dashboard.dailyPhrasesDesc')}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

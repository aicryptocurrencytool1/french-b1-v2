import React, { useState } from 'react';
import { soraliaCourseTopics } from '../soraliaData';
import { ChevronRight, Loader2, BookOpen, ArrowLeft, Shield } from 'lucide-react';
import { Language, Topic } from '../types';
import { useTranslation } from '../hooks/useTranslation';

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

interface SoraliaCourseProps {
  language: Language;
}

const SoraliaCourse: React.FC<SoraliaCourseProps> = ({ language }) => {
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const { t } = useTranslation(language);

  const handleTopicSelect = (topic: any) => {
    setSelectedTopic(topic);
  };

  return (
    <div className="h-full flex flex-col">
      {!selectedTopic ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-slate-800 font-heading">{t('soraliaCourse.title')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('soraliaCourse.description')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {soraliaCourseTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 text-start"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Shield size={20} />
                  </span>
                  <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors rtl:rotate-180" size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1 font-heading">{topic.title}</h3>
                <p className="text-sm text-slate-500 group-hover:text-slate-600">{topic.description}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
          <button
            onClick={() => setSelectedTopic(null)}
            className="self-start mb-6 text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            <span>{t('grammar.backToTopics')}</span>
          </button>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex-1 flex flex-col overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading">{selectedTopic.title}</h2>
              <p className="text-slate-500 mt-2">{selectedTopic.description}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <FormattedContent text={selectedTopic.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoraliaCourse;

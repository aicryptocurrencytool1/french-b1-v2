import React, { useState, useEffect } from 'react';
import { GRAMMAR_TOPICS } from '../constants';
import { getGrammarExplanation } from '../services/aiService';
import { ChevronRight, Loader2, BookOpen, ArrowLeft } from 'lucide-react';
import { Topic, Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { tensesComparisonExplanation } from './specialGrammarTopics';

interface GrammarProps {
  language: Language;
}

const renderInlineFormatting = (text: string) => {
  // Split by bold patterns (**...**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Highlight bold content (usually French words) with a blue background pill
      const content = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100 mx-0.5">
          {content}
        </strong>
      );
    }
    return part;
  });
};

const FormattedContent: React.FC<{ text: string }> = ({ text }) => {
  // Split by newlines but handle potential whitespace
  const lines = text.split(/\n/);
  const content: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (key: string | number) => {
    if (currentList.length > 0) {
      content.push(
        <ul key={`list-${key}`} className="list-disc list-outside space-y-2 my-4 ps-6">
          {currentList.map((li, i) => (
            <li key={i} className="text-slate-600 ps-2 leading-relaxed">{renderInlineFormatting(li)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      flushList(index);
      return;
    }

    // Headers
    if (trimmedLine.startsWith('### ')) {
      flushList(index);
      content.push(<h3 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3 font-heading">{trimmedLine.substring(4)}</h3>);
    } else if (trimmedLine.startsWith('## ')) {
      flushList(index);
      content.push(<h2 key={index} className="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2 border-slate-200 font-heading">{trimmedLine.substring(3)}</h2>);
    } else if (trimmedLine.startsWith('# ')) {
      flushList(index);
      content.push(<h1 key={index} className="text-3xl font-bold text-slate-900 mt-10 mb-6 font-heading">{trimmedLine.substring(2)}</h1>);
    }
    // List items
    else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
      currentList.push(trimmedLine.substring(2));
    }
    // Bold headers (sometimes AI uses **Title**)
    else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length < 50) {
      flushList(index);
      content.push(<p key={index} className="text-lg font-bold text-slate-800 mt-6 mb-2">{trimmedLine.slice(2, -2)}</p>);
    }
    // Regular paragraph
    else {
      flushList(index);
      content.push(<p key={index} className="text-slate-700 leading-relaxed mb-4">{renderInlineFormatting(trimmedLine)}</p>);
    }
  });

  flushList('final');

  return (
    <div className="prose max-w-none pb-8 text-neutral-900">
      {content}
    </div>
  );
};

const Grammar: React.FC<GrammarProps> = ({ language }) => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(language);

  useEffect(() => {
    if (selectedTopic) {
      handleTopicSelect(selectedTopic);
    }
  }, [language]);

  const handleTopicSelect = async (topic: Topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setExplanation("");

    if (topic.id === 'tenses_comparison') {
      const localizedExplanation = tensesComparisonExplanation[language] || tensesComparisonExplanation['English'];
      setExplanation(localizedExplanation || "Explanation not available for this language.");
      setLoading(false);
    } else {
      try {
        const text = await getGrammarExplanation(topic.title, language);
        setExplanation(text);
      } catch (err) {
        console.error(err);
        setExplanation("Sorry, I couldn't generate the explanation at this time. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {!selectedTopic ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-slate-800 font-heading">{t('grammar.title')}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">{t('grammar.description', { language })}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GRAMMAR_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 text-start"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOpen size={20} />
                  </span>
                  <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors rtl:rotate-180" size={20} />
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
            className="self-start mb-6 text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center space-x-1 transition-colors"
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
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Loader2 className="animate-spin text-blue-500" size={48} />
                  <p>{t('grammar.loading', { language })}</p>
                </div>
              ) : (
                <FormattedContent text={explanation} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grammar;

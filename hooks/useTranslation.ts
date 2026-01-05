import { translations } from '../translations';
import { Language } from '../types';

export const useTranslation = (language: Language) => {
  const t = (key: string, replacements?: { [key: string]: string }): string => {
    const keys = key.split('.');
    
    const findTranslation = (lang: Language) => {
        let result: any = translations[lang];
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return null;
            }
        }
        return result;
    };

    let translation = findTranslation(language) || findTranslation('English');

    if (typeof translation !== 'string') {
        return key; // Fallback to key itself if not found
    }

    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        });
    }

    return translation;
  };

  return { t };
};

import { VerbConjugation, QuizQuestion, Flashcard, Phrase, Language } from '../types';

const DB_NAME = 'FrenchB1MasterDB';
const DB_VERSION = 1;

const STORES = {
  grammar: 'grammarExplanations',
  verbs: 'verbConjugations',
  quizzes: 'quizzes',
  flashcards: 'flashcards',
  phrases: 'phrases',
  speech: 'speechAudio',
};

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      Object.values(STORES).forEach(storeName => {
        if (!tempDb.objectStoreNames.contains(storeName)) {
            tempDb.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
      reject('Error opening IndexedDB');
    };
  });
};

const get = <T>(storeName: string, key: string): Promise<T | null> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result ? request.result.value : null);
    };
    request.onerror = () => {
      console.error(`Error getting item with key ${key} from ${storeName}`, request.error);
      reject(request.error);
    };
  });
};

const set = <T>(storeName: string, key: string, value: T): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put({ id: key, value });
        
        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            console.error(`Error setting item with key ${key} in ${storeName}`, request.error);
            reject(request.error);
        };
    });
};

const getAll = (storeName: string): Promise<{id: string, value: any}[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            console.error(`Error getting all items from ${storeName}`, request.error);
            reject(request.error);
        };
    });
}

const exportData = async (): Promise<void> => {
    const db = await openDB();
    const exportObject: { [key: string]: any } = {};
    
    for (const storeName of Object.values(STORES)) {
        const allItems = await getAll(storeName);
        exportObject[storeName] = allItems;
    }

    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `french-b1-master-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const importData = (jsonString: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = JSON.parse(jsonString);
            const db = await openDB();
            const transaction = db.transaction(Object.values(STORES), 'readwrite');

            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = (event) => {
                console.error('Import transaction error:', transaction.error);
                reject(transaction.error);
            };

            for (const storeName of Object.values(STORES)) {
                if (data[storeName]) {
                    const store = transaction.objectStore(storeName);
                    for (const item of data[storeName]) {
                        if (item.id && item.value !== undefined) {
                            store.put(item); // put will add or update
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to parse or import data", error);
            reject(error);
        }
    });
};

const clearData = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const transaction = db.transaction(Object.values(STORES), 'readwrite');
        
        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = () => {
            console.error('Clear data transaction error', transaction.error);
            reject(transaction.error);
        };

        for (const storeName of Object.values(STORES)) {
            transaction.objectStore(storeName).clear();
        }
    });
}

// --- Specific getters and setters for each data type ---

export const dbService = {
  getGrammar: (topic: string, lang: Language) => get<string>(STORES.grammar, `${topic}:${lang}`),
  setGrammar: (topic: string, lang: Language, data: string) => set(STORES.grammar, `${topic}:${lang}`, data),

  getVerb: (verb: string, lang: Language) => get<VerbConjugation>(STORES.verbs, `${verb}:${lang}`),
  setVerb: (verb: string, lang: Language, data: VerbConjugation) => set(STORES.verbs, `${verb}:${lang}`, data),
  
  getQuiz: (topic: string, lang: Language) => get<QuizQuestion[]>(STORES.quizzes, `${topic}:${lang}`),
  setQuiz: (topic: string, lang: Language, data: QuizQuestion[]) => set(STORES.quizzes, `${topic}:${lang}`, data),

  getFlashcards: (cat: string, lang: Language) => get<Flashcard[]>(STORES.flashcards, `${cat}:${lang}`),
  setFlashcards: (cat: string, lang: Language, data: Flashcard[]) => set(STORES.flashcards, `${cat}:${lang}`, data),

  getPhrases: (topic: string, tense: string, lang: Language) => get<Phrase[]>(STORES.phrases, `${topic}:${tense}:${lang}`),
  setPhrases: (topic: string, tense: string, lang: Language, data: Phrase[]) => set(STORES.phrases, `${topic}:${tense}:${lang}`, data),

  getSpeech: (text: string) => get<string>(STORES.speech, text),
  setSpeech: (text: string, data: string) => set(STORES.speech, text, data),

  exportData,
  importData,
  clearData,
};

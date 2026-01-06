import React, { useState } from 'react';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';

const CollapsibleAnswer: React.FC<{ answerText: string; t: (k: string) => string; isModel?: boolean }> = ({ answerText, t, isModel = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="mt-2">
            <button onClick={() => setIsOpen(!isOpen)} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                {isOpen ? t('examOne.hideAnswer') : t('examOne.showAnswer')}
            </button>
            {isOpen && (
                <div className={`mt-2 p-4 border-l-4 rounded-r-lg animate-in fade-in ${isModel ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-green-50 border-green-400 text-green-900'}`}>
                    <div className="whitespace-pre-line prose prose-sm max-w-none">{answerText}</div>
                </div>
            )}
        </div>
    );
};

const Question: React.FC<{ question: string; answer: string; points?: number; t: (k: string) => string; isModel?: boolean }> = ({ question, answer, points, t, isModel }) => (
    <div className="py-3">
        <p className="text-slate-700">
            {question}
            {points && <span className="text-xs text-slate-400 font-mono"> ({points} points)</span>}
        </p>
        <CollapsibleAnswer answerText={answer} t={t} isModel={isModel} />
    </div>
);

const ExamOne: React.FC<{ language: Language }> = ({ language }) => {
    const { t } = useTranslation(language);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('examOne.title')}</h2>
                <p className="text-slate-500 max-w-3xl mx-auto">{t('examOne.description')}</p>
                <p className="text-sm text-slate-400">Durée : 1h30 | Total : 100 points</p>
            </div>

            {/* Part 1 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 font-heading mb-4">PARTIE 1 : COMPRÉHENSION DE L’ORAL (20 points)</h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 italic text-slate-600">
                    <p className="font-semibold">Dialogue (à lire comme un script audio) :</p>
                    <p><span className="font-bold text-slate-800">Ana :</span> Salut Marc ! Tu as passé un bon week-end ?</p>
                    <p><span className="font-bold text-slate-800">Marc :</span> Oui, samedi, je suis allé au cinéma avec des amis. On a vu un film comique.</p>
                    <p><span className="font-bold text-slate-800">Ana :</span> Et dimanche ?</p>
                    <p><span className="font-bold text-slate-800">Marc :</span> Dimanche, je suis resté chez moi. J’ai aidé mes parents à faire des travaux dans le jardin.</p>
                    <p><span className="font-bold text-slate-800">Ana :</span> Ah bon ? Et avant, quand tu étais enfant, tu faisais souvent ça ?</p>
                    <p><span className="font-bold text-slate-800">Marc :</span> Oui, quand j’avais 10 ans, je jouais toujours dans le jardin. Maintenant, c’est différent !</p>
                    <p><span className="font-bold text-slate-800">Ana :</span> Et demain, tu vas faire quoi ?</p>
                    <p><span className="font-bold text-slate-800">Marc :</span> Demain, je vais rendre visite à ma grand-mère. Si j’ai le temps, j’irai aussi à la bibliothèque.</p>
                </div>
                <div className="mt-4 divide-y divide-slate-200">
                    <Question question="1. Qu’est-ce que Marc a fait samedi ?" answer="Il est allé au cinéma avec des amis." points={2} t={t} />
                    <Question question="2. Quel temps verbal Marc utilise-t-il pour parler de son enfance ? Donne un exemple du dialogue." answer="Il utilise l’imparfait. Exemple : “Quand j’avais 10 ans, je jouais toujours dans le jardin.”" points={3} t={t} />
                    <Question question="3. Quels sont ses projets pour demain ?" answer="Demain, il va rendre visite à sa grand-mère et s’il a le temps, il ira à la bibliothèque." points={2} t={t} />
                    <Question question="4. Vrai ou Faux ?" answer={"Marc a vu un film d’horreur. -> Faux\nDimanche, il est allé au parc. -> Faux\nDans son enfance, il jouait dans le jardin. -> Vrai"} points={3} t={t} />
                    <Question question="5. Imagine que tu sois Marc. Raconte ton dimanche en 3 phrases." answer="Dimanche, je suis resté à la maison. J’ai aidé mes parents dans le jardin. C’était fatigant mais agréable." points={5} t={t} isModel />
                    <Question question="6. Trouve dans le dialogue : un verbe au passé composé, un à l’imparfait, un au futur proche." answer={"Passé composé : “je suis allé”\nImparfait : “j’avais” ou “je jouais”\nFutur proche : “je vais rendre visite”"} points={5} t={t} />
                </div>
            </div>

            {/* Part 2 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 font-heading mb-4">PARTIE 2 : COMPRÉHENSION DE L’ÉCRIT (20 points)</h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-slate-600">
                    <p className="font-semibold text-center text-slate-800">Un fait divers</p>
                    <p>Hier, à Marseille, un jeune homme a perdu son portefeuille dans le bus. Il cherchait son ticket quand le portefeuille est tombé. Heureusement, une dame l’a vu et l’a ramassé. Elle l’a rendu au conducteur. Le jeune homme était très content. Si seulement il avait fait plus attention !</p>
                </div>
                <div className="mt-4 divide-y divide-slate-200">
                    <Question question="1. Où l’incident s’est-il passé ?" answer="Dans un bus à Marseille." points={2} t={t} />
                    <Question question="2. Qui a trouvé le portefeuille ?" answer="Une dame." points={2} t={t} />
                    <Question question="3. Quelle phrase exprime un regret ? Recopie-la." answer="“Si seulement il avait fait plus attention !”" points={3} t={t} />
                    <Question question="4. Trouve dans le texte :" answer={"Un verbe au passé composé : “a perdu”\nUn verbe à l’imparfait : “cherchait”\nUn verbe au plus-que-parfait : “avait fait”"} points={3} t={t} />
                    <Question question="5. Rédige une déclaration de perte pour ce jeune homme." answer={"Déclaration de perte\nDate : hier\nLieu : bus à Marseille\nObjet perdu : portefeuille\nCirconstances : en cherchant son ticket dans le bus"} points={5} t={t} isModel />
                    <Question question="6. Donne un titre au texte." answer="Un portefeuille perdu et retrouvé" points={2} t={t} isModel />
                    <Question question="7. Que ferais-tu à la place de la dame ?" answer="Je le rendrais au conducteur ou à la police." points={3} t={t} isModel />
                </div>
            </div>

            {/* Part 3 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 font-heading mb-4">PARTIE 3 : PRODUCTION ÉCRITE (20 points)</h3>
                <p className="text-slate-500 mb-4">Choisis UN des sujets (10-15 lignes).</p>
                <div className="divide-y divide-slate-200">
                    <Question
                        question="Sujet 1: Raconte un souvenir d’enfance (quand tu avais 10 ans). Utilise l’imparfait et le passé composé."
                        answer="Quand j’avais 10 ans, j’habitais avec mes parents à la campagne. J’allais à l’école à pied avec mes amis. Un jour, nous avons décidé de faire une cabane dans la forêt. Nous avons ramassé des branches et des feuilles. C’était amusant mais nous avons eu très peur quand un écureuil est passé. Finalement, la cabane n’était pas très solide mais nous étions fiers de notre travail."
                        t={t} isModel />
                    <Question
                        question="Sujet 2: Décris ton logement idéal. Utilise le conditionnel (j’aimerais, je voudrais, il faudrait…)."
                        answer="Mon logement idéal serait un appartement lumineux en centre-ville. J’aimerais qu’il ait trois pièces : un salon, une chambre et un bureau. Il faudrait un grand balcon avec des plantes. Je voudrais habiter dans un quartier calme mais animé, avec des commerces et un parc. Je pourrais me promener le week-end et rencontrer des voisins sympathiques."
                        t={t} isModel />
                </div>
            </div>

            {/* Part 4 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 font-heading mb-4">PARTIE 4 : INTERACTION ORALE (20 points)</h3>
                <p className="text-slate-500 mb-4">Mets-toi en situation avec un partenaire.</p>
                <div className="divide-y divide-slate-200">
                    <Question
                        question="Dialogue : Tu rencontres un ami. Parlez de vos vacances dernières, vos projets pour le week-end prochain, et votre quartier."
                        answer={"A: Qu’as-tu fait pendant les vacances ?\nB: Je suis allé à la montagne. Je skiais tous les jours. Et toi ?\nA: Moi, je suis resté en ville. Je me suis reposé.\nB: Qu’est-ce que tu vas faire ce week-end ?\nA: Je vais voir un film et dimanche, je ferai du sport.\nB: Tu aimes ton quartier ?\nA: Oui, il est calme mais il n’y a pas beaucoup de magasins."}
                        t={t} isModel />
                    <Question
                        question="Conseils : Donne des conseils à ton partenaire sur comment apprendre le français et où passer les vacances. Utilise le conditionnel (tu devrais, tu pourrais…)."
                        answer={"Tu devrais regarder des films en français. Tu pourrais aussi parler avec des natifs. Pour les vacances, tu devrais aller à la mer en été."}
                        t={t} isModel />
                </div>
            </div>

            {/* Part 5 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 font-heading mb-4">PARTIE 5 : PRODUCTION ORALE EN CONTINU (20 points)</h3>
                <p className="text-slate-500 mb-4">Prépare un discours de 2-3 minutes sur un de ces sujets :</p>
                <div className="divide-y divide-slate-200">
                    <Question
                        question="Sujet 1: Présente ton autoportrait (un objet, un animal, une saison, une devise)."
                        answer={'Mon objet préféré est un livre parce que j’adore lire. Mon animal est le chat, car il est indépendant. Ma saison préférée est l’automne, avec ses couleurs. Ma devise : “Qui ne tente rien n’a rien”.'}
                        t={t} isModel />
                    <Question
                        question="Sujet 2: Raconte un fait divers que tu as vécu ou entendu."
                        answer={"La semaine dernière, mon ami a perdu son téléphone dans le métro. Heureusement, une personne l’a trouvé et l’a rapporté à l’accueil. Mon ami était très soulagé."}
                        t={t} isModel />
                    <Question
                        question="Sujet 3: Décris la vie dans les années 1950."
                        answer={"Dans les années 1950, la vie était différente. Les gens n’avaient pas de frigo, ils faisaient les courses tous les jours. Les enfants portaient des blouses à l’école et jouaient dans la rue. Il n’y avait pas de télévision dans toutes les maisons."}
                        t={t} isModel />
                </div>
            </div>

            {/* Revision */}
            <div className="bg-amber-50 p-6 md:p-8 rounded-2xl border-2 border-dashed border-amber-200">
                <h3 className="text-xl font-bold text-amber-800 font-heading mb-4">RÉSUMÉ DES CONSEILS DE RÉVISION</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-amber-900 mb-2">Savoir : à l'écrit et à l'oral :</h4>
                        <ul className="list-disc list-outside space-y-1 ps-6 text-amber-800 text-sm">
                            <li>Raconter un événement au passé en articulant correctement les temps.</li>
                            <li>Présenter son logement/son quartier.</li>
                            <li>Exprimer des souhaits au conditionnel.</li>
                            <li>Exprimer des actions situées dans le futur.</li>
                            <li>Résumer un fait divers.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900 mb-2">Langue :</h4>
                        <ul className="list-disc list-outside space-y-1 ps-6 text-amber-800 text-sm">
                            <li><strong>Temps du passé :</strong> imparfait, plus-que-parfait et passé composé.</li>
                            <li><strong>Temps du présent :</strong> indicatif présent et conditionnel présent.</li>
                            <li><strong>Temps du futur :</strong> futur simple et futur proche.</li>
                            <li><strong>Structures grammaticales :</strong> <em>Si j'avais..., j'aurais...</em> / <em>Si seulement il avait fait ça !</em></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamOne;
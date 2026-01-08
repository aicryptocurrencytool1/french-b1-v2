import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Headphones, BookOpen, PenSquare, Mic, CheckCircle, ArrowRight, Loader2, PlayCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { getSpeech, resumeAudioContext, playAudio, getWritingExample, getSpeakingExample } from '../services/aiService';

interface ExamenBlancProps {
    language: Language;
}

const AudioPlayer: React.FC<{ text: string }> = ({ text }) => {
    const [audioBase64, setAudioBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePlay = async () => {
        if (isPlaying || loading) return;

        setError(null);
        if (!audioBase64) {
            setLoading(true);
            try {
                const audio = await getSpeech(text);
                setAudioBase64(audio);
                await playAudio(audio);
            } catch (e: any) {
                console.error("Failed to load/play audio", e);
                setError(e.message || "Failed to load audio");
            }
            setLoading(false);
        } else {
            setIsPlaying(true);
            try {
                await playAudio(audioBase64);
            } catch (e) {
                console.error(e);
            }
            setIsPlaying(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handlePlay}
                disabled={loading || isPlaying}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors font-semibold shadow-sm w-fit"
            >
                {loading || isPlaying ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                {loading ? 'Génération...' : isPlaying ? 'Lecture...' : 'Écouter le Dialogue'}
            </button>
            {error && (
                <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 animate-in fade-in max-w-sm">
                    ⚠️ {error.includes('RATE_LIMIT') ? "Gemini est fatigué (limite de quota). Veuillez attendre une minute." : "Erreur audio."}
                </div>
            )}
        </div>
    );
};

const ModelAnswerGenerator: React.FC<{ prompt: string; type: 'writing' | 'speaking'; language: Language; context?: string }> = ({ prompt, type, language, context }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            if (type === 'writing') {
                const res = await getWritingExample(prompt + (context ? ` Context: ${context}` : ''));
                setData(res);
            } else {
                const res = await getSpeakingExample(prompt + (context ? ` Context: ${context}` : ''), language);
                setData(res);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate model answer. Please try again.");
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-blue-600 animate-pulse mt-4">
                <Sparkles size={18} /> Generating tailored model answer...
            </div>
        );
    }

    if (!data) {
        return (
            <button
                onClick={generate}
                className="flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md"
            >
                <Sparkles size={18} /> Generate AI Model {type === 'writing' ? 'Dissertation' : 'Response'}
            </button>
        );
    }

    return (
        <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
            <h5 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                <Sparkles size={16} /> AI Model Response
            </h5>
            {type === 'writing' ? (
                <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-indigo-100 text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {data.modelAnswer}
                    </div>
                    {data.analysis && (
                        <div className="text-sm text-indigo-800 bg-indigo-100/50 p-2 rounded">
                            <strong>Analysis:</strong>
                            <div className="prose prose-sm prose-indigo mt-1">{data.analysis}</div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="bg-white p-3 rounded border border-indigo-100 text-slate-800 italic">
                        "{data.text}"
                    </div>
                    {data.audio && (
                        <div className="mt-2">
                            <button
                                onClick={() => playAudio(data.audio)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm font-semibold"
                            >
                                <PlayCircle size={16} /> Listen to Response
                            </button>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};


const ExamenBlanc: React.FC<ExamenBlancProps> = ({ language }) => {
    const { t } = useTranslation(language);
    const [currentSection, setCurrentSection] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

    const handleInputChange = (key: string, value: string) => {
        setUserAnswers(prev => ({ ...prev, [key]: value }));
    };

    // Hardcoded Content
    const listeningDialogue = `Clara : Salut Lucas ! Ça fait longtemps, comment vas-tu ?
Lucas : Salut Clara ! Oui, je suis allé en Espagne pendant les vacances. J'ai visité Barcelone, c'était génial !
Clara : Super ! Tu y es allé comment ?
Lucas : En avion. Je suis parti le 15 août, mais c'était la foule partout. J'ai fait beaucoup de visites, mais je n'ai pas pu voir tous les musées, ils étaient complets.
Clara : Et l'année prochaine, tu as des projets ?
Lucas : Oui, si j'ai assez d'argent, j'irai en Italie. J'aimerais voir Rome.
Clara : Moi, je vais déménager bientôt. Je cherche un appartement plus grand près du centre-ville.
Lucas : Bonne chance ! Tiens-moi au courant.`;

    const readingText = `Un souvenir d'enfance
Quand j'avais dix ans, j'habitais avec mes parents dans un petit village. Tous les étés, nous allions chez mes grands-parents à la mer. Je me souviens que le matin, je me réveillais tôt et j'entendais les oiseaux chanter. Ma grand-mère préparait des crêpes, ça sentait bon dans toute la maison. L'après-midi, nous allions à la plage. Je jouais avec mon frère, nous construisions des châteaux de sable. Un jour, j'ai perdu mon seau rouge. J'étais très triste, mais mon grand-père m'en a acheté un nouveau. C'était des vacances simples mais merveilleuses.`;

    const sections = [
        {
            title: "I. COMPRÉHENSION DE L'ORAL (10 points)",
            type: "listening",
            content: (
                <div className="space-y-6">
                    <p className="text-slate-600 mb-4">Écoutez le dialogue suivant :</p>
                    <AudioPlayer text={listeningDialogue} />

                    <div className="space-y-6 mt-8">
                        <h4 className="font-bold text-lg">Questions :</h4>
                        {[
                            { q: "Où Lucas est-il allé pendant ses vacances ?", a: "Il est allé en Espagne (il a visité Barcelone)." },
                            { q: "Quand est-il parti ?", a: "Il est parti le 15 août." },
                            { q: "Pourquoi n'a-t-il pas vu tous les musées ?", a: "Car ils étaient complets (il y avait beaucoup de monde)." },
                            { q: "Où ira-t-il l'année prochaine s'il a assez d'argent ?", a: "Il ira en Italie (voir Rome)." },
                            { q: "Quel est le projet de Clara ?", a: "Elle va déménager (elle cherche un appartement)." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <label className="block text-slate-700 font-medium">{i + 1}. {item.q} (1 point)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Votre réponse..."
                                    value={userAnswers[`listening_${i}`] || ''}
                                    onChange={(e) => handleInputChange(`listening_${i}`, e.target.value)}
                                />
                                {showAnswers && (
                                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 mt-2">
                                        <strong>Réponse:</strong> {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            title: "II. COMPRÉHENSION DE L'ÉCRIT (10 points)",
            type: "reading",
            content: (
                <div className="space-y-6">
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl leading-relaxed whitespace-pre-line text-slate-800">
                        {readingText}
                    </div>
                    <div className="space-y-6 mt-8">
                        <h4 className="font-bold text-lg">Questions :</h4>
                        {[
                            { q: "Où allait la personne chaque été ?", a: "Elle allait chez ses grands-parents à la mer." },
                            { q: "Qu'est-ce que sa grand-mère préparait le matin ?", a: "Elle préparait des crêpes." },
                            { q: "Que faisaient-ils l'après-midi ?", a: "Ils allaient à la plage et jouaient (châteaux de sable)." },
                            { q: "Pourquoi a-t-elle été triste un jour ?", a: "Parce qu'elle a perdu son seau rouge." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <label className="block text-slate-700 font-medium">{i + 1}. {item.q}</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Votre réponse..."
                                    value={userAnswers[`reading_${i}`] || ''}
                                    onChange={(e) => handleInputChange(`reading_${i}`, e.target.value)}
                                />
                                {showAnswers && (
                                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 mt-2">
                                        <strong>Réponse:</strong> {item.a}
                                    </div>
                                )}
                            </div>
                        ))}

                        <h4 className="font-bold text-lg mt-6">Vrai ou Faux ? (5 points)</h4>
                        {[
                            { s: "a. Elle habitait en ville quand elle était petite.", a: "Faux (dans un petit village)." },
                            { s: "b. Son grand-père lui a acheté un nouveau seau.", a: "Vrai." },
                            { s: "c. Elle détestait ces vacances.", a: "Faux (c'était merveilleux)." },
                            { s: "d. Elle se réveillait tard le matin.", a: "Faux (elle se réveillait tôt)." },
                            { s: "e. Elle allait à la montagne.", a: "Faux (à la mer)." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <p className="font-medium text-slate-700">{item.s}</p>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name={`tf_${i}`} value="Vrai" onChange={(e) => handleInputChange(`reading_tf_${i}`, e.target.value)} checked={userAnswers[`reading_tf_${i}`] === 'Vrai'} /> Vrai
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name={`tf_${i}`} value="Faux" onChange={(e) => handleInputChange(`reading_tf_${i}`, e.target.value)} checked={userAnswers[`reading_tf_${i}`] === 'Faux'} /> Faux
                                    </label>
                                </div>
                                {showAnswers && (
                                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200 mt-2">
                                        <strong>Correction:</strong> {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            title: "III. PRODUCTION ÉCRITE (20 points)",
            type: "writing",
            content: (
                <div className="space-y-6">
                    <p className="text-slate-600">Choisissez UN des deux sujets suivants :</p>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                            <h4 className="font-bold text-lg mb-2 text-blue-700">Sujet A</h4>
                            <p className="text-slate-700">Racontez un souvenir d'enfance heureux (une fête, un voyage, un jour spécial). Utilisez l'imparfait pour décrire et le passé composé pour les actions précises. (100-120 mots)</p>
                            {showAnswers && <ModelAnswerGenerator language={language} type="writing" prompt="Racontez un souvenir d'enfance heureux (une fête, un voyage, un jour spécial). Utilisez l'imparfait pour décrire et le passé composé pour les actions précises." />}
                        </div>
                        <div className="p-6 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                            <h4 className="font-bold text-lg mb-2 text-blue-700">Sujet B</h4>
                            <p className="text-slate-700">Vous venez de déménager dans un nouvel appartement. Écrivez un message à un ami pour :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 text-sm">
                                <li>Décrire votre nouveau logement et votre quartier.</li>
                                <li>Expliquer pourquoi vous avez choisi cet endroit.</li>
                                <li>Parler de ce que vous aimeriez changer ou améliorer à l'avenir (utilisez le conditionnel ou le futur simple). (100-120 mots)</li>
                            </ul>
                            {showAnswers && <ModelAnswerGenerator language={language} type="writing" prompt="Vous venez de déménager dans un nouvel appartement. Écrivez un message à un ami." context="Décrire logement/quartier. Expliquer choix. Souhaits futurs." />}
                        </div>
                    </div>
                    <div className="mt-6">
                        <label className="block text-slate-800 font-bold mb-2">Votre Rédaction:</label>
                        <textarea
                            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-64"
                            placeholder="Écrivez votre texte ici..."
                            value={userAnswers[`writing`] || ''}
                            onChange={(e) => handleInputChange(`writing`, e.target.value)}
                        ></textarea>
                        {showAnswers && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 text-blue-900 text-sm">
                                <strong>Conseils d'auto-correction :</strong>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Avez-vous respecté la consigne de longueur (100-120 mots) ?</li>
                                    <li>Avez-vous utilisé correctement les temps du passé (Imparfait pour description / Passé Composé pour actions) ?</li>
                                    <li>Pour le Sujet B : avez-vous utilisé le vocabulaire du logement et le conditionnel pour les souhaits ?</li>
                                    <li>Avez-vous fait des phrases complètes avec des connecteurs (d'abord, ensuite, mais, parce que) ?</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: "IV. INTERACTION ORALE (Simulation - 20 points)",
            type: "speaking_interaction",
            content: (
                <div className="space-y-6">
                    <p className="text-slate-600">Préparez des réponses aux situations suivantes (vous jouerez les deux rôles mentalement) :</p>
                    <div className="space-y-6">
                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100">
                            <h4 className="font-bold text-rose-800 mb-2">Situation 1 : Discussion Vacances</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                <li>Parlez de l'endroit, de la durée, des activités.</li>
                                <li>Demandez-lui ce qu'il a fait, lui.</li>
                                <li>Exprimez un regret sur quelque chose que vous n'avez pas pu faire. (Utilisez « Si seulement j'avais... »)</li>
                            </ul>
                            {showAnswers && (
                                <>
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Idées clés :</strong> "Je suis allé à...", "C'était magnifique...", "Et toi ?", "Si seulement j'avais eu plus de temps... / Si seulement il n'avait pas plu..."
                                    </div>
                                    <ModelAnswerGenerator language={language} type="speaking" prompt="Situation: Discuter des vacances avec un ami. Parler de l'endroit, durée, activités et exprimer un regret." />
                                </>
                            )}
                        </div>
                        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100">
                            <h4 className="font-bold text-rose-800 mb-2">Situation 2 : Appel Propriétaire</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1 mb-4">
                                <li>Présentez-vous et demandez des informations (prix, équipements, quartier).</li>
                                <li>Exprimez un souhait (« J'aimerais... », « Je voudrais... »).</li>
                                <li>Prenez congé poliment.</li>
                            </ul>
                            {showAnswers && (
                                <>
                                    <div className="bg-white/50 p-3 rounded-lg text-rose-900 text-sm border border-rose-200">
                                        <strong>Idées clés :</strong> "Bonjour, je vous appelle pour l'annonce...", "Est-ce que l'appartement est lumineux ?", "J'aimerais le visiter...", "Merci, bonne journée."
                                    </div>
                                    <ModelAnswerGenerator language={language} type="speaking" prompt="Situation: Appeler un propriétaire pour un appartement. Demander infos, exprimer un souhait." />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "V. PRODUCTION ORALE EN CONTINU (20 points)",
            type: "speaking_continuous",
            content: (
                <div className="space-y-6">
                    <p className="text-slate-600">Préparez une présentation courte (1-2 minutes) sur UN des thèmes suivants :</p>
                    <ul className="list-disc pl-5 space-y-4 text-slate-700">
                        <li>
                            <strong>Thème 1:</strong> Présentez votre personnalité idéale pour un futur travail (qualités, défauts, motivations). Utilisez le conditionnel pour exprimer vos souhaits (« J'aimerais être... », « Je serais... »).
                            {showAnswers && <ModelAnswerGenerator language={language} type="speaking" prompt="Monologue: Présentez votre personnalité idéale pour un futur travail. Utilisez le conditionnel." />}
                        </li>
                        <li>
                            <strong>Thème 2:</strong> Décrivez votre quartier idéal. Où est-il ? Qu'est-ce qu'il y a ? Comment sont les voisins ? Pourquoi est-ce votre idéal ? Utilisez le futur simple ou le conditionnel.
                            {showAnswers && <ModelAnswerGenerator language={language} type="speaking" prompt="Monologue: Décrivez votre quartier idéal. Utilisez le futur simple ou le conditionnel." />}
                        </li>
                    </ul>
                    {showAnswers && (
                        <div className="bg-slate-100 p-4 rounded-lg mt-4 text-slate-700 text-sm">
                            <strong>Conseils :</strong>
                            <ul className="list-disc pl-5 mt-1">
                                <li>Parlez clairement et pas trop vite.</li>
                                <li><strong>Thème 1 :</strong> Utilisez des adjectifs (organisé, créatif, patient) et le conditionnel (Je voudrais travailler...).</li>
                                <li><strong>Thème 2 :</strong> Utilisez le vocabulaire de la ville (parc, commerces, calme) et le futur/conditionnel (Il y aurait des arbres, ce serait calme...).</li>
                            </ul>
                        </div>
                    )}
                </div>
            )
        },
        {
            title: "VI. GRAMMAIRE & LEXIQUE (20 points)",
            type: "grammar",
            content: (
                <div className="space-y-8">
                    <div>
                        <h4 className="font-bold text-lg mb-4">Mettez les verbes au temps correct (passé composé, imparfait ou plus-que-parfait). (6 points)</h4>
                        {[
                            { s: "Quand je (être) _______ enfant, je (jouer) _______ souvent au foot.", a: "étais / jouais" },
                            { s: "Hier, il (pleuvoir) _______ alors nous (rester) _______ à la maison.", a: "a plu (ou pleuvait) / sommes restés" },
                            { s: "Elle était fatiguée parce qu'elle ne (dormir) _______ pas bien la nuit précédente.", a: "n'avait pas dormi (Plus-que-parfait)" }
                        ].map((item, i) => (
                            <div key={i} className="mb-4">
                                <p className="text-slate-700 mb-1">{i + 1}. {item.s}</p>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:border-blue-500"
                                    placeholder="Réponse..."
                                    value={userAnswers[`grammar_ex1_${i}`] || ''}
                                    onChange={(e) => handleInputChange(`grammar_ex1_${i}`, e.target.value)}
                                />
                                {showAnswers && <div className="text-green-600 text-sm mt-1 font-medium">Correction: {item.a}</div>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4">Complétez avec le futur simple ou le conditionnel présent. (6 points)</h4>
                        {[
                            { s: "Si j'avais plus de temps, je (lire) _______ plus de livres.", a: "lirais (Conditionnel)" },
                            { s: "L'année prochaine, je (apprendre) _______ à conduire.", a: "apprendrai (Futur simple)" },
                            { s: "Tu (devoir) _______ faire attention, c'est dangereux !", a: "devrais (Conditionnel - conseil)" }
                        ].map((item, i) => (
                            <div key={i} className="mb-4">
                                <p className="text-slate-700 mb-1">{i + 1}. {item.s}</p>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:border-blue-500"
                                    placeholder="Réponse..."
                                    value={userAnswers[`grammar_ex2_${i}`] || ''}
                                    onChange={(e) => handleInputChange(`grammar_ex2_${i}`, e.target.value)}
                                />
                                {showAnswers && <div className="text-green-600 text-sm mt-1 font-medium">Correction: {item.a}</div>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-4">Transformez la phrase en utilisant « Si seulement... ». (4 points)</h4>
                        <p className="text-sm text-slate-500 mb-2">Exemple : Je n'ai pas écouté ses conseils. → Si seulement j'avais écouté ses conseils !</p>
                        {[
                            { s: "Je n'ai pas acheté ce livre.", a: "Si seulement j'avais acheté ce livre !" },
                            { s: "Nous sommes arrivés en retard.", a: "Si seulement nous n'étions pas arrivés en retard ! (ou: Si seulement nous étions arrivés à l'heure !)" }
                        ].map((item, i) => (
                            <div key={i} className="mb-4">
                                <p className="text-slate-700 mb-1">{i + 1}. {item.s}</p>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:border-blue-500"
                                    placeholder="Réponse..."
                                    value={userAnswers[`grammar_ex3_${i}`] || ''}
                                    onChange={(e) => handleInputChange(`grammar_ex3_${i}`, e.target.value)}
                                />
                                {showAnswers && <div className="text-green-600 text-sm mt-1 font-medium">Correction: {item.a}</div>}
                            </div>
                        ))}
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2">Lexique</h4>
                        <p className="text-slate-700 mb-2">Trouvez 5 mots ou expressions liés au thème du logement/quartier. (4 points)</p>
                        <textarea
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
                            placeholder="Vos mots..."
                            rows={2}
                            value={userAnswers[`lexicon`] || ''}
                            onChange={(e) => handleInputChange(`lexicon`, e.target.value)}
                        ></textarea>
                        {showAnswers && (
                            <div className="bg-green-50 p-3 rounded-lg text-green-800 text-sm border border-green-200">
                                <strong>Suggestions de mots :</strong> appartement, maison, loyer, voisin, quartier calme, immeuble, rez-de-chaussée, déménagement, propriétaire...
                            </div>
                        )}
                    </div>
                </div>
            )

        }
    ];


    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">Examen Blanc - FLE Niveau B1</h2>
                <p className="text-slate-500">Durée totale estimée : 1h30 - 2h</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {currentSection + 1}
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{sections[currentSection].title}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowAnswers(!showAnswers)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${showAnswers ? 'bg-amber-100 text-amber-800' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            {showAnswers ? <EyeOff size={18} /> : <Eye size={18} />}
                            {showAnswers ? 'Hide Answers' : 'Show Answers'}
                        </button>
                        <div className="text-sm text-slate-500 font-medium">Part {currentSection + 1} of {sections.length}</div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    {sections[currentSection].content}
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                    <button
                        onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                        disabled={currentSection === 0}
                        className="px-6 py-2 rounded-lg font-semibold text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                        disabled={currentSection === sections.length - 1}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md shadow-blue-500/30 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        Next Section <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-2 font-heading">Conseil pour demain :</h4>
                <ul className="list-disc pl-5 space-y-2 text-blue-800">
                    <li>Relisez vos fiches sur les temps du passé (PC vs Imparfait) et leur emploi.</li>
                    <li>Revoyez la formation du futur simple et du conditionnel.</li>
                    <li>Pensez à des expressions toutes faites pour l'interaction (Pourrais-tu...? J'aimerais bien... D'accord, et toi ?).</li>
                    <li>Pour la production, structurez vos idées : introduction, 2-3 points développés, conclusion.</li>
                </ul>
            </div>
        </div>
    );
};

export default ExamenBlanc;

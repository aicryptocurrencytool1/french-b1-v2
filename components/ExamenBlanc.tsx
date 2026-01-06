import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Headphones, BookOpen, PenSquare, Mic, CheckCircle, ArrowRight, Loader2, PlayCircle } from 'lucide-react';
import { getSpeech, resumeAudioContext, decode, playAudio } from '../services/geminiService';

interface ExamenBlancProps {
    language: Language;
}

const AudioPlayer: React.FC<{ text: string }> = ({ text }) => {
    const [audioBase64, setAudioBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const fetchAudio = async () => {
            setLoading(true);
            try {
                const audio = await getSpeech(text);
                setAudioBase64(audio);
            } catch (e) {
                console.error("Failed to load audio", e);
            }
            setLoading(false);
        };
        fetchAudio();
    }, [text]);

    const handlePlay = async () => {
        if (!audioBase64 || isPlaying) return;
        setIsPlaying(true);
        try {
            await playAudio(audioBase64);
        } catch (e) {
            console.error(e);
        }
        setIsPlaying(false);
    };

    if (loading) return <div className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={16} /> Loading audio...</div>;
    if (!audioBase64) return <div className="text-red-500">Audio unavailable</div>;

    return (
        <button
            onClick={handlePlay}
            disabled={isPlaying}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
        >
            {isPlaying ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
            Listen to Dialogue
        </button>
    );
};


const ExamenBlanc: React.FC<ExamenBlancProps> = ({ language }) => {
    const { t } = useTranslation(language);
    const [currentSection, setCurrentSection] = useState(0);

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

                    <div className="space-y-4 mt-8">
                        <h4 className="font-bold text-lg">Questions :</h4>
                        <ul className="list-decimal pl-5 space-y-4 text-slate-700">
                            <li>Où Lucas est-il allé pendant ses vacances ? (1 point)</li>
                            <li>Quand est-il parti ? (1 point)</li>
                            <li>Pourquoi n'a-t-il pas vu tous les musées ? (1 point)</li>
                            <li>Où ira-t-il l'année prochaine s'il a assez d'argent ? (1 point)</li>
                            <li>Quel est le projet de Clara ? (1 point)</li>
                        </ul>
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
                    <div className="space-y-4 mt-8">
                        <h4 className="font-bold text-lg">Questions :</h4>
                        <ul className="list-decimal pl-5 space-y-2 text-slate-700">
                            <li>Où allait la personne chaque été ? (1 point)</li>
                            <li>Qu'est-ce que sa grand-mère préparait le matin ? (1 point)</li>
                            <li>Que faisaient-ils l'après-midi ? (2 points)</li>
                            <li>Pourquoi a-t-elle été triste un jour ? (1 point)</li>
                        </ul>
                        <h4 className="font-bold text-lg mt-4">Vrai ou Faux ? (5 points)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-slate-700">
                            <li>a. Elle habitait en ville quand elle était petite.</li>
                            <li>b. Son grand-père lui a acheté un nouveau seau.</li>
                            <li>c. Elle détestait ces vacances.</li>
                            <li>d. Elle se réveillait tard le matin.</li>
                            <li>e. Elle allait à la montagne.</li>
                        </ul>
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
                        </div>
                        <div className="p-6 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                            <h4 className="font-bold text-lg mb-2 text-blue-700">Sujet B</h4>
                            <p className="text-slate-700">Vous venez de déménager dans un nouvel appartement. Écrivez un message à un ami pour :</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600 text-sm">
                                <li>Décrire votre nouveau logement et votre quartier.</li>
                                <li>Expliquer pourquoi vous avez choisi cet endroit.</li>
                                <li>Parler de ce que vous aimeriez changer ou améliorer à l'avenir (utilisez le conditionnel ou le futur simple). (100-120 mots)</li>
                            </ul>
                        </div>
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
                    <div className="space-y-4">
                        <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                            <h4 className="font-bold text-rose-800 mb-2">Situation 1 : Discussion Vacances</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1">
                                <li>Parlez de l'endroit, de la durée, des activités.</li>
                                <li>Demandez-lui ce qu'il a fait, lui.</li>
                                <li>Exprimez un regret sur quelque chose que vous n'avez pas pu faire. (Utilisez « Si seulement j'avais... »)</li>
                            </ul>
                        </div>
                        <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                            <h4 className="font-bold text-rose-800 mb-2">Situation 2 : Appel Propriétaire</h4>
                            <ul className="list-disc pl-5 text-rose-700 space-y-1">
                                <li>Présentez-vous et demandez des informations (prix, équipements, quartier).</li>
                                <li>Exprimez un souhait (« J'aimerais... », « Je voudrais... »).</li>
                                <li>Prenez congé poliment.</li>
                            </ul>
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
                        </li>
                        <li>
                            <strong>Thème 2:</strong> Décrivez votre quartier idéal. Où est-il ? Qu'est-ce qu'il y a ? Comment sont les voisins ? Pourquoi est-ce votre idéal ? Utilisez le futur simple ou le conditionnel.
                        </li>
                    </ul>
                </div>
            )
        },
        {
            title: "VI. GRAMMAIRE & LEXIQUE (20 points)",
            type: "grammar",
            content: (
                <div className="space-y-8">
                    <div>
                        <h4 className="font-bold text-lg mb-2">Mettez les verbes au temps correct (passé composé, imparfait ou plus-que-parfait). (6 points)</h4>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                            <li>Quand je (être) _______ enfant, je (jouer) _______ souvent au foot.</li>
                            <li>Hier, il (pleuvoir) _______ alors nous (rester) _______ à la maison.</li>
                            <li>Elle était fatiguée parce qu'elle ne (dormir) _______ pas bien la nuit précédente.</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2">Complétez avec le futur simple ou le conditionnel présent. (6 points)</h4>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                            <li>Si j'avais plus de temps, je (lire) _______ plus de livres.</li>
                            <li>L'année prochaine, je (apprendre) _______ à conduire.</li>
                            <li>Tu (devoir) _______ faire attention, c'est dangereux !</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2">Transformez la phrase en utilisant « Si seulement... ». (4 points)</h4>
                        <p className="text-sm text-slate-500 mb-2">Exemple : Je n'ai pas écouté ses conseils. → Si seulement j'avais écouté ses conseils !</p>
                        <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                            <li>Je n'ai pas acheté ce livre.</li>
                            <li>Nous sommes arrivés en retard.</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-2">Lexique</h4>
                        <p className="text-slate-700">Trouvez 5 mots ou expressions liés au thème du logement/quartier. (4 points)</p>
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
                    <div className="text-sm text-slate-500 font-medium">Part {currentSection + 1} of {sections.length}</div>
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

// User Profile for Personalized Exam Content
// This profile is used by the AI to generate contextually relevant examples

export const userProfile = {
    name: "Ahmad",
    age: 43,
    status: "single",

    // Current Life in Belgium
    currentLocation: {
        city: "Liège",
        neighborhood: "Citadelle",
        country: "Belgium",
        yearsLiving: 3,
    },

    // Family & Social
    family: {
        friend: "1 ami à Liège",
        sister: "Ma sœur vit en Allemagne avec son mari et ses 2 filles",
    },

    // Professional Background
    career: {
        profession: "ingénieur informatique",
        currentStatus: "cherche un emploi",
        goalSector: "entreprise de télécommunications",
        frenchLevel: "niveau B1 - en cours d'apprentissage",
        projects: [
            "Application web intelligente pour générer des CV avec l'IA (terminée)",
            "Outil d'IA pour le service client (en développement)",
        ],
        futureGoal: "Créer une entreprise en Belgique pour commercialiser mes outils",
    },

    // Childhood in Lebanon
    childhood: {
        location: "village au Liban",
        activities: "jouais toujours au football",
        memorableEvent: "Une fois, je suis tombé et je me suis blessé à la main en jouant au football. Je suis allé à l'hôpital où ils ont recousu la plaie.",
        feelings: "J'étais heureux quand j'étais enfant. Si seulement je pouvais retourner à ces jours-là !",
    },

    // Grammar Focus
    grammarEmphasis: [
        "présent",
        "passé composé",
        "imparfait",
        "plus-que-parfait",
        "conditionnel",
        "négation complexe",
        "structures avec 'si seulement'",
    ],
};

// Generate a comprehensive context string for AI prompts
export const getUserContext = (): string => {
    return `
**Profil de l'étudiant (à utiliser pour personnaliser les exemples) :**
- **Nom :** ${userProfile.name}
- **Âge :** ${userProfile.age} ans, célibataire
- **Situation actuelle :** Vit à ${userProfile.currentLocation.city}, dans le quartier de la **${userProfile.currentLocation.neighborhood}** (${userProfile.currentLocation.country}) depuis ${userProfile.currentLocation.yearsLiving} ans.
- **Famille :** ${userProfile.family.friend}, ${userProfile.family.sister}
- **Profession :** ${userProfile.career.profession}, ${userProfile.career.currentStatus}
- **Objectif professionnel :** Trouver un emploi dans une ${userProfile.career.goalSector}
- **Projets personnels :** ${userProfile.career.projects.join(', ')}
- **Enfance au Liban :** Vivait dans un ${userProfile.childhood.location}, ${userProfile.childhood.activities}
- **Souvenir marquant :** ${userProfile.childhood.memorableEvent}
- **Nostalgie :** ${userProfile.childhood.feelings}

**Instructions grammaticales prioritaires :**
Utilisez les temps suivants : ${userProfile.grammarEmphasis.join(', ')}. 
Incorporez des phrases avec "Si seulement..." pour exprimer des regrets.

**COMPORTEMENT DE L'IA :**
- Utilisez les informations sur l'**enfance** UNIQUEMENT pour les sujets portant sur le passé lointain ou le Liban.
- Utilisez les informations sur le **logement et le quartier** UNIQUEMENT pour les sujets sur la vie actuelle en Belgique.
- Adaptez le vocabulaire pour qu'il soit simple et naturel (niveau A2-B1). Évitez les phrases trop complexes ou littéraires.

**CONTRAINTES DE LONGUEUR :**
Tous les textes modèles (modelAnswer, text) doivent être CONCIS : faites exactement **8 à 10 phrases**. Pas plus, pas moins.
    `.trim();
};

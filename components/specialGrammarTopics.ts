import { Language } from '../types';

type SpecialExplanation = {
    [key in Language]?: string;
}

const englishExplanation = `
# Passé Composé vs Imparfait vs PQP vs Conditionnel
(For Dummies) When to use which tense.

## A Simple Guide to Past Tenses (for Dummies)
Imagine you are telling a story about a party you went to. This story helps us understand the job of each tense.

### Passé Composé: The Action Movie Star
**Its Job:** To tell what happened. These are the main events, the completed actions that move the story forward. Think of them as snapshots or the key plot points.

*   **In the story:** "Hier soir, **je suis allé** à une fête. **J'ai dansé** toute la nuit. Soudain, **il a commencé** à pleuvoir."
*   (Last night, **I went** to a party. **I danced** all night. Suddenly, **it started** to rain.)
*   **Use it for:** Specific, finished actions in the past.

### Imparfait: The Scenery Painter
**Its Job:** To describe the background and setting. It paints a picture of what was going on, what things were like, or what people were doing over a period of time.

*   **In the story:** "**Il y avait** beaucoup de monde. La musique **était** forte et tout le monde **parlait**."
*   (There **were** a lot of people. The music **was** loud and everyone **was talking**.)
*   **Use it for:**
    *   Descriptions in the past (weather, feelings, appearance).
    *   Actions that were in progress.
    *   Habits in the past ("When I was young, I played tennis...").

### Plus-que-parfait (PQP): The Flashback Director
**Its Job:** To talk about an action that had already happened *before* another past action. It's the "past of the past".

*   **In the story:** "**J'ai mangé** le gâteau que mon amie **avait préparé**."
*   (**I ate** the cake that my friend **had prepared**.)
*   **The logic:** Your friend prepared the cake *before* you ate it. Both actions are in the past, but the PQP shows which one came first.
*   **Use it for:** Providing backstory or context for a past event.

### Conditionnel: The "What If" Dreamer
**Its Job:** To talk about hypothetical situations. What *would have happened* if things were different. It's often paired with a "Si + Imparfait" clause. It can also report unconfirmed information.

*   **In the story (hypothetical):** "Si **j'avais su**, **je serais venu** plus tôt."
*   (If **I had known**, **I would have come** earlier.)
*   **In the story (unconfirmed news):** "Le journal a dit que la star **arriverait** à 22h."
*   (The newspaper said the star **would arrive** at 10pm.) - This is future-in-the-past.
*   **Use it for:** Imaginary situations, polite requests, advice, and future events seen from a past perspective.

## Summary
*   **Passé Composé:** BAM! An action happened.
*   **Imparfait:** Here's what the scene looked like...
*   **Plus-que-parfait:** Let me tell you what happened *before* that...
*   **Conditionnel:** What could have, should have, or would have been...
`;

const arabicExplanation = `
# Passé Composé vs Imparfait vs PQP vs Conditionnel
(للمبتدئين) متى نستخدم كل زمن.

## دليل بسيط لأزمنة الماضي (للمبتدئين)
تخيل أنك تحكي قصة عن حفلة ذهبت إليها. هذه القصة تساعدنا في فهم وظيفة كل زمن.

### Passé Composé: نجم أفلام الحركة
**وظيفته:** إخبارنا بما حدث. هذه هي الأحداث الرئيسية، الأفعال المكتملة التي تدفع القصة للأمام. فكر فيها كلقطات سريعة أو نقاط الحبكة الرئيسية.

*   **في القصة:** "Hier soir, **je suis allé** à une fête. **J'ai dansé** toute la nuit. Soudain, **il a commencé** à pleuvoir."
*   (الليلة الماضية، **ذهبت** إلى حفلة. **رقصت** طوال الليل. فجأة، **بدأت** تمطر.)
*   **استخدمه لـ:** أفعال محددة ومنتهية في الماضي.

### Imparfait: رسام المناظر الطبيعية
**وظيفته:** وصف الخلفية والإطار. إنه يرسم صورة لما كان يحدث، كيف كانت الأشياء، أو ماذا كان يفعل الناس على مدى فترة من الزمن.

*   **في القصة:** "**Il y avait** beaucoup de monde. La musique **était** forte et tout le monde **parlait**."
*   (لقد **كان هناك** الكثير من الناس. الموسيقى **كانت** صاخبة والجميع **كان يتحدث**.)
*   **استخدمه لـ:**
    *   الوصف في الماضي (الطقس، المشاعر، المظهر).
    *   الأفعال التي كانت مستمرة.
    *   العادات في الماضي ("عندما كنت صغيراً، كنت العب التنس...").

### Plus-que-parfait (PQP): مخرج "الفلاش باك"
**وظيفته:** في التحدث عن فعل حدث بالفعل *قبل* فعل ماضي آخر. إنه "ماضي الماضي".

*   **في القصة:** "**J'ai mangé** le gâteau que mon amie **avait préparé**."
*   (**أكلت** الكعكة التي **كانت قد أعدتها** صديقتي.)
*   **المنطق:** صديقتك أعدت الكعكة *قبل* أن تأكلها. كلا الفعلين في الماضي، لكن PQP يوضح أيهما حدث أولاً.
*   **استخدمه لـ:** تقديم القصة الخلفية أو السياق لحدث ماضي.

### Conditionnel: الحالم بـ "ماذا لو"
**وظيفته:** التحدث عن مواقف افتراضية. ما الذي *كان سيحدث* لو كانت الأشياء مختلفة. غالباً ما يقترن بجملة "Si + Imparfait". يمكنه أيضاً الإبلاغ عن معلومات غير مؤكدة.

*   **في القصة (افتراضي):** "Si **j'avais su**, **je serais venu** plus tôt."
*   (لو **كنت أعرف**، **لكنت أتيت** مبكراً.)
*   **في القصة (أخبار غير مؤكدة):** "Le journal a dit que la star **arriverait** à 22h."
*   (قالت الصحيفة أن النجم **سيصل** في الساعة 10 مساءً.) - هذا هو "المستقبل في الماضي".
*   **استخدمه لـ:** المواقف الخيالية، الطلبات المهذبة، النصائح، والأحداث المستقبلية من منظور ماضي.

## ملخص
*   **Passé Composé:** بوم! حدث فعل ما.
*   **Imparfait:** هكذا كان شكل المشهد...
*   **Plus-que-parfait:** دعني أخبرك بما حدث *قبل* ذلك...
*   **Conditionnel:** ما الذي كان يمكن، أو ينبغي، أو كان سيحدث...
`;

export const tensesComparisonExplanation: SpecialExplanation = {
    English: englishExplanation,
    Arabic: arabicExplanation,
};

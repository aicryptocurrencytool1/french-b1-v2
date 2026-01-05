import { Language } from '../types';

type SpecialExplanation = {
    [key in Language]?: string;
}

const englishExplanation = `
## A Simple Guide to Past Tenses (for Dummies)

Imagine you are telling a story about a party you went to. This story helps us understand the job of each tense.

## Passé Composé: The Action Movie Star

**Its Job:** To tell **what happened**. These are the main events, the completed actions that move the story forward. Think of them as snapshots or the key plot points.

*   **In the story:** "Hier soir, **je suis allé** à une fête. **J'ai dansé** toute la nuit. Soudain, **il a commencé** à pleuvoir."
*   (Last night, **I went** to a party. **I danced** all night. Suddenly, **it started** to rain.)
*   **Use it for:** Specific, finished actions in the past.

## Imparfait: The Scenery Painter

**Its Job:** To describe the **background and setting**. It paints a picture of what was going on, what things were like, or what people were doing over a period of time.

*   **In the story:** "**Il y avait** beaucoup de monde. La musique **était** forte et tout le monde **parlait**."
*   (There **were** a lot of people. The music **was** loud and everyone **was talking**.)
*   **Use it for:**
    *   Descriptions in the past (weather, feelings, appearance).
    *   Actions that were in progress.
    *   Habits in the past ("When I was young, I **played** tennis...").

## Plus-que-parfait (PQP): The Flashback Director

**Its Job:** To talk about an action that **had already happened** *before* another past action. It's the "past of the past".

*   **In the story:** "**J'ai mangé** le gâteau que mon amie **avait préparé**."
*   (I **ate** the cake that my friend **had prepared**.)
*   **The logic:** Your friend prepared the cake *before* you ate it. Both actions are in the past, but the PQP shows which one came first.
*   **Use it for:** Providing backstory or context for a past event.

## Conditionnel: The "What If" Dreamer

**Its Job:** To talk about **hypothetical situations**. What *would have happened* if things were different. It's often paired with a "Si + Imparfait" clause. It can also report unconfirmed information.

*   **In the story (hypothetical):** "Si j'avais su, je **serais venu** plus tôt."
*   (If I had known, I **would have come** earlier.)
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
## دليل مبسط للأزمنة (للمبتدئين)

تخيل أنك تروي قصة عن حفلة ذهبت إليها. هذه القصة ستساعدنا على فهم وظيفة كل زمن.

## Passé Composé: نجم أفلام الحركة

**وظيفته:** يخبرنا **بما حدث**. هذه هي الأحداث الرئيسية، الأفعال المكتملة التي تدفع القصة إلى الأمام. فكر فيها كلقطات سريعة أو نقاط الحبكة الرئيسية.

*   **في القصة:** "Hier soir, **je suis allé** à une fête. **J'ai dansé** toute la nuit. Soudain, **il a commencé** à pleuvoir."
*   (مساء أمس، **ذهبت** إلى حفلة. **رقصت** طوال الليل. فجأة، **بدأت** تمطر.)
*   **استخدمه لـ:** أحداث محددة ومنتهية في الماضي.

## Imparfait: رسام المشاهد الطبيعية

**وظيفته:** وصف **الخلفية والمشهد**. يرسم صورة لما كان يحدث، كيف كانت الأجواء، أو ما كان يفعله الناس على مدى فترة من الزمن.

*   **في القصة:** "**Il y avait** beaucoup de monde. La musique **était** forte et tout le monde **parlait**."
*   ( **كان هناك** الكثير من الناس. الموسيقى **كانت** صاخبة والجميع **كان يتحدث**.)
*   **استخدمه لـ:**
    *   الأوصاف في الماضي (الطقس، المشاعر، المظهر).
    *   الأحداث التي كانت مستمرة.
    *   العادات في الماضي ("عندما كنت صغيراً، **كنت ألعب** التنس...").

## Plus-que-parfait (PQP): مخرج الفلاش باك

**وظيفته:** الحديث عن حدث **كان قد وقع بالفعل** *قبل* حدث ماضٍ آخر. إنه "ماضي الماضي".

*   **في القصة:** "**J'ai mangé** le gâteau que mon amie **avait préparé**."
*   ( **أكلت** الكعكة التي **كانت صديقتي قد أعدتها**.)
*   **المنطق:** صديقتك أعدت الكعكة *قبل* أن تأكلها أنت. كلا الحدثين في الماضي، لكن PQP يوضح أيهما حدث أولاً.
*   **استخدمه لـ:** تقديم خلفية أو سياق لحدث ماضٍ.

## Conditionnel: الحالم بـ "ماذا لو"

**وظيفته:** الحديث عن **مواقف افتراضية**. ما *كان سيحدث* لو كانت الأمور مختلفة. غالبًا ما يأتي مع جملة "Si + Imparfait". يمكنه أيضًا نقل معلومات غير مؤكدة.

*   **في القصة (افتراضي):** "Si j'avais su, je **serais venu** plus tôt."
*   (لو كنت أعرف، **لكنت أتيت** أبكر.)
*   **في القصة (أخبار غير مؤكدة):** "Le journal a dit que la star **arriverait** à 22h."
*   (قالت الجريدة إن النجم **سيصل** الساعة 10 مساءً.) - هذا هو المستقبل في الماضي.
*   **استخدمه لـ:** مواقف خيالية، طلبات مهذبة، نصائح، وأحداث مستقبلية من منظور الماضي.

## ملخص

*   **Passé Composé:** بوم! حدثٌ وقع.
*   **Imparfait:** هكذا كان يبدو المشهد...
*   **Plus-que-parfait:** دعني أخبرك بما حدث *قبل* ذلك...
*   **Conditionnel:** ما كان يمكن أن يحدث، أو كان يجب أن يحدث، أو كان سيحدث...
`;

export const tensesComparisonExplanation: SpecialExplanation = {
    English: englishExplanation,
    Arabic: arabicExplanation,
    // Other languages will default to English
};

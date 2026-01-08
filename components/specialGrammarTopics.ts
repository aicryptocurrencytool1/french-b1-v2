import { Language } from '../types';

type SpecialExplanation = {
    [key in Language]?: string;
}

const englishExplanation = `
## The Ultimate Guide to Past Tenses (Master Class for Ahmad)

Ahmad, let's look at my life as a movie. Every movie needs a star, a background, a flashback, and a dream. Each French tense has one of these jobs.

---

## 1. Passé Composé: The Action Movie Star 🎬
**Its Job:** This tense is for the **BAM!** moments. It's for the specific actions I finished. If I'm moving the story forward, I'm using the **Passé Composé**. It's the "main event" of my day.

*   **In my life (Liège):** "Hier matin, **je suis allé** à la **Citadelle** de **Liège**. **J'ai monté** les marches et **j'ai admiré** la vue magnifique sur la ville."
*   (Yesterday morning, **I went** to the Citadelle of Liège. **I climbed** the steps and **I admired** the magnificent view of the city.)
*   **The Logic:** These are finished actions. I went, I climbed, I admired. One after the other. It's like checking boxes on a "To-Do" list that I already finished.
*   **Ahmad's Trick:** If I can put it on a calendar or a timeline as a single point in time, it's almost always **Passé Composé**.

---

## 2. Imparfait: The Scenery Painter 🎨
**Its Job:** This is the "Once upon a time" tense. It paints the background. It describes the weather, my feelings, the atmosphere, or things I used to do habitually. It's like a video that keeps playing in the background while the "Star" (Passé Composé) does the actions.

*   **In my life (Lebanon):** "Quand **j'habitais** au **Liban**, **je mangeais** des manoushés chaque matin. Le soleil **brillait** toujours et **je me sentais** vraiment heureux dans mon village."
*   (When **I lived** in Lebanon, **I ate/used to eat** manoushés every morning. The sun **was shining** always and **I felt** truly happy in my village.)
*   **The Logic:** I didn't live in Lebanon for just one second. It was a continuous state. I didn't eat one manoushé once; it was a repeated habit. The sun was shining in the background the whole time.
*   **Ahmad's Trick:** If I'm describing a scene, a mood, or a habit ("I used to..."), I use **Imparfait**. It's the "painter" of my memories and the setting of my movie.

---

## 3. Plus-que-parfait (PQP): The Flashback Director ⏪
**Its Job:** This is the "Past of the Past." I use it when I'm already talking about the past, but I want to mention something that happened **even earlier**. It provides the history or the reason behind my actions.

*   **In my life (Preparation):** "**Je suis arrivé** en Belgique avec confiance parce qu'avant cela, **j'avais préparé** tous mes documents soigneusement au **Liban**."
*   ( **I arrived** in Belgium with confidence because before that, **I had prepared** all my documents carefully in Lebanon.)
*   **The Logic:** Arriving in Belgium is the main past event (**Passé Composé**). Preparing the documents happened *before* I arrived. So, that "background action" that was already finished is the **Plus-que-parfait**.
*   **Ahmad's Trick:** If I can say "I had already [done something]", it's **Plus-que-parfait**. It explains *why* the main action happened or gives the backstory.

---

## 4. Conditionnel: The "What If" Dreamer 💭
**Its Job:** This is for my dreams, my polite wishes, or my "what if" scenarios. It's not about what exactly happened; it's about what **would** happen. It's the most "polite" and "dreamy" part of the French language.

*   **In my life (Future Dreams):** "Si j'avais plus de temps libre, **je voyagerais** plus souvent au **Liban**. **Je serais** tellement content de revoir ma famille et mes amis."
*   (If I had more free time, **I would travel** more often to Lebanon. **I would be** so happy to see my family and my friends again.)
*   **The Logic:** I'm not traveling right now. It's a dream or a condition. "I would travel," "I would be." It's hypothetical.
*   **Ahmad's Trick:** This is the "Polite & Dreamy" tense. I use it when I say "I would like" (**Je voudrais**) or "I would do" (**Je ferais**) or when I'm imagining a better version of reality.

---

## Summary for Ahmad 🏆
*   **Passé Composé:** The main events. **I did it.** (The Star)
*   **Imparfait:** The background/habits. **I was doing it / I used to do it.** (The Painter)
*   **Plus-que-parfait:** The flashback. **I had already done it.** (The Director)
*   **Conditionnel:** The dream. **I would do it.** (The Dreamer)
`;

const arabicExplanation = `
## الدليل الشامل لأزمنة الماضي (حصرياً لأحمد)

يا أحمد، لنتخيل حياتك كأنها فيلم سينمائي. كل فيلم يحتاج إلى بطل، وخلفية، ومشهد استرجاعي (فلاش باك)، وحلم. كل زمن في اللغة الفرنسية له دور في هذا الفيلم.

---

## 1. Passé Composé: نجم أفلام الحركة 🎬
**وظيفته:** هذا الزمن مخصص للحظات الـ **بوم!**. إنه للأفعال المحددة التي انتهيت منها. إذا كنت أحرك أحداث القصة للأمام، فأنا أستخدم **Passé Composé**. إنه "الحدث الرئيسي" في يومي.

*   **في حياتي (لييج):** "Hier matin, **je suis allé** à la **Citadelle** de **Liège**. **J'ai monté** les marches et **j'ai admiré** la vue magnifique sur la ville."
*   (صباح أمس، **ذهبت** إلى قلعة لييج. **صعدت** السلالم و**أعجبت** بالإطلالة الرائعة على المدينة.)
*   **المنطق:** هذه أفعال منتهية. ذهبت، صعدت، أعجبت. واحدة تلو الأخرى. كأنني أضع علامة "صح" على قائمة مهام انتهيت منها بالفعل.
*   **سر أحمد:** إذا كان بإمكاني وضع الفعل على تقويم أو خط زمني كنقطة واحدة محددة، فهو دائماً تقريباً **Passé Composé**.

---

## 2. Imparfait: رسام المشاهد الطبيعية 🎨
**وظيفته:** هذا هو زمن "كان يا ما كان". إنه يرسم الخلفية. يصف الطقس، مشاعري، الأجواء، أو الأشياء التي كنت معتاداً على فعلها بشكل متكرر. إنه مثل فيديو يستمر في العمل في الخلفية بينما يقوم "البطل" (Passé Composé) بالأفعال.

*   **في حياتي (لبنان):** "Quand **j'habitais** au **Libان**, **je mangeais** des manoushés chaque matin. Le soleil **brillait** toujours et **je me sentais** vraiment heureux dans mon village."
*   (عندما **كنت أسكن** في لبنان، **كنت آكل** المناقيش كل صباح. الشمس **كانت تشرق** دائماً و**كنت أشعر** بالسعادة حقاً في قريتي.)
*   **المنطق:** لم أسكن في لبنان لثانية واحدة فقط، بل كانت حالة مستمرة. لم آكل منقوشة واحدة مرة واحدة فقط، بل كانت عادة متكررة. الشمس كانت تشرق في الخلفية طوال الوقت.
*   **سر أحمد:** إذا كنت أصف مشهداً، أو حالة نفسية، أو عادة ("كنت أفعل...")، أستخدم **Imparfait**. إنه "الرسام" لذكرياتي ومسرح أحداث الفيلم.

---

## 3. Plus-que-parfait (PQP): مخرج "الفلاش باك" ⏪
**وظيفته:** هذا هو "ماضي الماضي". أستخدمه عندما أكون أتحدث بالفعل عن الماضي، ولكن أريد أن أذكر شيئاً حدث **قبل ذلك بمدة أطول**. إنه يقدم التاريخ أو السبب وراء أفعالي الحالية.

*   **في حياتي (التحضير):** "**Je suis arrivé** en Belgique avec confiance parce qu'avant cela, **j'avais préparé** tous mes documents soigneusement au **Liban**."
*   ( **وصلت** إلى بلجيكا بثقة لأنني قبل ذلك، **كنت قد حضرت** جميع مستنداتي بعناية في لبنان.)
*   **المنطق:** الوصول إلى بلجيكا هو الحدث الماضي الرئيسي (**Passé Composé**). تحضير الأوراق حدث *قبل* وصلي. لذا، ذلك "الفعل الخلفي" الذي كان قد انتهى بالفعل هو الـ **Plus-que-parfait**.
*   **سر أحمد:** إذا كان بإمكاني قول "كنت قد [فعلت شيئاً] بالفعل"، فهو **Plus-que-parfait**. إنه يشرح *لماذا* حدث الفعل الرئيسي أو يعطي القصة الخلفية.

---

## 4. Conditionnel: الحالم بـ "ماذا لو" 💭
**وظيفته:** هذا للأحلام، والأمنيات المهذبة، أو سيناريوهات "ماذا لو". الأمر لا يتعلق بواقع حدث بالفعل، بل بما **كان سيحدث**. إنه الجزء الأكثر "تهذيباً" و"خيالية" في اللغة الفرنسية.

*   **في حياتي (أحلام المستقبل):** "Si j'avais plus de temps libre, **je voyagerais** plus souvent au **Liban**. **Je serais** tellement content de revoir ma famille et mes amis."
*   (لو كان لدي المزيد من وقت الفراغ، **لكنت سافرت** أكثر إلى لبنان. **لكنت** سعيداً جداً برؤية عائلتي وأصدقائي مرة أخرى.)
*   **المنطق:** أنا لا أسافر حالياً. إنه حلم أو حالة مشروطة. "كنت سأسافر"، "كنت سأكون". إنه أمر افتراضي.
*   **سر أحمد:** هذا هو زمن "الأدب والأحلام". أستخدمه عندما أقول "أود" (**Je voudrais**) أو "كنت سأفعل" (**Je ferais**) أو عندما أتخيل نسخة أفضل من الواقع.

---

## ملخص لأحمد 🏆
*   **Passé Composé:** الأحداث الرئيسية. **فعلت ذلك.** (البطل)
*   **Imparfait:** الخلفية/العادات. **كنت أفعل ذلك.** (الرسام)
*   **Plus-que-parfait:** الفلاش باك. **كنت قد فعلت ذلك بالفعل.** (المخرج)
*   **Conditionnel:** الحلم. **كنت سأفعل ذلك.** (الحالم)
`;

export const tensesComparisonExplanation: SpecialExplanation = {
    English: englishExplanation,
    Arabic: arabicExplanation,
    // Other languages will default to English
};

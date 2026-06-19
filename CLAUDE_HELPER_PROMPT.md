# 🤖 برومبت لـ Claude (انسخه والصقه في أول محادثة مع Claude)

> **التعليمات:** افتح Claude.ai (أو تطبيق Claude)، وانسخ البرومبت ده والصقه عشان Claude يفهم البرنامج ويساعدك خطوة بخطوة.

---

```
أنا حاصل على برنامج اسمه "Amazon Pricing" من صديق ليا. ده برنامج لإدارة أسعار منتجات Amazon UAE → Amazon Egypt.

البرنامج جاي في ملف zip فيه:
- مجلد src/ (الكود الرئيسي - React)
- مجلد api/ (Vercel functions)
- ملف database_setup.sql (لإعداد قاعدة البيانات Supabase)
- ملف SETUP_GUIDE_AR.md (دليل تنصيب شامل بالعربي)
- ملف .env (للـ environment variables)
- ملف vercel.json (إعدادات Vercel + cron jobs)
- ملف package.json (dependencies: React, Vite, Supabase SDK, xlsx, recharts)

ملاحظات مهمة عني:
1. أنا شغال على Windows
2. مش عندي خبرة برمجية - معملش حاجة من اللي البرنامج محتاجها قبل كده
3. هحتاج مساعدتك خطوة بخطوة من الصفر
4. ممكن أبعتلك screenshots لرسائل الأخطاء لو حصل أي مشكلة

المطلوب منك:
1. مشّيني خطوة بخطوة من ملف SETUP_GUIDE_AR.md
2. ابدأ بـ المرحلة 1 (تثبيت Node.js + Git على Windows)
3. لا تخطّى أي خطوة، حتى لو شكلها سهلة
4. لو فيه حاجة في الدليل غامضة، اشرحها بطريقة أبسط
5. بعد كل مرحلة، استنى مني تأكيد قبل ما ندخل في اللي بعدها

البرنامج بيحتاج 6 حسابات على المواقع دي (كلها مجانية للبداية):
- Supabase (قاعدة بيانات)
- Apify (سكراب)
- GitHub (الكود)
- Vercel (هوست الموقع)
- Telegram (بوت إشعارات)
- OpenAI (اختياري - لتقدير الشحن)

ابدأ بسؤالي: هل في عندي Node.js و Git مثبتين؟ ولو لأ، مشّيني خطوة بخطوة لتثبيتهم.
```

---

## نصايح لما تكون بتتكلم مع Claude:

1. **اقرأ ملف SETUP_GUIDE_AR.md** الأول لوحدك بسرعة (مش هتفهم كل حاجة بس عشان تاخد فكرة)
2. **ابعتلي Claude ملف SETUP_GUIDE_AR.md نفسه** (Upload File في المحادثة)
3. لو حصل أي خطأ، **انسخ النص كاملاً** وابعته لـ Claude
4. **مفيش سؤال غبي** - اسأل أي حاجة مش فاهمها
5. لما تيجي خطوة فيها كتابة أوامر في Command Prompt، **انسخ بالظبط** اللي Claude بيقولهولك

## القيم اللي محتاج تجمعها وتديها لـ Claude لما يحتاجها:

| القيمة | من أين تأتي |
|--------|-------------|
| Supabase URL | Supabase Dashboard → Settings → API |
| Supabase Anon Key | Supabase Dashboard → Settings → API |
| Apify Token | Apify Console → Settings → API Tokens |
| Telegram Bot Token | من BotFather على Telegram |
| Telegram Chat ID | من رابط `getUpdates` للبوت |
| GitHub Token | GitHub → Settings → Developer Settings → PAT |
| Amazon Seller Name | Amazon Seller Central → Settings → Account Info |
| Amazon Seller ID | Amazon Seller Central → Settings → Account Info |

**كل القيم دي سرية - متشاركهاش مع حد غير Claude.**

بالتوفيق! 🚀

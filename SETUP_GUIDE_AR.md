# 🚀 دليل تنصيب برنامج Amazon Pricing على Windows

> هذا الدليل مكتوب بطريقة بسيطة جداً لشخص **ليس عنده أي خبرة برمجية**.
>
> **مهم:** اطلب من Claude يقرأ هذا الملف ويمشي معاك خطوة بخطوة. اسأله أي حاجة مش فاهمها.

---

## ما هو هذا البرنامج؟

برنامج لإدارة التسعير والمنافسة لمنتجات Amazon UAE → Amazon Egypt.

**يحتاج 6 حسابات على مواقع مختلفة:**

| الحساب | الغرض | مدفوع؟ |
|--------|-------|---------|
| **Supabase** | قاعدة بيانات لتخزين المنتجات | مجاني ✅ |
| **Apify** | لسحب بيانات المنتجات من Amazon | مجاني للاستخدام البسيط، بعدها بسيط ($5-20/شهر) |
| **GitHub** | لتخزين الكود | مجاني ✅ |
| **Vercel** | لتشغيل الموقع على الإنترنت | مجاني للبداية، الـ Cron Jobs بتحتاج Pro ($20/شهر) |
| **Telegram Bot** | لإرسال إشعارات | مجاني ✅ |
| **OpenAI** (اختياري) | لتقدير الشحن بالـ AI | $5 شحن أولي يكفي شهور |

---

## ✅ المرحلة 1: تثبيت البرامج اللازمة على Windows

### 1.1 - تثبيت Node.js
1. روح على: https://nodejs.org/
2. اضغط على الزرار الكبير الأخضر "**LTS**" (النسخة الموصى بها)
3. هيتنزل ملف `.msi`
4. افتحه واضغط Next → Next → Install
5. **مهم:** اقفل أي نافذة Command Prompt مفتوحة وافتحها من جديد بعد التثبيت

**للتأكد من التثبيت:**
- افتح Command Prompt (اضغط زرار Windows + اكتب `cmd` ثم Enter)
- اكتب: `node -v`
- لازم تظهر رسالة زي: `v20.10.0`

### 1.2 - تثبيت Git
1. روح على: https://git-scm.com/download/win
2. هيتنزل ملف
3. افتحه واضغط Next على كل الخطوات (الإعدادات الافتراضية كويسة)

**للتأكد:** افتح Command Prompt واكتب `git --version`

### 1.3 - تثبيت محرر نصوص (اختياري بس مفيد)
- روح على: https://code.visualstudio.com/
- نزّل VS Code (مجاني)

---

## ✅ المرحلة 2: إنشاء حساب Supabase (قاعدة البيانات)

### 2.1 - إنشاء الحساب
1. روح على: https://supabase.com/
2. اضغط "**Start your project**"
3. سجّل دخول بـ GitHub أو ايميل

### 2.2 - إنشاء مشروع جديد
1. اضغط "**New Project**"
2. املأ البيانات:
   - **Name:** `amazon-pricing` (أي اسم)
   - **Database Password:** اكتب باسورد قوي **واحتفظ بيه**
   - **Region:** اختار `Central EU (Frankfurt)` أو `Middle East (Bahrain)` (الأقرب لمصر)
   - **Plan:** Free
3. اضغط "**Create new project**"
4. استنى 1-2 دقيقة لما يخلص

### 2.3 - تشغيل SQL Setup
1. من القائمة على اليسار، اضغط على **SQL Editor** (أيقونة شبه ورقة)
2. اضغط "**+ New query**"
3. افتح ملف `database_setup.sql` (موجود في الفولدر بتاع البرنامج)
4. انسخ **كل محتواه** والصقه في الـ SQL Editor
5. اضغط زرار "**Run**" (أو Ctrl+Enter)
6. لازم تظهر رسالة "Success" في الأسفل

### 2.4 - استخراج الـ Credentials
1. من القائمة على اليسار، اضغط على **Settings** ⚙️
2. اضغط على **API**
3. **انسخ القيمتين دول واحتفظ بيهم:**
   - **Project URL** (شكلها: `https://xxxxx.supabase.co`)
   - **anon public key** (نص طويل بيبدأ بـ `eyJ...`)

---

## ✅ المرحلة 3: إنشاء حساب Apify (للسكراب)

### 3.1 - التسجيل
1. روح على: https://console.apify.com/sign-up
2. سجّل بـ Google أو ايميل

### 3.2 - الحصول على الـ API Token
1. من القائمة على اليسار: اضغط **Settings** → **API & Integrations**
2. هتلاقي **Personal API tokens**
3. انسخ الـ token (شكله: `apify_api_xxxxx`)
4. **احتفظ بيه**

### 3.3 - تجربة الـ Actors اللي البرنامج بيستخدمها
البرنامج بيستخدم 2 actors من نفس الـ developer:
- `saswave/amazon-product-scraper`
- `saswave/amazon-seller-monitoring`

**للتأكد إنك تقدر تستخدمهم:**
1. روح على: https://apify.com/saswave/amazon-product-scraper
2. اضغط "**Try for free**"
3. لو طلب منك تفعّل الحساب أو تضيف payment method، اعمل ده (مش هيخصم منك حاجة لحد ما تستخدم فعلاً)

> **ملحوظة:** Apify بيدّيك $5 رصيد شهرياً مجاناً، يكفي لاختبار البرنامج. لو بتحدث 800 منتج يومياً، هتحتاج plan مدفوع ($20+/شهر).

---

## ✅ المرحلة 4: إنشاء Telegram Bot

### 4.1 - إنشاء البوت
1. افتح تطبيق Telegram على موبايلك
2. ابحث عن: `@BotFather` (اللي عنده علامة ✓ زرقاء)
3. اضغط Start
4. ابعتله: `/newbot`
5. هيسألك على اسم البوت — اكتب أي اسم (مثلاً: `Amazon Pricing Bot`)
6. هيسألك على username — لازم تنتهي بـ `bot` (مثلاً: `my_amazon_pricing_bot`)
7. هيدّيك **Token** (نص طويل) — **احتفظ بيه**

### 4.2 - الحصول على Chat ID
1. ابحث على Telegram عن البوت اللي عملته (بالـ username)
2. اضغط Start
3. ابعتله أي رسالة (مثلاً "hi")
4. افتح المتصفح وروح على هذا الرابط (استبدل `YOUR_BOT_TOKEN`):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
   مثال:
   ```
   https://api.telegram.org/bot8817952278:AAH....xx/getUpdates
   ```
5. هتلاقي JSON فيه `"chat":{"id":123456789,...}` 
6. الرقم اللي بعد `"id":` ده هو الـ **Chat ID** — احتفظ بيه

---

## ✅ المرحلة 5: إنشاء حساب GitHub

1. روح على: https://github.com/signup
2. سجّل حساب جديد بإيميل وباسورد
3. أكّد الإيميل

### 5.1 - الحصول على Personal Access Token
1. اضغط على صورتك في الأعلى لليمين → **Settings**
2. لف لأسفل القائمة على الشمال → **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token** → **Generate new token (classic)**
5. املأ:
   - **Note:** `amazon-pricing-deploy`
   - **Expiration:** No expiration (أو سنة)
   - **Scopes:** علّم على `repo` (كل الـ checkboxes تحته)
6. اضغط **Generate token** في الأسفل
7. **مهم جداً:** انسخ الـ token دلوقتي (`ghp_xxxxx`) — هيختفي بعد ما تقفل الصفحة

### 5.2 - إنشاء Repository
1. اضغط على علامة `+` فوق على اليمين → **New repository**
2. **Repository name:** `amazon-pricing`
3. **Public** (مهم عشان Vercel Free Plan)
4. اضغط **Create repository**
5. **احتفظ باسم المستخدم بتاعك** (مثلاً: `your-username`)

---

## ✅ المرحلة 6: إنشاء حساب Vercel

1. روح على: https://vercel.com/signup
2. اضغط **Continue with GitHub**
3. وافق على الصلاحيات
4. اختار **Hobby** plan (مجاني)

---

## ✅ المرحلة 7: إعداد البرنامج على جهازك

### 7.1 - فك ضغط الملف
1. الملف اللي وصلك اسمه: `amazon-pricing-tool.zip`
2. اعمله Extract في فولدر `Downloads` (يعني `C:\Users\YourName\Downloads\amazon-pricing`)

### 7.2 - فتح Command Prompt في الفولدر
1. افتح فولدر `amazon-pricing`
2. في الـ Address Bar (الشريط فوق اللي بيظهر مكان الفولدر)، اكتب `cmd` واضغط Enter
3. هتتفتح نافذة سوداء (Command Prompt) في نفس الفولدر

### 7.3 - تثبيت الحزم
في الـ Command Prompt، اكتب:
```
npm install
```
استنى 1-2 دقيقة لما يخلص.

### 7.4 - ملف الـ .env (إضافة كل التوكنز)
1. افتح فولدر البرنامج
2. لو في ملف اسمه `.env`، افتحه بـ Notepad أو VS Code
3. لو مش موجود، اعمل ملف جديد اسمه `.env` (لازم يكون النقطة في الأول)
4. الصق هذا المحتوى، ثم استبدل كل قيمة بالقيم اللي جمعتها فوق:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxx....
VITE_APIFY_TOKEN=apify_api_xxxxx
VITE_TELEGRAM_TOKEN=8817xxxxx:AAH....
VITE_TELEGRAM_CHAT_ID=1120288834
VITE_SELLER_NAME=YourSellerNameHere
VITE_SELLER_ID=A2XXXXXXXXXXXX
OPENAI_API_KEY=
```

> **مهم:** اسم البائع و seller_id بتاعك هتلاقيهم في Amazon Seller Central:
> روح على: https://sellercentral.amazon.eg/ → Settings → Account Info → Your Merchant Token

---

## ✅ المرحلة 8: رفع البرنامج على GitHub و Vercel

### 8.1 - تجهيز Git في الفولدر
في الـ Command Prompt في فولدر البرنامج، اكتب الأوامر دي **واحد ورا التاني**:

```
git init
git add .
git commit -m "first deploy"
```

ثم (استبدل `YOUR_USERNAME` و `YOUR_TOKEN` بالقيم بتاعتك):
```
git remote add origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/amazon-pricing.git
git push origin HEAD:main --force
```

**مثال:**
```
git remote add origin https://ahmed:ghp_2jTcYta....@github.com/ahmed/amazon-pricing.git
```

### 8.2 - رفع على Vercel
في Command Prompt اكتب:
```
npx vercel --prod
```

هيسألك:
- **Set up and deploy?** → اكتب `y` ثم Enter
- **Which scope?** → اختار حسابك
- **Link to existing project?** → اكتب `n`
- **Project name?** → اضغط Enter (هيستخدم اسم الفولدر)
- **In which directory?** → اضغط Enter
- **Want to modify settings?** → اكتب `n`

استنى 1-2 دقيقة. هيدّيك رابط الموقع.

### 8.3 - إضافة الـ Environment Variables على Vercel
1. روح على https://vercel.com/dashboard
2. اضغط على المشروع `amazon-pricing`
3. **Settings** → **Environment Variables**
4. ضيف كل القيم اللي في ملف `.env` بتاعك واحدة واحدة:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | https://xxxxx.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | eyJxxxxx... |
| `VITE_APIFY_TOKEN` | apify_api_xxxxx |
| `VITE_TELEGRAM_TOKEN` | xxxxx |
| `VITE_TELEGRAM_CHAT_ID` | xxxxx |
| `VITE_SELLER_NAME` | YourSellerName |
| `VITE_SELLER_ID` | A2XXXXXX |
| `APIFY_TOKEN` | apify_api_xxxxx (نفس الـ VITE_APIFY_TOKEN) |
| `TELEGRAM_TOKEN` | (نفس الـ VITE_TELEGRAM_TOKEN) |
| `TELEGRAM_CHAT_ID` | (نفس الـ VITE_TELEGRAM_CHAT_ID) |
| `SELLER_NAME` | (نفس الـ VITE_SELLER_NAME) |
| `SELLER_ID` | (نفس الـ VITE_SELLER_ID) |
| `APP_URL` | https://amazon-pricing-xxx.vercel.app (لينك موقعك) |
| `WEBHOOK_SECRET` | اكتب أي كلمة سرية (مثلاً: `my-secret-2026`) |

> **ملاحظة:** الـ Vite variables (`VITE_xxx`) للـ frontend. الـ Vercel functions (api/) محتاجة نفس القيم بدون `VITE_`. عشان كده بنضيف الاتنين.

### 8.4 - إعادة الـ Deploy
بعد ما تضيف الـ env vars:
1. روح على **Deployments**
2. اضغط على آخر deploy
3. اضغط على ⋯ → **Redeploy**

### 8.5 - فتح الموقع
1. روح على رابط الموقع (من Vercel Dashboard)
2. هيطلبلك password
3. الباسورد: `135`
4. هتدخل البرنامج!

---

## ✅ المرحلة 9: استخدام البرنامج

### 9.1 - السكراب الأول
1. اضغط على شريط البحث فوق
2. الصق رابط منتجات من Amazon UAE، مثلاً:
   ```
   https://www.amazon.ae/s?k=hair+dryer
   ```
3. اضغط **▶ سكراب**
4. استنى 5-10 دقايق لحد ما يخلص

### 9.2 - تحديث الأسعار يومياً
- **يدوي:** اضغط على "↻ تحديث AE" في الـ Header
- **تلقائي:** الـ Cron Jobs بتشتغل لوحدها (يحتاج Vercel Pro)

---

## ❓ مشاكل شائعة

### "npm" or "git" مش معروف
- اعمل Restart للـ Command Prompt بعد تثبيت Node.js / Git

### Vercel cron jobs مش بتشتغل
- محتاج Vercel **Pro plan** ($20/month) عشان كرونز يومية

### Supabase row level security
- لو شفت رسالة خطأ "row-level security policy"، شغل في SQL Editor:
  ```sql
  ALTER TABLE اسم_الجدول DISABLE ROW LEVEL SECURITY;
  ```

### Apify "limit exceeded"
- وصلت لحد الـ $5 المجاني — اضف payment method في Apify

---

## 📞 للمساعدة

لو علقت في أي خطوة، **انسخ رسالة الخطأ كاملة** وقولها لـ Claude. Claude مدرّب على البرنامج ده وهيساعدك خطوة بخطوة.

أتمنالك التوفيق! 🚀

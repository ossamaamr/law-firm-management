# MERSAD — سجل أدلة التدقيق الجنائي

## حالة baseline

تاريخ التدقيق: 19 أغسطس 2026. المستودع المحلي على الفرع `main`، وكان working tree نظيفًا عند بدء التدقيق. آخر commit محلي/remote قبل التعديلات هو `08587efd finance: link invoice obligations to ledger`.

بوابات baseline الحالية: `pnpm check` ناجح، `pnpm test` ناجح بنتيجة 138 اختبارًا ناجحًا و30 متخطيًا بسبب غياب `DATABASE_URL`، و`pnpm build` ناجح. `pnpm drizzle-kit check` لا يستطيع إجراء تحقق قاعدة البيانات لأن `DATABASE_URL` غير متاح؛ هذه ليست نتيجة سلامة migration.

فحص dependency audit أعاد 45 advisory: 6 High و31 Moderate و8 Low. من النتائج العالية الظاهرة Rollup path traversal/Arbitrary File Write، path-to-regexp Regular Expression Denial of Service، lodash code injection، form-data CRLF injection، وnanoid negative-size loop. بعض المسارات dev/build أو test، لكن لم يتم قبولها كغير مهمة قبل تصنيف dependency tree النهائي.

## Findings أمنية مثبتة من الكود

### F-001 — CSRF على جميع mutations المعتمدة على Cookie — Critical/Launch blocker

`server/_core/index.ts` يركّب tRPC وmultipart document/branding routes دون middleware للتحقق من Origin/Referer أو CSRF token أو rate limit. `server/_core/cookies.ts` يضبط session cookie على `sameSite: "none"`، ما يسمح بإرسالها cross-site. توجد mutations حساسة مثل إنشاء/تعديل/حذف القضايا والعملاء والمستندات، وتغيير Branding، وتحديث الأدوار. لا يوجد تعويض request-origin/CSRF ظاهر في runtime.

### F-002 — OAuth callback لا يثبت state/nonce server-side — High

`server/_core/oauth.ts` يتحقق فقط من وجود `code` و`state` ثم يمرر `state` إلى exchange. لا يوجد state store مرتبط بجلسة بدء تسجيل الدخول، ولا nonce، ولا تحقق request-bound. يجب إثبات أن مزود OAuth يضمن state داخليًا أو إضافة تحقق محلي قبل اعتبار login production-safe.

### F-003 — تسريب بيانات جلسة المستخدم إلى localStorage — High

`client/src/_core/hooks/useAuth.ts` يكتب `meQuery.data` كاملًا إلى `localStorage` تحت `manus-runtime-user-info` في كل حساب. حتى دون token، تخزين بيانات المستخدم/المكتب في browser storage غير مناسب لمنصة ملفات قانونية حساسة، ولا يُمسح في logout. هذا يناقض cookie-only hardening.

### F-004 — تفويض واسع على عمليات موارد حساسة — High

`cases.update/delete` و`clients.create/update/delete/conflictCheck/kycCheck` و`documents.delete/getDownloadUrl` تستخدم `lawFirmProcedure` فقط، أي إن أي مستخدم معين للمكتب يستطيع تنفيذها ما لم توجد طبقة أخرى غير ظاهرة. لا يوجد role/policy تفصل lawyer/accountant/user عن العمليات الحساسة. هذا يحقق tenant isolation لكنه لا يحقق least privilege.

### F-005 — Activity export وقراءة Activity مفتوحة لكل مستخدم في المكتب — High/Confidentiality

`server/activity.routes.ts` يحمي كل المسارات بـ`protectedProcedure` فقط، لا admin/manager. `exportCSV` يستطيع أي مستخدم في المكتب طلب سجل نشاط حتى 10000 سجل، وقد يحتوي `changes` على before/after وIP وأسماء مستندات. `getStats` يجلب كل سجلات المكتب إلى الذاكرة. هذا تسريب داخلي محتمل ومخاطر أداء.

### F-006 — IP audit قابل للتزوير

مسارات عديدة تسجل `x-forwarded-for` القادم من العميل مباشرة في audit. دون trust-proxy مضبوط وnormalization server-side، يستطيع العميل تزوير عنوان IP، ما يضعف قيمة الأدلة الجنائية.

### F-007 — CSV injection/escaping غير آمن

`exportActivitiesAsCSV` يضع الحقول بين علامات اقتباس فقط ولا يهرب علامات الاقتباس أو CR/LF، ولا يمنع قيمًا تبدأ بـ`=`, `+`, `-`, `@`. تصدير `entityName`, `changes`, وIP إلى Excel قد يؤدي إلى formula injection أو CSV corruption.

### F-008 — بيانات فارغة عند فشل قاعدة البيانات في طبقة DB

عدد من دوال db يعيد `[]` أو `undefined` عند غياب DB، مثل list queries. هذا يخلط بين no data وdatabase outage وقد يجعل UI تعرض مكتبًا فارغًا بدل خطأ. بعض المسارات ترمي، وبعضها لا، ما يخلق semantics متناقضة.

### F-009 — Missing DB verification

`pnpm drizzle-kit check` يحتاج `DATABASE_URL` ولم يتم تشغيله على MySQL/MariaDB، كما أن اختبارات DB المتخطية عددها 30. لا يوجد دليل حالي على تطبيق migrations 0011/0012/0013 أو نجاح FK/orphan preflight على قاعدة حقيقية.

### F-010 — Audit log failure لا يوقف العملية ولا يوجد durable outbox

`logActivity` يسجل الخطأ ثم لا يرميه. عمليات حساسة قد تنجح دون audit durable، وهو غير مقبول كدليل محاسبي/قانوني دون outbox أو transaction coupling.

### F-011 — Activity getByEntity غير دقيق

المسار يجلب آخر 100 سجل للمكتب ثم يرشح entityId في الذاكرة، ولا يمرر entityId إلى query. قد يعيد نتائج ناقصة ويتعامل مع بيانات audit بصورة غير موثوقة.

## Findings تقنية/تشغيلية إضافية

### F-012 — External integrations غير مكتملة

Email وDocument conversion/OCR وStorage legacy services تحتوي returns false/null أو logs فقط. Payment مغلق fail-closed، وهذا أفضل من fake success، لكنه يعني أن الدفع وOCR/PDF والبريد ليست ميزات إنتاجية.

### F-013 — Calendar worker غير مربوط بجدولة إنتاجية

`deadline.service.ts` وclaim/idempotency موجودان، لكن لا يوجد binding موثق إلى scheduler/worker production. تذكير الجلسات قد لا يعمل تلقائيًا.

### F-014 — Client Portal وMFA وPassword Reset غير منفذة

هي متطلبات تشغيلية/أمنية ظاهرة في الدستور وليست موجودة في code path الحالي.

### F-015 — dependency advisories غير مغلقة

`pnpm audit --audit-level=high` فشل: 45 advisory (6 High). لا يجوز إعلان production-ready حتى تصنيفها وإزالة runtime findings أو قبولها رسميًا مع mitigation.

### F-016 — Runtime hardening ناقص

Bootstrap لا يظهر CORS policy صريحة، security headers، rate limiting، body-parser route-specific limits، أو request origin policy. `express.json` وurlencoded global limit 50mb يزيد سطح DoS على كل API.

### F-017 — OAuth/session lifecycle يحتاج إثباتًا إضافيًا

JWT صالح سنة كاملة، ولا توجد session rotation واضحة. revocation موجودة للجلسات ذات jti، لكن لا يوجد session inventory أو device binding أو idle timeout أو rate limit ظاهر.

## قرار أولي

المنصة **ليست جاهزة للإطلاق لبيانات محاماة حقيقية**. وجود check/test/build ناجح محليًا لا يعالج CSRF، OAuth state، least privilege، audit durability، قاعدة البيانات غير المشغلة، أو dependency High advisories.

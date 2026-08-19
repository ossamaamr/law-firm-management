# MERSAD — التقرير الجنائي النهائي لتدقيق الإصدار

**تاريخ التدقيق:** 19 أغسطس 2026

**نطاق التدقيق:** مستودع `law-firm-management` كاملًا، بما في ذلك `client/` و`server/` و`drizzle/` وملفات configuration وmigrations والاختبارات والاعتماديات والوثائق ومسارات التشغيل.

**القرار التنفيذي:** **NOT READY — ممنوع إطلاق المنصة على بيانات محاماة حقيقية قبل إغلاق Findings الأمن P1/High وإثبات قاعدة البيانات الفعلية.** نجاح TypeScript والاختبارات والبناء لا يساوي جاهزية أمنية أو تشغيلية.

> لا يمكن إعلان منصة قانونية “خالية بالكامل من الثغرات” من تدقيق مستودع فقط؛ القرار المهني الصحيح يحتاج أيضًا اختبار اختراق خارجي، مراجعة بنية الاستضافة، فحص إعدادات قاعدة البيانات، ومراجعة مزودي OAuth/storage/monitoring. هذا التقرير يثبت مشكلات من الكود نفسه ولا يعتمد على افتراض أن البيئة الخارجية ستعالجها.

## 1. الخلاصة التنفيذية

المستودع في حالة تطوير متقدمة، وفيه نقاط قوية حقيقية: جلسة Cookie موقعة مع `jti` revocation، عزل Tenant في عدد من المسارات، scanner boundary fail-closed، signed URLs، ledger append-only، approval transaction، فهارس وFK جزئية، واختبارات server-side جيدة نسبيًا. ومع ذلك توجد فجوات تمنع الإطلاق: لا توجد حماية CSRF/Origin على cookie-authenticated multipart mutations، callback OAuth لا يثبت state/nonce محليًا، صلاحيات العمليات الحساسة أوسع من مبدأ least privilege، Activity export مكشوف لكل عضو مكتب، قاعدة البيانات الحقيقية لم تُشغّل عليها migrations أو orphan preflight، سجلات التدقيق غير ذرية ويمكن فقدها، وdependency audit يظل يفشل بستة High advisories.

النتيجة ليست أن Tenant isolation غير موجود؛ بل إن **عزل المكتب موجود في طبقات عديدة لكنه ليس بديلًا عن CSRF أو role authorization أو integrity constraints الكاملة**. لذلك فإن وجود `lawFirmId` في الاستعلامات لا يكفي لحماية بيانات المحاماة.

## 2. بوابات الجودة والأدلة القابلة لإعادة التشغيل

| الفحص | النتيجة | التفسير |
|---|---:|---|
| `pnpm check` | ناجح | لا يثبت أمن runtime أو صحة قاعدة البيانات |
| `pnpm test` | 138 ناجحًا، 30 متخطيًا | الاختبارات المتخطية مرتبطة بغياب `DATABASE_URL`؛ لا تثبت تكامل MySQL |
| `pnpm build` | ناجح | لا يثبت حماية endpoints أو الإعدادات الإنتاجية |
| `git diff --check` | ناجح | فحص تنسيق whitespace فقط |
| `pnpm audit --audit-level=high` | فاشل | 45 advisory:‏ 6 High و31 Moderate و8 Low |
| `pnpm drizzle-kit check` | غير مكتمل | يتطلب `DATABASE_URL`؛ لم يُنفذ فحص قاعدة حقيقي |
| GitHub synchronization | ناجح سابقًا | `origin/main` كان مطابقًا لـHEAD قبل بدء هذا التقرير؛ لا يعني release deployment |

## 3. Findings الأمنية الحرجة والعالية

### F-001 — غياب CSRF/Origin protection على Cookie-authenticated mutations

**الخطورة:** Critical بالنسبة لمسارات upload/branding، وHigh على مستوى request hardening العام.

**الدليل:** `server/_core/index.ts` يركب `/api/documents` و`/api/branding` و`/api/trpc` دون CSRF middleware أو Origin/Referer validation. `server/_core/cookies.ts` يضبط `sameSite: "none"`. `client/src/main.tsx` يرسل `credentials: "include"` لكل طلب tRPC، و`server/branding-upload.routes.ts` و`server/document-upload.routes.ts` يقبلان POST بملف اعتمادًا على Cookie فقط.

**الأثر:** يمكن لموقع خارجي محاولة إرسال multipart POST مع Cookie الضحية إلى مسارات حساسة. لا توجد حماية صريحة تمنع ذلك. الأثر الأكبر هو تغيير Branding ورفع مستندات أو استهلاك storage؛ ويجب اختبار ذلك بمتصفح حقيقي خلف proxy، لا افتراض أن CORS يعالج CSRF.

**الإصلاح الإلزامي:** إضافة Origin allow-list موثوقة وCSRF token مرتبط بالجلسة لكل state-changing request، أو اعتماد سياسة Cookie مناسبة مع دفاعات إضافية؛ تغطية tRPC وmultipart معًا؛ إضافة tests تمنع missing/foreign Origin وtoken.

### F-002 — OAuth callback لا يثبت state/nonce server-side

**الخطورة:** High.

**الدليل:** `server/_core/oauth.ts:13-47` يقرأ `code` و`state` من query string ويتحقق من وجودهما فقط، ثم يمرر `state` إلى `exchangeCodeForToken`. لا يوجد state store أو nonce مرتبط بطلب بدء login أو تحقق request-bound في الملف.

**الأثر:** ضعف مقاومة login CSRF/code injection أو ربط callback بطلب OAuth لم يبدأه المستخدم. قد يخفف المزود الخارجي الخطر إذا كان يفرض state داخليًا، لكن لا يوجد إثبات محلي في المستودع.

**الإصلاح الإلزامي:** إنشاء state عشوائي قصير العمر مرتبط بجلسة/Nonce، التحقق منه قبل exchange، تثبيت redirect URI server-side وعدم قبول redirect URI مفكوك من state دون allow-list.

### F-003 — تخزين بيانات هوية المستخدم في localStorage

**الخطورة:** High بالنسبة لمنصة ملفات قانونية حساسة.

**الدليل:** `client/src/_core/hooks/useAuth.ts:44-48` يكتب `meQuery.data` كاملًا إلى `localStorage` في كل حساب، ولا يمسحه logout.

**الأثر:** بيانات هوية المكتب والمستخدم تبقى في browser storage وتصبح قابلة للقراءة من أي XSS مستقبلي أو extension أو كود طرف ثالث. هذا يناقض ادعاء cookie-only hardening، حتى لو لم يتم تخزين JWT.

**الإصلاح الإلزامي:** إزالة الكتابة بالكامل، وعدم تخزين أي session/user object في localStorage؛ مراجعة كل browser storage مع سياسة تصنيف بيانات.

### F-004 — صلاحيات العمليات الحساسة أوسع من least privilege

**الخطورة:** High.

**الدليل:** `cases.update/delete` و`clients.create/update/delete/conflictCheck/kycCheck` و`documents.delete/getDownloadUrl` تستخدم `lawFirmProcedure` فقط. هذه الطبقة تثبت تسجيل المستخدم وتعيينه للمكتب، ولا تثبت role-specific authorization. `server/_core/trpc.ts:28-48` لا يحتوي إلا `protectedProcedure` و`adminProcedure` العام.

**الأثر:** أي مستخدم داخل المكتب قد يستطيع تعديل أو حذف بيانات عميل، تغيير KYC/conflict state، تنزيل مستندات أو حذفها، أو تغيير حالة قضية، حسب endpoint. هذا ليس cross-tenant IDOR لكنه **internal privilege escalation** ومخالفة لمبدأ need-to-know.

**الإصلاح الإلزامي:** مصفوفة صلاحيات server-side لكل فعل، مثل lawyer/manager/admin للملفات والقضايا، accountant للفوترة فقط، ومنع `user` من تنزيل/حذف مستندات أو تغيير KYC. يجب اختبار كل role على كل mutation.

### F-005 — Activity export والقراءة مكشوفان لكل عضو المكتب

**الخطورة:** High/Confidentiality.

**الدليل:** `server/activity.routes.ts:20-229` يستخدم `protectedProcedure` لكل `getLogs/getStats/exportCSV/getRecent/getByEntity/getByUser`، وليس admin/manager. `exportActivitiesAsCSV` يطلب حتى 10000 سجل، وقد يضم `changes` وIP وأسماء الكيانات.

**الأثر:** عضو عادي قد يقرأ تاريخ عمليات الزملاء وبيانات before/after وIP وربما تفاصيل قانونية. `getStats` يجلب كل سجلات المكتب إلى الذاكرة، ما يفتح ضغطًا على قاعدة البيانات.

**الإصلاح الإلزامي:** تقييد التصدير والقراءة التفصيلية إلى admin/manager أو policy صريحة، إزالة الحقول الحساسة من CSV، حدود ثابتة وpagination، ومنع تحميل كل المكتب إلى الذاكرة.

### F-006 — مصدر IP في الأدلة قابل للتزوير

**الخطورة:** High على قيمة audit evidence، Medium تقنيًا.

**الدليل:** مسارات كثيرة تسجل `ctx.req.headers["x-forwarded-for"]` أو القيمة القادمة من العميل مباشرة. لا يظهر في bootstrap `trust proxy` مضبوط أو parser يحدد hop موثوق.

**الأثر:** يستطيع العميل تزوير IP المسجل، ما يضعف التحقيقات الداخلية ويجعل سجلًا يبدو كدليل غير موثوق.

**الإصلاح الإلزامي:** ضبط trusted proxy وفق البنية الفعلية، استخراج socket/proxy chain الموثوقة، حفظ raw header منفصلًا إن لزم، وعدم اعتبار القيمة وحدها دليلًا.

### F-007 — CSV export قابل لـformula injection وescaping غير صحيح

**الخطورة:** High عند فتح الملف في Excel/LibreOffice.

**الدليل:** `server/activity.service.ts:219-234` يلف الحقول بعلامات اقتباس لكنه لا يهرب علامات الاقتباس أو CR/LF ولا يمنع القيم التي تبدأ بـ`=`, `+`, `-`, `@`.

**الأثر:** `entityName` أو `changes` المأخوذة من مدخلات المستخدم قد تتحول إلى formula عند فتح CSV، أو تكسر صفوف التصدير.

**الإصلاح الإلزامي:** RFC-compliant CSV escaping، prefix neutralization للقيم الخطرة، ويفضل export بصيغة آمنة أو تنزيل محمي مع warning.

### F-008 — فقدان audit لا يفشل العملية ولا يوجد outbox

**الخطورة:** High من منظور chain of custody.

**الدليل:** `server/activity.service.ts:32-59` يلتقط فشل insert ويسجل في console ثم يعيد النجاح. `logActivity` ليس داخل transaction مع العملية الرئيسية.

**الأثر:** يمكن أن تنجح عملية حذف/تعديل/رفع دون سجل durable. في نظام محاماة، هذا يمنع الاعتماد على audit كسجل قانوني أو تشغيلي.

**الإصلاح الإلزامي:** transactional outbox أو transaction تضم resource write وaudit insert، وسياسة واضحة عند فشل التدقيق: fail closed للأفعال الحرجة أو queue durable مع retry.

### F-009 — قاعدة البيانات الحقيقية غير متحققة

**الخطورة:** High/Release blocker.

**الدليل:** 30 اختبارًا متخطية عند غياب `DATABASE_URL`، و`pnpm drizzle-kit check` يتوقف برسالة `DATABASE_URL is required`. لم يثبت تطبيق migrations 0011/0012/0013، ولا نجاح `docs/MERSAD_DB_PREFLIGHT.sql` على MySQL/MariaDB.

**الأثر:** احتمال orphan rows أو فشل FK عند migration أو schema drift أو اختلاف decimal/enum semantics. لا يمكن إصدار منصة قانونية على أساس اختبارات mock/no-DB.

**الإصلاح الإلزامي:** قاعدة MySQL/MariaDB اختبارية معزولة، تشغيل orphan preflight، تطبيق migrations من الصفر والـupgrade، تشغيل كل الاختبارات، ثم restore/rollback drill موثق.

### F-010 — ledger لا يملك FKs مالية كاملة ولا تسوية فعلية

**الخطورة:** High.

**الدليل:** `drizzle/schema.ts:434-455` يعرّف `ledgerEntries` مع `matterId/invoiceId/duePaymentId/createdById` دون FK declarations. `ledger.recordInvoiceIssued` يسجل obligation، لكنه لا يربط انتقال invoice status أو duePayment status داخل transaction، ولا يسجل payment_received حقيقيًا.

**الأثر:** ledger قد يشير إلى invoice أو matter غير موجود، أو يبقى غير متزامن مع حالة الفاتورة. لا توجد ضمانة محاسبية كاملة.

**الإصلاح الإلزامي:** FKs وcross-tenant integrity، transaction تشمل invoice/duePayment/ledger، state machine واضحة، reversal entries، واختبارات concurrent idempotency على MySQL.

### F-011 — صلاحيات Activity وNotification ليست متسقة مع الحساسية

**الخطورة:** Medium-High.

**الدليل:** notifications.list وmarkAsRead يستخدمان `protectedProcedure` فقط، وactivity protected فقط. سجل الإشعار نفسه مربوط userId في القراءة، لكن لا توجد policy موحدة لتفاصيل الإشعارات أو تصديرها.

**الإصلاح:** توحيد سياسة access بحسب نوع البيانات، وعدم اعتبار authenticated كافيًا لكل البيانات التشغيلية.

## 4. Findings قاعدة البيانات وسلامة المجال

| ID | الخطورة | الملاحظة |
|---|---|---|
| F-012 | High | `projects`, `courtSessions`, `tasks`, `timesheets`, `expenses`, `duePayments`, `invoices`, و`legalServiceRequests` تملك علاقات IDs و`lawFirmId` لكن schema الحالي لا يعلن FKs كاملة لها. |
| F-013 | High | `matterNumber`, `caseNumber`, `projectNumber`, `invoiceNumber` unique على مستوى الجدول لا مركبة مع `lawFirmId`. قد يحدث تعارض بين المكاتب أو يمنع مكتبًا من استخدام رقم صحيح؛ هذا ليس تسريبًا لكنه multi-tenancy domain defect. |
| F-014 | High | بعض دوال DB تعيد `[]`, `undefined`, أو `null` عند غياب DB بدل error موحد. ذلك يخلط outage مع no-data وقد يؤدي إلى قرارات تشغيلية خاطئة. |
| F-015 | Medium-High | `getActivityLogs` يحدد limit إلى 1000، لكن `getStats` يجلب كل سجلات المكتب إلى الذاكرة، و`exportActivitiesAsCSV` يمرر limit 10000 ثم يُقص إلى 1000، مع سلوك غير موثق. |
| F-016 | Medium | `getAuditLogsByCaseId` لا يمرر `lawFirmId` إلى query. Router يتحقق من القضية قبل الاستعلام، لكن contract database نفسه أضعف من المطلوب ويعتمد على caller discipline. |
| F-017 | High | `updateCase` و`softDeleteCase` يستقبلان ID فقط داخليًا، ويفحص router الملكية قبل الكتابة دون شرط tenant في UPDATE نفسه. يلزم tenant-qualified write لتقليل race/TOCTOU. |
| F-018 | High | `courtSessions` و`tasks` و`timesheets` وغيرها ليست كلها tenant-scoped في schema عبر FK، ما يجعل سلامة العلاقات تعتمد على التطبيق وحده. |

## 5. Findings المصادقة والـruntime

### F-019 — Runtime hardening ناقص

`server/_core/index.ts` لا يضيف security headers، CORS policy صريحة، rate limiting، request-origin validation، أو route-specific body limits قبل مسارات المصادقة والرفع. Global JSON/urlencoded limit هو 50 MB، وهو أكبر من اللازم لكل API.

### F-020 — session lifetime طويل دون idle/session inventory

JWT session مدته سنة (`ONE_YEAR_MS`). توجد revocation بـ`jti`، لكن لا تظهر rotation، idle timeout، device/session inventory، أو rate limiting لمحاولات OAuth/callback. هذا يزيد أثر سرقة Cookie.

### F-021 — كود أمان قديم غير صالح للاستخدام المحلي

`server/security.service.ts` يحتوي PBKDF2 بـ1000 iteration ومقارنة hashes غير constant-time، وAES-256-CBC بمفتاح padded/ممكن فارغ دون authentication tag. الكود غير مستخدم في OAuth الحالي، لكنه خطر مستقبلي وcontradiction مع security standards ويجب حذفه أو إصلاحه قبل أي local-password feature.

### F-022 — runtime drift وbootstrap بديل

يوجد `server/_core/index.ts` وهو مسار build/start الأساسي، ويوجد `server/index.ts` منفصل مع CORS stub credentialed و`/api/test-email` public. اختلاف bootstraps يرفع خطر تشغيل المسار الخطأ أو اختلاف الحماية بين البيئات.

## 6. Findings الواجهة والمنتج

### F-023 — mock code وdead demo surfaces ما زالت في المستودع

`AdminApprovalPage.tsx` يحتوي `mockRequests` و`setTimeout` يغيّر الحالة دون API وTODO للموافقة/الرفض. `ComponentShowcase.tsx` يعرض demo AI responses. هذه الصفحات ليست routes حالية حسب `client/src/App.tsx`، لذا هي ليست exploit runtime مباشرًا، لكنها خطر regression وخداع إذا أُعيد ربطها.

### F-024 — DashboardLayout يحتوي scaffold navigation

`client/src/components/DashboardLayout.tsx:30-33` يحتوي `Page 1` و`Page 2` و`/some-path`. المكون ليس shell الرئيسي الحالي، لكن وجوده ضمن codebase يثبت runtime/design drift.

### F-025 — Client Portal غير موجود

لا توجد هوية عميل وصلاحيات محدودة مستقلة. لا يجوز إعادة استخدام OAuth الداخلي كهوية عميل، لأن ذلك قد يعطي العميل وصولًا إلى سطح المكتب الداخلي.

### F-026 — Arabic/RTL acceptance غير مكتمل

يوجد Arabic normalization ودعم RTL جزئي، لكن لا توجد نتائج acceptance بصرية شاملة، ولا OCR/PDF عربي حقيقي، ولا اختبار mobile/accessibility متعدد الصفحات.

## 7. Findings التكاملات الخارجية والميزات غير المنفذة

`PaymentService` و`SMSService` و`EmailService` fail-closed أو تعيد false بدل fake success، وهذا سلوك أمني صحيح لكنه يعني أن الميزات غير متاحة. `DocumentService.convertToPDF` و`extractTextFromDocument` ترجعان null، وdeadline worker لا يظهر مربوطًا بجدولة إنتاجية. Backup/restore runbook موجود لكن لا يوجد restore drill فعلي. MFA وPassword reset غير منفذين، وAI citations/human review غير منفذين.

وجود provider URL أو API key في environment لا يثبت contract، TLS policy، timeout/retry/idempotency، redaction، أو data processing agreement. لا يجب اعتبار هذه المسارات إنتاجية قبل مراجعة المزود.

## 8. قرار الإطلاق

التصنيف النهائي: **NOT READY — لا تطلق المنصة على بيانات محامين أو عملاء حقيقية.**

السبب ليس نقص ميزة تجميلية، بل وجود مجموعة blockers أمنية مباشرة: CSRF على مسارات Cookie-authenticated، OAuth state/nonce غير مثبت، least privilege غير مكتمل، audit غير durable، dependency High advisories، وغياب تحقق MySQL/MariaDB الفعلي. حتى إغلاق كل البنود الخارجية، لا يصبح الإصدار جاهزًا قبل إغلاق F-001 وF-002 وF-004 وF-005 وF-008 وF-009 وF-010، ثم إجراء اختبار اختراق خارجي.

## 9. بوابة إطلاق إلزامية

لا يجوز تغيير التصنيف إلى `RELEASE CANDIDATE` قبل تحقق كل ما يلي: إضافة CSRF/Origin defenses واختبارات browser؛ state/nonce OAuth؛ policy matrix لكل role؛ تقييد Activity export؛ durable audit/outbox؛ DB preflight وmigrations على MySQL؛ FKs المالية؛ إزالة localStorage user cache؛ معالجة High advisories أو اعتماد mitigations رسميًا؛ تشغيل restore drill؛ ومراجعة security headers/rate limiting/session TTL.

لا يجوز تغيير التصنيف إلى `PRODUCTION READY` إلا بعد اختبار اختراق مستقل، مراجعة إعدادات الاستضافة وTLS وproxy، اختبار Firm A/Firm B على قاعدة حقيقية، scanner معتمد، backup restore مثبت، ومراجعة قانونية/تشغيلية لمتطلبات حفظ بيانات العملاء.

## References

[1]: ../server/_core/index.ts "MERSAD runtime bootstrap"
[2]: ../server/_core/cookies.ts "Session cookie policy"
[3]: ../server/_core/oauth.ts "OAuth callback"
[4]: ../client/src/main.tsx "Client transport and credentials"
[5]: ../client/src/_core/hooks/useAuth.ts "Client authentication hook"
[6]: ../server/_core/trpc.ts "Procedure authorization middleware"
[7]: ../server/routers.ts "Tenant and business routers"
[8]: ../server/activity.routes.ts "Activity routes"
[9]: ../server/activity.service.ts "Activity service and CSV export"
[10]: ../server/document-upload.routes.ts "Document upload route"
[11]: ../server/branding-upload.routes.ts "Branding upload route"
[12]: ../drizzle/schema.ts "Database schema"
[13]: ../drizzle/0011_core_relationship_fks.sql "Core FK migration"
[14]: ../drizzle/0012_document_scan_fail_closed.sql "Fail-closed scan migration"
[15]: ../drizzle/0013_immutable_ledger.sql "Immutable ledger migration"
[16]: ../server/security.service.ts "Legacy security helpers"
[17]: ../server/index.ts "Alternate runtime bootstrap"
[18]: ../client/src/App.tsx "Reachable client routes"

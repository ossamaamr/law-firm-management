# MERSAD — التقرير الجنائي النهائي لتدقيق الإصدار

**تاريخ التدقيق:** 19 أغسطس 2026

**نطاق التدقيق:** مستودع `law-firm-management` كاملًا، بما في ذلك `client/` و`server/` و`drizzle/` وملفات configuration وmigrations والاختبارات والاعتماديات والوثائق ومسارات التشغيل.

**القرار التنفيذي:** **NOT READY — ممنوع إطلاق المنصة على بيانات محاماة حقيقية قبل إغلاق Findings الأمن P1/High وإثبات قاعدة البيانات الفعلية.** نجاح TypeScript والاختبارات والبناء لا يساوي جاهزية أمنية أو تشغيلية.

> لا يمكن إعلان منصة قانونية “خالية بالكامل من الثغرات” من تدقيق مستودع فقط؛ القرار المهني الصحيح يحتاج أيضًا اختبار اختراق خارجي، مراجعة بنية الاستضافة، فحص إعدادات قاعدة البيانات، ومراجعة مزودي OAuth/storage/monitoring. هذا التقرير يثبت مشكلات من الكود نفسه ولا يعتمد على افتراض أن البيئة الخارجية ستعالجها.

## 1. الخلاصة التنفيذية

المستودع في حالة تطوير متقدمة، وفيه نقاط قوية حقيقية: جلسة Cookie موقعة مع `jti` revocation، عزل Tenant في عدد من المسارات، scanner boundary fail-closed، signed URLs، ledger append-only، approval transaction، فهارس وFK جزئية، واختبارات server-side جيدة نسبيًا. أُغلق في القسمين الأول والثاني محيط CSRF/Origin، OAuth state/nonce، localStorage user cache، role gates الأساسية، وتقييد Activity export، وأضيفت migration 0014 لـtenant integrity. ومع ذلك توجد فجوات تمنع الإطلاق: قاعدة البيانات الحقيقية لم تُشغّل عليها migrations أو orphan preflight، سجلات التدقيق غير ذرية ويمكن فقدها، ledger المالي يحتاج FKs وتسوية كاملة، وdependency audit يظل يفشل بستة High advisories.

النتيجة ليست أن Tenant isolation غير موجود؛ بل إن **عزل المكتب موجود في طبقات عديدة لكنه ليس بديلًا عن CSRF أو role authorization أو integrity constraints الكاملة**. لذلك فإن وجود `lawFirmId` في الاستعلامات لا يكفي لحماية بيانات المحاماة.

## 2. بوابات الجودة والأدلة القابلة لإعادة التشغيل

| الفحص | النتيجة | التفسير |
|---|---:|---|
| `pnpm check` | ناجح | لا يثبت أمن runtime أو صحة قاعدة البيانات |
| `pnpm test` | 154 ناجحًا، 30 متخطيًا | الاختبارات المتخطية مرتبطة بغياب `DATABASE_URL`؛ لا تثبت تكامل MySQL |
| `pnpm build` | ناجح | لا يثبت حماية endpoints أو الإعدادات الإنتاجية |
| `git diff --check` | ناجح | فحص تنسيق whitespace فقط |
| `pnpm audit --audit-level=high` | فاشل | 45 advisory:‏ 6 High و31 Moderate و8 Low |
| `pnpm drizzle-kit check` | غير مكتمل | يتطلب `DATABASE_URL`؛ لم يُنفذ فحص قاعدة حقيقي |
| GitHub synchronization | ناجح سابقًا | `origin/main` كان مطابقًا لـHEAD قبل بدء هذا التقرير؛ لا يعني release deployment |

## 3. Findings الأمنية الحرجة والعالية

### F-001 — غياب CSRF/Origin protection على Cookie-authenticated mutations — CLOSED IN CODE, ACCEPTANCE PENDING

**الخطورة:** Critical بالنسبة لمسارات upload/branding، وHigh على مستوى request hardening العام.

**الدليل السابق:** `server/_core/index.ts` كان يركب `/api/documents` و`/api/branding` و`/api/trpc` دون CSRF middleware أو Origin/Referer validation. **الإصلاح الحالي:** أضيفت `server/_core/request-security.ts`، ورُكبت قبل المسارات في bootstrap، وأضيفت اختبارات missing-origin وforeign-origin وdouble-submit. ما زال browser/proxy acceptance مطلوبًا قبل اعتبار الحماية production-proven.

**الأثر:** يمكن لموقع خارجي محاولة إرسال multipart POST مع Cookie الضحية إلى مسارات حساسة. لا توجد حماية صريحة تمنع ذلك. الأثر الأكبر هو تغيير Branding ورفع مستندات أو استهلاك storage؛ ويجب اختبار ذلك بمتصفح حقيقي خلف proxy، لا افتراض أن CORS يعالج CSRF.

**حالة الإغلاق:** أضيفت Origin allow-list وCSRF double-submit token تغطي tRPC وmultipart، مع اختبارات missing/foreign Origin وtoken. المتبقي browser/proxy acceptance واختبار متصفح حقيقي خلف البنية الإنتاجية.

### F-002 — OAuth callback لا يثبت state/nonce server-side — CLOSED IN CODE, PROVIDER ACCEPTANCE PENDING

**الخطورة:** High.

**الدليل السابق:** `server/_core/oauth.ts` كان يتحقق من وجود `code/state` فقط. **الإصلاح الحالي:** `/api/oauth/start` يولد nonce server-side في HttpOnly cookie، والـcallback يتحقق من nonce وredirect URI قبل exchange، مع اختبارات callback مزور ومفقود. يبقى اختبار مزود OAuth الفعلي مطلوبًا.

**الأثر:** ضعف مقاومة login CSRF/code injection أو ربط callback بطلب OAuth لم يبدأه المستخدم. قد يخفف المزود الخارجي الخطر إذا كان يفرض state داخليًا، لكن لا يوجد إثبات محلي في المستودع.

**حالة الإغلاق:** أضيف state/nonce قصير العمر server-side، والتحقق قبل exchange، وredirect URI allow-list. المتبقي اختبار مزود OAuth الفعلي في بيئة staging.

### F-003 — تخزين بيانات هوية المستخدم في localStorage — CLOSED IN CODE

**الخطورة:** High بالنسبة لمنصة ملفات قانونية حساسة.

**الدليل السابق:** `client/src/_core/hooks/useAuth.ts:44-48` كان يكتب `meQuery.data` إلى `localStorage`. **الإصلاح الحالي:** أزيلت الكتابة، وأصبح مصدر الهوية Cookie + `auth.me` فقط؛ يلزم browser regression للتأكد من عدم وجود تخزين آخر في مسارات غير مستخدمة.

**الأثر:** بيانات هوية المكتب والمستخدم تبقى في browser storage وتصبح قابلة للقراءة من أي XSS مستقبلي أو extension أو كود طرف ثالث. هذا يناقض ادعاء cookie-only hardening، حتى لو لم يتم تخزين JWT.

**حالة الإغلاق:** أزيلت الكتابة إلى localStorage من auth hook. المتبقي browser regression ومسح أي بيانات قديمة عند upgrade إن كانت موجودة لدى مستخدمين سابقين.

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

كان يوجد `server/index.ts` كـbootstrap بديل مع CORS stub credentialed و`/api/test-email` public، وقد حُذف في القسم الأول لأنه غير مستخدم ومصدر runtime drift. المسار الوحيد المعتمد هو `server/_core/index.ts`.

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

## 8. نتيجة القسم الثاني

أضيف `roleProcedure` مركزي، وفُصلت صلاحيات فريق القضايا عن compliance والمالية والإدارة. أصبحت القضايا والعملاء والمستندات محمية بأدوار admin/manager/lawyer، وKYC/conflict checks محمية إداريًا، وActivity التفصيلي والتصدير محميًا لـadmin/manager. كما أصبحت `updateCase` و`softDeleteCase` tenant-qualified داخل SQL، مع affectedRows verification.

أضيفت migration `drizzle/0014_tenant_integrity_fks.sql` وsnapshot متوافق، تتضمن composite tenant keys وFKs للقضايا والمشاريع والجلسات والمهام والمستندات. كما أضيفت `drizzle/0015_financial_audit_fks.sql` لـFKs المالية والتدقيقية. نجح `pnpm check` و`drizzle-kit check` بإعداد اتصال مؤقت غير محفوظ، ونجحت اختبارات CSV وledger والعزل. لم تُطبق migrations على MySQL حقيقية، ولذلك لا تُعد F-009 مغلقة.

## 9. قرار الإطلاق

التصنيف النهائي: **NOT READY — لا تطلق المنصة على بيانات محامين أو عملاء حقيقية.**

السبب ليس نقص ميزة تجميلية، بل وجود blockers متبقية: audit غير durable، FKs وتسوية مالية غير مكتملة، dependency High advisories، وغياب تحقق MySQL/MariaDB الفعلي. أُغلقت F-001 وF-002 وF-003 وF-004 وF-005 وF-007 في الكود ضمن نطاقها الحالي. أصبح F-008 جزئيًا متقدمًا: أضيف outbox دائم مع eventKey وretry وprojection idempotency، وربط إنشاء القضية داخل transaction؛ لكن بقية mutations الحساسة وworker التشغيلي لم تكتمل. أصبح F-010 جزئيًا بسبب FKs وrelation validation دون reconciliation transaction كاملة. لا يصبح الإصدار جاهزًا قبل إغلاق F-008 وF-009 وF-010 وبقية domain findings، ثم إجراء اختبار اختراق خارجي.

## 10. نتيجة القسم الرابع — Transactional Audit Outbox

أُضيف `auditOutbox` في migration `drizzle/0016_audit_outbox.sql` مع حالات معالجة وbackoff وeventKey فريد، وأصبح `logActivity` يكتب outbox بدل إسقاط سجل النشاط مباشرة. يكتب `drainAuditOutbox` إسقاطات activity/audit داخل transaction ويمنع التكرار عبر uniqueness، بينما يستخدم `createCaseWithAudit` transaction واحدة لإنشاء القضية وحدث التدقيق. أثبتت البوابات **154 اختبارًا ناجحًا و30 متخطيًا** ونجاح check/build/diff check. لا تثبت هذه النتائج تطبيق MySQL أو تشغيل worker متعدد النسخ.

## 11. بوابة إطلاق إلزامية

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
[17]: ../drizzle/0014_tenant_integrity_fks.sql "Tenant integrity FK migration"
[18]: ../server/role-policy.test.ts "Least-privilege role tests"
[19]: ../client/src/App.tsx "Reachable client routes"

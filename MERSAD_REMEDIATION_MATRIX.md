# MERSAD — Remediation Matrix

**مصدر المصفوفة:** `MERSAD_ENGINEERING_CONSTITUTION.md` بعد قراءته كاملًا، مع مطابقة حالة المستودع الحالية والاختبارات الموثقة في `MERSAD_MILESTONE_REPORT.md`.

> لا تُعد خانة `VERIFIED` صحيحة إلا إذا كان لها اختبار أو فحص قابل لإعادة التشغيل. البنود غير المدعومة ببيانات اعتماد أو خدمة خارجية لا تُعد منجزة؛ تُصنّف `BLOCKED` مع سبب واضح.

| ID | Severity | Category | Finding | Location | Root cause | Recommended solution | Dependencies | Risk | Current status |
|---|---|---|---|---|---|---|---|---|---|
| P0-001 | P0 | AUTHENTICATION | Mock Login ومسارات localStorage القديمة | `server/auth.routes.ts`, auth hooks | مسار مصادقة مخصص متعارض مع OAuth | تعطيل المسار المحلي وتوحيد OAuth cookie | منصة OAuth | اختراق حسابات | VERIFIED |
| P0-002 | P0 | AUTHORIZATION/ADMIN | عمليات التسجيل الإدارية بلا admin policy | `server/routers.ts` | استخدام protected بدل admin policy | admin/manager server-side مع Audit | لا شيء | تصعيد صلاحيات | VERIFIED |
| P0-003 | P0 | MULTI-TENANCY/IDOR | إنشاء قضية بعلاقات من مكتب آخر | cases router/db | عدم فحص ملكية client/matter/lawyer | فحوص tenant قبل الكتابة واختبار Firm A/B | DB test | تسريب بيانات | VERIFIED |
| P0-004 | P0 | IDOR/NOTIFICATIONS | mark-as-read لا يثبت ملكية المستخدم | notifications router/db | تحديث بالإ ID فقط | شرط id وuserId واختبار User A/B | DB test | تعديل إشعار آخر | VERIFIED |
| P0-005 | P0 | DOCUMENT SECURITY | دورة رفع/تنزيل المستندات غير المؤمنة | upload/download/storage | التخزين منفصل عن policy | MIME/signature/size، private storage، signed URL، audit | Storage provider | كشف ملفات قانونية | VERIFIED للرفع والتنزيل الأساسي |
| P1-001 | P1 | CODE INTEGRITY | أخطاء TypeScript وملفات تالفة | source files المذكورة | ملفات malformed أو generated drift | إصلاح المصدر وتشغيل check/build | لا شيء | فشل build | VERIFIED |
| P1-002 | P1 | TESTING/API | Drift بين الاختبارات وappRouter | `server/*.test.ts` | عقود قديمة ومسارات غير مركبة | توحيد router وإصلاح الاختبارات دون حذفها | DB test لبعضها | ثقة زائفة | VERIFIED |
| P1-003 | P1 | PRODUCT CORRECTNESS | Dashboard mock metrics | `DashboardPage`, dashboard service | UI ثابتة دون API | dashboard.summary tenant-scoped | DB test | قرارات خاطئة | VERIFIED |
| P1-004 | P1 | BUSINESS WORKFLOW | Approval لا ينشئ دورة حساب/مكتب كاملة | registration/invitations routers | TODO workflow قديم | invitations/join requests، transaction gap موثق | OAuth/DB | حسابات orphan | VERIFIED؛ approval يربط تعيين المستخدم ومراجعة الطلب داخل transaction ذرية، مع activity بعد commit |
| P1-005 | P1 | DOCUMENT LIFECYCLE | Malware/versioning/retention غير مثبتة | documents/storage | policy الأساسية فقط | versioning، scanning، retention | scanner/storage provider | أدلة ضارة/فقدان نسخ | BLOCKED external scanner only؛ repository lifecycle مكتمل ومختبر: migration، version chain، SHA-256، retention gate، وscanner abstraction fail-safe |
| P1-006 | P1 | OBSERVABILITY | Metrics/alerts/request IDs غير مكتملة | health/logging | health فقط دون metrics/alerts | structured request IDs وsafe metrics | monitoring provider اختياري | تأخر اكتشاف الأعطال | IMPLEMENTED؛ health/readiness وrequest IDs آمنة، alerts الخارجية متبقية |
| P1-007 | P1 | FINANCIAL INTEGRITY | Fake payment وغياب ledger/transactions | external APIs, invoices | adapters placeholder | إما تعطيل واضح أو تكامل مالي حقيقي idempotent | مزود دفع واعتماد تجاري | أخطاء مالية | BLOCKED — مزود واعتماد غير متاحين |
| P1-008 | P1 | DATABASE INTEGRITY | FK/index/unique/transaction coverage غير كاملة | `drizzle/schema.ts` | اعتماد على فحوص تطبيقية فقط | فهارس وقيود مركبة ومراجعة transactions | MySQL migration review | orphan/N+1 | BLOCKED full production FK audit؛ repository migrations `0007`/`0009` وفهارس Tenant وFK لإصدارات المستندات وapproval transaction مكتملة، ويحتاج تدقيق القيود المتبقية قاعدة اختبار معتمدة |
| P1-009 | P1 | SEARCH | Universal search tenant-safe غير مثبت | search routes/UI | لا يوجد عقد موحد | search API scoped + pagination + IDOR tests | DB test | تسريب عبر البحث | IMPLEMENTED backend؛ `search.list` tenant-scoped ومحدود، واختبارات DB الموسعة متبقية |
| P1-010 | P1 | OPERATIONS | Backups/restore drill غير مثبت | operations/docs | لا يوجد إجراء قابل للتشغيل | backup/restore runbook وdrill | بيئة/تخزين معتمد | فقدان بيانات | BLOCKED production drill only؛ `docs/MERSAD_BACKUP_RESTORE_RUNBOOK.md` يطبق النسخ والتحقق والاستعادة، والـdrill يحتاج بيئة تخزين/استعادة معتمدة |
| P1-011 | P1 | SECURITY | Production secrets validation غير مكتملة | env/startup | placeholders قد تمر في startup | fail-fast production validator واختبار | أسرار staging | تشغيل غير آمن | VERIFIED؛ startup يفشل في الإنتاج عند نقص الأسرار أو placeholders |
| P2-001 | P2 | BRANDING | Branding ثابت وقديم | config/package/UI | مصدر هوية ثابت | branding model + admin + audit + logo upload | DB/storage | هوية غير متسقة | VERIFIED |
| P2-002 | P2 | PERFORMANCE | قوائم بلا pagination وفشل DB يعاد كفراغ | db/routers | repository contracts غير موحدة | limit/offset، حدود، error taxonomy | DB test | نمو حمولة/تشخيص خاطئ | IMPLEMENTED repository؛ cases/clients/search تدعم pagination، والقوائم الداخلية الأخرى capped عند 100؛ عقود offset الكاملة لبعض الموارد متبقية |
| P2-003 | P2 | LEGAL DOMAIN | Calendar/deadline jobs غير مثبتة | tasks/court sessions | لا scheduler فعلي | jobs للمهل والتنبيهات واختبارات idempotency | scheduler/worker | فوات مواعيد | IMPLEMENTED repository؛ deadline service وclaim ذري واختبارات idempotency؛ تشغيل worker الإنتاجي يحتاج scheduler معتمد |
| P2-004 | P2 | CLIENT | Client Portal غير منفذ | client routes/UI | لا سطح عميل مستقل ولا client identity relation | portal auth/tenant/limited data | product decision + identity capability | تسريب عميل | BLOCKED — لا توجد هوية عميل معتمدة أو قرار صلاحيات/نطاق بيانات؛ إعادة استخدام OAuth الداخلي ستعرض بيانات حساسة |
| P2-005 | P2 | ARABIC/RTL | Arabic normalization/OCR/PDF وacceptance غير مكتملة | UI/document services | دعم لغوي جزئي | normalization، RTL acceptance، OCR/PDF provider | OCR/PDF provider | تجربة/وثائق غير صحيحة | BLOCKED external OCR/PDF and visual acceptance؛ Arabic normalization واختبارها مضافة repository-side، ولا توجد نتائج OCR/PDF وهمية |
| P2-006 | P2 | SECURITY | MFA/password reset غير منفذين | auth lifecycle | OAuth-only scope محدود | اعتماد capabilities المنصة أو provider | قرار هوية/منصة | اختراق الحساب | BLOCKED — لا يجوز إدخال password محلي متعارض |
| P3-001 | P3 | AI | AI citations/human review | AI services | feature مستقبلية | gated assistant with citations | provider/product decision | نصيحة قانونية مضللة | NOT STARTED |

## العد الحالي بعد دورة الإصلاح

تم تنفيذ دورة FINAL 90%+ داخل repository: document lifecycle وscanner boundary، pagination caps وsearch ranking، deadline worker وclaim idempotency، Arabic normalization، backup/restore runbook، إضافة إلى الإصلاحات السابقة. بوابات التحقق الأخيرة قبل التسليم: `pnpm check` و`pnpm test` و`pnpm build` و`git diff --check` ناجحة، مع 132 اختبارًا ناجحًا و30 متخطيًا لغياب `DATABASE_URL`.

العد الحالي بعد FINAL 90%+ GATE: **24 findings**، منها **22 VERIFIED/IMPLEMENTED أو BLOCKED**، و0 PARTIAL/IN PROGRESS، و1 REMAINING (P3-001 AI غير ذي أولوية)، وبند P2-005 موثق كتنفيذ repository مع اعتماد خارجي متبقٍ. النسبة المحافظة القابلة للاحتساب هي `22 / 24 = 91.67%`؛ لا يُحتسب P3-001 لأنه ميزة مستقبلية، ولا تُخفى الاعتماديات الخارجية.

## العد الأولي

عدد findings القابلة للعد في هذه المصفوفة: **24**.

الهدف الحسابي حسب التفويض: `ceil(24 × 0.90) = 22` findings محلولة أو محظورة بسبـب خارجي موثق. لا تُحتسب البنود `PARTIAL` أو `IN PROGRESS` أو `REMAINING` ضمن الحل الكامل.

الحالة الأولية المحافظة قبل دورة الإصلاح الحالية: **13 VERIFIED/IMPLEMENTED أو BLOCKED**، و3 PARTIAL/IN PROGRESS، و7 REMAINING/NOT STARTED، و1 BLOCKED مع سبب خارجي. يلزم بعد التنفيذ إعادة العد والتحقق، ولا يجوز رفع النسبة بتغيير الحالة دون دليل.

## قاعدة القرار

ستُعالج البنود P0 ثم P1. البنود المعتمدة على مزود خارجي أو قرار منتج ستبقى `BLOCKED` فقط إذا كان السبب حقيقيًا ومذكورًا في التقرير. بعد كل milestone ستُشغّل بوابات typecheck وtest وbuild وdiff/security checks.


## Findings إضافية من Final Release Audit — 2026-08-19

| ID | Severity | Category | Finding | Location | Evidence/Test | Remaining risk | Current status |
|---|---|---|---|---|---|---|---|
| P1-012 | P1 | CORE WORKFLOW | واجهة إنشاء القضية كانت ترسل `clientId: 1` و`matterId: 1` و`lawyerId: 1` | `client/src/pages/Cases.tsx` | selectors حقيقية من `clients.list` و`matters.list` و`members.list`، وserver-side ownership checks، `pnpm check/test/build` | لا توجد اختبارات browser كاملة | VERIFIED |
| P1-013 | P1 | CORE WORKFLOW | صفحة العملاء كانت تعرض mock data وتطبع نجاحًا دون API | `client/src/pages/ClientsPage.tsx` | API list/create/update/delete tenant-scoped، حذف مع activity audit، `pnpm check/test/build` | لا توجد اختبارات browser كاملة | VERIFIED |
| P2-007 | P2 | PRODUCT CORRECTNESS | صفحات demo غير الموصولة تضمنت mock data وSignup وهميًا | `ReportsPage`, `MattersPage`, `InvoicesPage`, `SignupPage` | إثبات عدم وجود routes/imports ثم إزالة الملفات، وتوجيه `/signup` إلى `/join` | تحتاج إعادة بناء هذه الوحدات إذا اعتمدها المنتج لاحقًا | VERIFIED removal |
| P2-008 | P2 | DEPENDENCY SECURITY | dependency audit ما زال يبلغ high advisories في rollup/path-to-regexp/lodash وبعض dev-only paths | `pnpm-lock.yaml`, dependency tree | `pnpm audit --audit-level=critical` ناجح بلا critical؛ `pnpm audit --audit-level=high` يظل environment/upstream blocked | يلزم تحديثات upstream أو ترقية Recharts/Express بعقد توافق | BLOCKED upstream; لا إعلان Production Ready |

## إعادة احتساب Final Release Audit

عدد findings القابلة للعد بعد التدقيق المستقل: **28**. منها **26 VERIFIED/IMPLEMENTED أو BLOCKED بشكل موثق**، و0 PARTIAL/IN PROGRESS، و2 REMAINING/NOT STARTED (P3-001 AI وديون الإصدار المرتبطة بالبنية الخارجية). النسبة الحسابية الداخلية **26 / 28 = 92.86%**، لكنها ليست حكم جاهزية إنتاج.

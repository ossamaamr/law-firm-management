# MERSAD — Database Follow-up

> هذه الوثيقة تحصر الأعمال التي تتطلب قاعدة بيانات أو بيئة تشغيل حقيقية. لا تُعد أي فقرة أدناه منجزة بمجرد نجاح الاختبارات المحلية أو مراجعة SQL.

## 1. تشغيل اختبارات التكامل على MySQL اختبارية

| الحقل | التفاصيل |
|---|---|
| **STATUS** | DEFERRED — BLOCKED BY ENVIRONMENT |
| **WHY IT IS DEFERRED** | لا توجد `DATABASE_URL` تشغيلية أو MySQL متاحة في بيئة التدقيق الحالية، ولذلك تبقى اختبارات `activity`, `cases`, و`clients` متخطية. |
| **WHAT MUST BE DONE** | إنشاء قاعدة اختبار معزولة، تطبيق migrations الحالية، تشغيل كل الاختبارات المتخطية، وحفظ النتائج دون استخدام بيانات إنتاجية. |
| **HOW IT SHOULD BE VERIFIED** | `DATABASE_URL=<test-db> pnpm test` مع إثبات عدد الاختبارات المتخطية = 0 وسجل قاعدة الاختبار. |

## 2. تطبيق migrations والتحقق من Foreign Keys والمفاتيح المركبة

| الحقل | التفاصيل |
|---|---|
| **STATUS** | DEFERRED — SQL REVIEW ONLY |
| **WHY IT IS DEFERRED** | لم تُطبق migrations `0014`, `0015`, و`0016` على MySQL فعلية في هذه الجولة. |
| **WHAT MUST BE DONE** | تطبيق migrations على قاعدة اختبار نظيفة، ثم فحص `information_schema` لقيود FK، composite tenant keys، uniqueness، وفهارس outbox والـledger. |
| **HOW IT SHOULD BE VERIFIED** | تشغيل `docs/MERSAD_DB_PREFLIGHT.sql` بنتائج orphan وcross-tenant تساوي صفرًا، مع حفظ schema dump وmigration log. |

## 3. سلامة المعاملات والتزامن

| الحقل | التفاصيل |
|---|---|
| **STATUS** | DEFERRED |
| **WHY IT IS DEFERRED** | لا يمكن إثبات isolation level أو race behavior أو rollback الحقيقي باختبارات mocks فقط. |
| **WHAT MUST BE DONE** | اختبار إنشاء القضية مع outbox، الموافقات، ledger idempotency، retry وclaim في outbox، وحالات rollback تحت معاملات متزامنة. |
| **HOW IT SHOULD BE VERIFIED** | اختبارات concurrent integration على MySQL مع assertions تمنع duplicate events وcross-tenant writes وpartial commits. |

## 4. تسوية ledger والمدفوعات

| الحقل | التفاصيل |
|---|---|
| **STATUS** | DEFERRED — FINANCIAL SIGN-OFF BLOCKED |
| **WHY IT IS DEFERRED** | لا توجد بوابة دفع معتمدة أو بيانات اختبار مالية، ولم تُثبت reconciliation حقيقية بين الالتزامات والمدفوعات. |
| **WHAT MUST BE DONE** | تعريف provider contract، تشغيل test payments، ربط settlement بالـappend-only ledger، وإثبات idempotency وreversal وaudit. |
| **HOW IT SHOULD BE VERIFIED** | reconciliation report مستقل، totals متطابقة، واختبارات duplicate webhook وretry وfailure. |

## 5. Backup/restore وorphan checks

| الحقل | التفاصيل |
|---|---|
| **STATUS** | DEFERRED — PRODUCTION DRILL NOT RUN |
| **WHY IT IS DEFERRED** | لا يجوز تنفيذ restore أو التعامل مع قاعدة إنتاجية ضمن هذه المهمة، ولا توجد بيئة استعادة معتمدة متاحة. |
| **WHAT MUST BE DONE** | تنفيذ backup وrestore على بيئة معزولة، تشغيل preflight بعد الاستعادة، وقياس RPO/RTO. |
| **HOW IT SHOULD BE VERIFIED** | restore log، checksum/row-count comparison، ونتائج preflight صفرية بعد الاستعادة. |

## 6. Aggregation وpagination performance

| الحقل | التفاصيل |
|---|---|
| **STATUS** | DEFERRED — PERFORMANCE BASELINE REQUIRED |
| **WHY IT IS DEFERRED** | لا توجد بيانات ممثلة أو query plan حقيقي لإثبات أداء aggregation والبحث والقوائم الكبيرة. |
| **WHAT MUST BE DONE** | قياس dashboard/activity/search على بيانات اصطناعية معزولة، مراجعة EXPLAIN، وضبط الفهارس أو الاستعلامات عند الحاجة. |
| **HOW IT SHOULD BE VERIFIED** | benchmark reproducible، query plans محفوظة، وحدود latency وحجم الذاكرة معتمدة قبل الإنتاج. |

## 7. Worker وoutbox متعدد النسخ

| الحقل | التفاصيل |
|---|---|
| **STATUS** | DEFERRED — PRODUCTION WORKER ENVIRONMENT REQUIRED |
| **WHY IT IS DEFERRED** | لا توجد scheduler/worker deployment حقيقية لتأكيد lock ownership، restart recovery، metrics أو alerting. |
| **WHAT MUST BE DONE** | تشغيل workerين أو أكثر على قاعدة اختبار، اختبار crash/restart، مراقبة حالات `pending/processing/failed/processed`، وإثبات عدم تكرار projections. |
| **HOW IT SHOULD BE VERIFIED** | integration run مع worker logs وmetrics، duplicate count = 0، وكل الأحداث النهائية قابلة للتفسير. |

## 8. القرار

لا تُنقل أي حالة من `DEFERRED` إلى `VERIFIED` إلا بسجل قابل لإعادة التشغيل من بيئة MySQL اختبارية أو تشغيلية معزولة. لا تتضمن هذه الوثيقة أسرارًا، ولا تسمح بتشغيل أو تعديل قاعدة إنتاجية.

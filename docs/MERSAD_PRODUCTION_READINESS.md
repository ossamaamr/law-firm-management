# MERSAD Production Readiness Record

**التاريخ:** 2026-08-19

> هذا المستند سجل قبول هندسي، وليس تصريحًا بإطلاق المنصة على بيانات قانونية حقيقية.

## القرار

التصنيف الحالي هو **NOT READY**. اجتازت الشيفرة بوابات النوع والاختبارات والبناء، وأُغلقت advisories npm الستة ذات التصنيف High عبر تحديثات مباشرة وoverrides مثبتة في lockfile. لا تزال حواجز إطلاق موضوعية: لا توجد MySQL تشغيلية متاحة في بيئة التحقق الحالية لتطبيق migrations وتشغيل الاختبارات المتخطية، كما أن transactional outbox لم يُربط بعد بكل mutations الحساسة ولم يُثبت worker متعدد النسخ في بيئة تشغيل حقيقية.

## نتائج البوابات

| البوابة | النتيجة | الدليل أو القيد |
|---|---|---|
| `pnpm check` | ناجح | TypeScript بلا أخطاء بعد استعادة dependencies من lockfile |
| `pnpm test` | ناجح جزئيًا | 154 اختبارًا ناجحًا و30 متخطيًا؛ المتخطية تعتمد على `DATABASE_URL` |
| `pnpm build` | ناجح | client وserver bundle ينتجان بنجاح |
| `git diff --check` | ناجح | لا توجد أخطاء whitespace في التغييرات الحالية |
| `pnpm drizzle-kit check` | ناجح | journal وsnapshots متسقة باستخدام عنوان اتصال توليدي مؤقت غير محفوظ |
| `pnpm audit --audit-level=high` | ناجح | 0 High؛ بقيت 4 advisories: 1 Low و3 Moderate |
| MySQL readiness | غير متاح | `mysqladmin ping` فشل لعدم وجود خادم محلي؛ لم تُطبق migrations على قاعدة حقيقية |
| `/health/live` | مقبول | لا يعتمد على قاعدة البيانات |
| `/health/ready` | محمي | لا يعيد ready دون database وstorage، وفي production يتطلب production configuration كذلك |

## متطلبات الإغلاق قبل الإطلاق

يجب تشغيل `docs/MERSAD_DB_PREFLIGHT.sql` على قاعدة MySQL/MariaDB معزولة، والتأكد من أن كل نتائج orphan وcross-tenant تساوي صفرًا. بعد ذلك تُطبق migrations `0014_tenant_integrity_fks.sql` و`0015_financial_audit_fks.sql` و`0016_audit_outbox.sql`، ثم يُعاد فحص `information_schema` للتأكد من وجود القيود المطلوبة.

يجب توفير `DATABASE_URL` حقيقي، وتشغيل الاختبارات الثلاثين المتخطية على قاعدة اختبار نظيفة، وإثبات Firm A/Firm B isolation، وrollback وrestore. يجب أيضًا تشغيل worker أو scheduler فعلي لـ`drainAuditOutbox` مع مراقبة `pending`, `processing`, `failed`, و`processed`، وإثبات عدم تكرار projections عند retry أو crash.

أُغلقت advisories High الحالية بتحديث `express` إلى 5.2.1، و`streamdown` إلى 2.5.0، وتثبيت overrides لـ`rollup >=4.59.0` و`form-data >=4.0.6` و`nanoid >=5.1.16` و`lodash >=4.18.0` و`lodash-es >=4.18.1` و`path-to-regexp >=0.1.13`. يجب إبقاء `pnpm audit --audit-level=high` في CI حتى لا تعود advisory غير معالجة؛ بقيت advisories Moderate/Low وتتطلب دورة معالجة لاحقة، لكنها لم تعد High.

## أوامر القبول الموصى بها

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm drizzle-kit check
pnpm audit --audit-level=high
mysqladmin ping
mysql --defaults-extra-file=/secure/mersad-test.cnf mersad_test < docs/MERSAD_DB_PREFLIGHT.sql
pnpm drizzle-kit migrate
```

يجب حفظ مخرجات كل أمر في سجل إصدار غير متضمن للأسرار، مع تسجيل نسخة Node وpnpm وMySQL/MariaDB، وتاريخ الاختبار، واسم قاعدة الاختبار، ونتيجة restore drill.

## قرار النشر

لا يجوز تغيير التصنيف إلى `RELEASE CANDIDATE` أو `PRODUCTION READY` اعتمادًا على هذه الجولة وحدها. القرار يتطلب بيئة MySQL حقيقية، نتيجة preflight صفرية، تشغيل جميع الاختبارات المتخطية، معالجة High advisories، إثبات worker/outbox، واختبار اختراق مستقل قبل التعامل مع بيانات عملاء أو قضايا حقيقية.

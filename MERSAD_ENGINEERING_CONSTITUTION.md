# MERSAD — الدستور الهندسي والتشغيلي للمشروع

> **الإصدار:** 1.0
> **الحالة:** ACTIVE — Audit Baseline
> **مستوى الإلزام:** MANDATORY قبل أي تعديل لاحق
> **المنتج:** MERSAD — مِرْصاد
> **المستودع:** `ossamaamr/law-firm-management`
> **نطاق هذه النسخة:** تدقيق وتوثيق فقط؛ لم تُنفّذ أي إصلاحات أو تعديلات على الكود.
> **تاريخ التدقيق:** 18 أغسطس 2026

---

## اقرأ هذه الوثيقة قبل لمس الكود

هذه الوثيقة هي **سجل الحالة الهندسية الفعلية** للمستودع، وليست وصفًا تسويقيًا ولا قائمة Features مخططة. يجب قراءتها قبل تعديل المصادقة، التفويض، العزل بين مكاتب المحاماة، قاعدة البيانات، المستندات، النظام المالي، الواجهة، أو أي تكامل خارجي.

> القاعدة الذهبية: لا تُعامل أي واجهة أو Route أو Schema على أنها ميزة مكتملة قبل إثبات دورة العمل كاملة: واجهة، API، تحقق، تفويض، عزل Tenant، قاعدة بيانات، أخطاء، اختبارات، واستمرارية بعد إعادة التشغيل.

---

# 1. خلاصة تنفيذية

المستودع عبارة عن تطبيق React/Vite مع خادم Express وtRPC وDrizzle/MySQL. يحتوي على نطاقات عمل قانونية واسعة في الـSchema، لكن جزءًا مهمًا من السلوك الفعلي غير موصول أو يعتمد على بيانات Mock أو يتعارض مع Router الفعلي. التدقيق الحالي يثبت أن الحالة **NO-GO لبيانات قانونية حقيقية حساسة**.

لم تُعدّل ملفات التطبيق ولم تُنفذ إصلاحات. الإضافة الدائمة الوحيدة المقصودة في هذه العملية هي هذا الملف. كانت شجرة Git نظيفة قبل إنشاء الوثيقة، ويجب أن يبقى أي تغيير آخر خارج نطاق هذه المهمة.

| المجال | الحالة الفعلية | التصنيف |
|---|---|---|
| البناء والصحة التركيبية | Typecheck يفشل في عدة ملفات مصدرية | NEEDS WORK |
| الاختبارات | 26 اختبارًا فاشلًا من 108، وملفات اختبار 7 فاشلة من 9 | NEEDS WORK |
| المصادقة | يوجد مساران متعارضان؛ Login المخصص يعيد Mock Token | P0 / NOT IMPLEMENTED بأمان |
| التفويض | بعض فحوص Tenant موجودة، لكن مسارات إدارية وحساسة بلا فحص دور كافٍ | P0 |
| العزل بين المكاتب | غير مثبت باختبارات شاملة، وعمليات إنشاء لا تتحقق من ملكية العلاقات | P0 |
| المستندات | Schema موجود، لكن طبقة التخزين لا تفرض الصلاحيات أو فحص الملفات بذاتها | P0/P1 |
| لوحة المعلومات | أرقام ورسوم رئيسية Hardcoded Mock | P1 |
| قاعدة البيانات | Schema واسع، مع علاقات تطبيقية دون ضمانات SQL كافية ظاهرة في التعريف | P1 |
| Arabic/RTL | توجد نصوص عربية وتنسيق `ar-SA`، لكن تجربة Arabic-first الكاملة غير مثبتة | PARTIALLY IMPLEMENTED |
| المراقبة والاستعداد للإنتاج | لا يوجد دليل كافٍ على منظومة Metrics/Alerts/Readiness مكتملة | NEEDS WORK |

---

# 2. منهج التدقيق وحدوده

تمت قراءة بنية المستودع وملفات manifests وSchema وRouters وAuthentication وStorage وواجهات المصادقة ولوحة المعلومات، كما تم تشغيل `pnpm check` و`pnpm test` دون تعديل المصدر. لم يتم تشغيل نشر إنتاجي، ولم تُستخدم بيانات قانونية حقيقية، ولم تُنفذ محاولات اختراق على نظام خارجي.

النتائج أدناه مبنية على الأدلة الموجودة في المستودع وعلى سلوك الاختبارات وقت التدقيق. ما لم يُثبت بالكود أو الاختبار صُنّف على أنه **غير متحقق**، لا على أنه موجود.

---

# 3. التقنية والبنية الحالية

## 3.1 المكدس المرصود

| الطبقة | ما يظهر في المستودع |
|---|---|
| Frontend | React 19، Vite 7، TypeScript، Tailwind، Wouter، React Query، Recharts |
| Backend | Express 4، tRPC 11، TypeScript، tsx |
| Database | MySQL عبر `mysql2` وDrizzle ORM/Drizzle Kit |
| Authentication | OAuth/Manus SDK مع JWT داخل Cookie، وبالموازاة Route Login مخصص غير مكتمل |
| Storage | Storage proxy يعتمد على متغيرات بيئية وForge/S3-like API |
| Testing | Vitest؛ الاختبارات موجودة أساسًا في `server/*.test.ts` |
| Build | Vite للواجهة وesbuild للخادم |
| Deployment hints | `vercel.json` وملفات توثيق متعددة، دون اعتبار ذلك دليلًا على صلاحية الإنتاج |

## 3.2 الحدود المعمارية

المعمارية الفعلية أقرب إلى Presentation → tRPC → Database، مع خدمات منفصلة جزئيًا. توجد دوال Database كثيرة تُستدعى مباشرة من Routers. توجد طبقة `lawFirmProcedure` وبعض فحوص Tenant داخل Router، لكن ليست كل Queries الحساسة Tenant-scoped من أصلها. كما توجد خدمات خارجية تجميعية تضم Email وSMS وAnalytics وPayment وDocument وStorage، وبعضها Mock أو Placeholder.

---

# 4. الحالة الحالية للمصادقة Authentication

يوجد مصدر مصادقة فعلي في `server/_core/sdk.ts`: يتم التحقق من JWT HS256 الموقّع بـ`ENV.cookieSecret` داخل Cookie، ثم تحميل المستخدم بواسطة `openId` ومزامنته مع قاعدة البيانات عند الحاجة. مدة الجلسة الافتراضية سنة واحدة. الـPayload المرصود يحتوي `openId` و`appId` و`name` فقط، ولا يوجد Store مركزي للجلسات أو Revocation List أو Session Rotation أو Metadata لكل جلسة.

بالتوازي، `server/auth.routes.ts` يعرّف Login مخصصًا لا يتحقق من بيانات الاعتماد، ويعيد `success: true` وبيانات مستخدم ثابتة و`mock-jwt-token`. واجهة `client/src/hooks/useAuth.ts` تحفظ هذا الرمز في `localStorage`، بينما مسار المصادقة الأساسي في SDK يعتمد Cookie. هذا تعارض معماري وأمني مباشر، وليس مجرد اختلاف تسمية.

| المطلب | النتيجة |
|---|---|
| Password verification | غير مثبت في Login المخصص |
| Password hashing/reset | غير مثبت في المسار المخصص |
| Session revocation | غير موجود في SDK المرصود |
| Rotation | غير موجود |
| Rate limiting | غير مثبت |
| Cookie-based source of truth | موجود في SDK، لكنه يتعارض مع Login المخصص |
| Token exposure | Login المخصص يرسل Mock Token إلى الواجهة ويخزنه في `localStorage` |
| Logout | يمسح Cookie في Router الأساسي، ولا يوجد توحيد واضح مع `localStorage` |

**الحكم:** P0 — المصادقة المخصصة لا تصلح كأساس إنتاجي، ويجب عدم اعتبار واجهة Login دليلًا على وجود مصادقة صحيحة.

---

# 5. التفويض Authorization

يوجد `protectedProcedure` يعتمد على وجود `ctx.user`، ويوجد `adminProcedure` في طبقة tRPC، كما يوجد `lawFirmProcedure` يتحقق من وجود `lawFirmId`. وفي `cases.get/update/delete` و`clients.get` و`documents.listByCase` و`auditLogs.listByCase` توجد فحوص مقارنة بين المورد و`ctx.lawFirmId`.

لكن `server/auth.routes.ts` يضع `getPendingRequests` و`approveRegistration` و`rejectRegistration` خلف `protectedProcedure` فقط، مع تعليقات صريحة `TODO: Check if user is admin`. لذلك يستطيع أي مستخدم مصادق عليه، بحسب المسار الحالي، الوصول إلى عمليات تسجيل إدارية أو تنفيذها. كذلك `notifications.markAsRead` يستدعي `markNotificationAsRead(input)` دون تمرير `ctx.user.id` في Router، ما يجعل ملكية الإشعار غير واضحة ويستحق اختبار IDOR مباشر.

في `cases.create` يتم أخذ `clientId` و`matterId` و`lawyerId` من الطلب، لكن المسار لا يثبت أن هذه السجلات تخص المكتب الحالي أو أن المحامي ينتمي إليه قبل الإنشاء. وضع `lawFirmId` على القضية من السياق وحده لا يكفي لعزل العلاقات المرتبطة.

**الحكم:** P0 — التفويض جزئي وغير مكتمل، والعزل يجب أن يكون شرطًا في كل عملية قراءة وكتابة، لا في بعض Routes فقط.

---

# 6. Multi-Tenancy وعزل البيانات

الـSchema يضع `lawFirmId` في معظم الكيانات الرئيسية مثل العملاء، القضايا، الـMatters، المشاريع، المهام، المستندات، الفواتير، النفقات، وسجلات الوقت. هذا تصميم مبدئي جيد، لكنه لا يثبت العزل بذاته. توجد دوال عامة مثل `getCaseById(id)` و`getClientById(id)` و`getUserById(id)`، ثم تعتمد بعض المسارات على جلب المورد وفحص `lawFirmId` بعد ذلك. هذا يترك مساحة لخطر اختلاف السلوك بين Routes، ولإنشاء علاقات عابرة للمكاتب.

لم توجد في الاختبارات الحالية مجموعة شاملة لمحاكاة Firm A/Firm B عبر Clients وMatters وDocuments وInvoices وSearch وExports وAudit Logs. لذلك تصنيف العزل هو **غير متحقق بالكامل**، وليس VERIFIED.

| اختبار مطلوب | الحالة المرصودة |
|---|---|
| قراءة Client من Firm أخرى عبر ID | فحص موجود في Router لبعض المسارات، لكن لا توجد تغطية شاملة |
| إنشاء Case بعميل من Firm أخرى | لا يظهر تحقق علاقة Tenant قبل الإنشاء |
| الوصول إلى Document من Firm أخرى | غير مثبت عبر دورة تنزيل كاملة |
| إشعارات المستخدم | Query بحسب `userId` في القراءة، لكن Mark-as-read لا يمرر هوية المستخدم |
| Search/Exports | لا يوجد دليل كافٍ على طبقة موحدة Tenant-scoped |
| Audit Logs | فحص القضية موجود في Route، لكن نموذج الاختبارات الشامل غير موجود |

**الحكم:** P0 — لا يجوز إعلان Multi-Tenancy آمنًا قبل اختبارات عزل عدائية لكل Resource حساس.

---

# 7. قاعدة البيانات والتكامل

الـSchema واسع ويغطي Users وLaw Firms وClients وMatters وCases وSessions وTasks وDocuments وTimesheets وExpenses وPayments وInvoices وNotifications وAudit Logs. توجد أنواع Drizzle وعلاقات تطبيقية.

الملاحظات الرئيسية هي أن كثيرًا من العلاقات تبدو معرّفة على مستوى Drizzle relations دون ظهور Foreign Key constraints صريحة أو Index declarations كافية في تعريف الجداول. الحقول المالية تستخدم `decimal`، وهو مناسب مبدئيًا، لكن لا يكفي وحده لضمان انتقالات مالية صحيحة أو Ledger قابل للتدقيق. كما أن بعض الموارد تستخدم Unique عام مثل `caseNumber` و`matterNumber` و`invoiceNumber` بدل إثبات أن التفرد يجب أن يكون عالميًا أو مركبًا مع `lawFirmId`.

توجد دوال Database تعيد `[]` أو `undefined` عند عدم توفر قاعدة البيانات في أكثر من موضع؛ وهذا قد يخلط بين «لا توجد بيانات» و«فشل قاعدة البيانات». كما أن عمليات متعددة الخطوات مثل اعتماد التسجيل وتحديث الحالة وإرسال البريد لا تظهر كمعاملة واحدة Atomic.

**الحكم:** P1 — Schema غني لكنه لا يساوي Data Integrity مكتملة.

---

# 8. المستندات والتخزين

جدول `documents` يحتوي `lawFirmId` و`uploadedById` و`fileName` و`fileType` و`fileSize` و`s3Key` و`s3Url` و`isPublic`. طبقة `server/storage.ts` تنفذ النقل/الوصول إلى التخزين، لكنها لا تفرض في ذاتها MIME validation أو File-size validation أو Malware scanning أو Permission check أو Tenant scope أو Audit event.

وجود `s3Url` مخزنًا في السجل، ووجود `isPublic`، يتطلبان تصميمًا واضحًا يمنع الروابط الدائمة العامة للوثائق الحساسة. لم يُثبت في المسار المدروس وجود دورة كاملة: Authorized API → Permission Check → Short-lived Signed URL → Private Object Storage → Download Audit.

**الحكم:** P0/P1 — المستندات القانونية لا تُعتبر آمنة لمجرد وجود S3 key أو Storage helper.

---

# 9. لوحة التحكم وAdmin Control Center

`DashboardPage.tsx` يصرّح صراحةً بأن البيانات Mock، ويعرض أرقامًا ثابتة مثل 24 قضية، 45 موكلًا، 156 فاتورة، و45,000 نفقات، إضافة إلى بيانات رسوم ثابتة للاتجاهات والإيرادات. النشاط الأخير فقط يأتي من Hook فعلي. هذا يجعل لوحة المعلومات تبدو تشغيلية بينما مؤشرات الأعمال ليست Tenant-scoped ولا مستخرجة من قاعدة البيانات.

مسارات الموافقة الإدارية موجودة في `auth.routes.ts`، لكنها لا تفرض دور Admin/Manager في تلك الإجراءات. كما أن Approval لا ينشئ فعليًا المكتب والمستخدم وFirm Identifier؛ التعليقات في الكود تسجل هذه الأجزاء كـTODO، ثم تحدّث طلب التسجيل وترسل بريدًا.

| قدرة إدارية | الحالة |
|---|---|
| عرض مؤشرات حقيقية | NOT IMPLEMENTED؛ الأرقام الرئيسية Mock |
| إدارة التسجيلات | جزئية؛ المسارات موجودة لكن الحماية ناقصة والإنشاء غير مكتمل |
| إدارة المستخدمين والأدوار | غير مثبتة كـAdmin Center مكتملة |
| Audit للإجراءات الإدارية | غير مثبت لكل التغييرات |
| Branding ديناميكي | غير موجود كإعداد Tenant/Admin موحد |
| System health/usage | غير مثبت |

**الحكم:** P1 — الواجهة الحالية Decorative أكثر من كونها Control Center تشغيليًا.

---

# 10. Branding واسم المنتج

يوجد Config ثابت في `server/config/contact.config.ts` يحتوي على اسم `CasEngine` وبيانات اتصال وروابط ثابتة، كما يظهر اسم التطبيق `law-firm-management-app` في `package.json`. هذا يعني أن المنتج الفعلي والهوية الحالية غير موحدين مع MERSAD، ولا يوجد دليل على إمكانية تغيير اسم المنصة من Admin Control Center.

لا توجد آلية موثقة لتخزين Branding بحسب Tenant، أو تحميله في Metadata وPWA وEmail وPDF والتقارير، أو تدقيق تغييره، أو إدارة Cache له.

**الحكم:** P2 — Branding مركزي/ديناميكي مفقود، مع خطر استمرار أسماء قديمة أو بيانات اتصال غير مناسبة.

---

# 11. الواجهة وتجربة Arabic-first

توجد واجهات عربية، وتستخدم لوحة المعلومات `toLocaleDateString("ar-SA")`، وهذا يثبت دعمًا جزئيًا للغة. لكنه لا يثبت RTL-native أو تطبيع البحث العربي أو دعم الأرقام والتواريخ المختلطة أو PDF/OCR العربي أو جودة الجداول والنماذج على الهاتف.

يوجد أيضًا خطر صحة/اكتمال في بعض ملفات الواجهة. فـ`useAuth.ts` يستخدم `useState` و`useCallback` دون ظهور استيراداته في الملف المقروء، كما أن `useVerifyIdentifier` ينشئ Query معطّلًا ثم يعيد `{ exists: true, firmId: 1 }` ثابتًا بدل استدعاء Backend.

**الحكم:** PARTIALLY IMPLEMENTED؛ لا يجوز وصف المنتج بأنه Arabic-first كامل.

---

# 12. الخدمات الخارجية والميزات الوهمية

`server/external-apis.service.ts` يضم خدمات Email وSMS وAnalytics وPayment وDocument وStorage. بعض الدوال تسجل العملية فقط أو تعيد نتائج ثابتة/Placeholder؛ ومن أمثلتها Payment الذي يعيد `success: true` وTransaction ID مبنيًا على `Date.now()`، وDocument conversion/OCR الذي يعيد `null`، وStorage الذي يعيد رابطًا بصيغة `storage.example.com` في مسار الخدمة التجميعية.

هذه ليست Integrations إنتاجية ولا يجوز عرضها للمستخدم كأنها عمليات دفع أو تخزين أو OCR فعلية. يجب تصنيفها كـMock/Placeholder حتى يتم ربطها بخدمات حقيقية مع Secrets وIdempotency وAudit وError Handling.

---

# 13. الأداء والموثوقية

توجد Queries عامة بلا Pagination في دوال مثل `getUsersByLawFirm` و`getClientsByLawFirm`، ولا يظهر في Router حدّ موحد أو Cursor Pagination للقوائم الحساسة. لوحة المعلومات تعرّف عدة مجموعات بيانات ثابتة، لذلك لا تكشف أداء الإنتاج الحقيقي. لا توجد أدلة كافية في التدقيق الحالي على Cache صحي Tenant-scoped أو Jobs للخلفية أو Retry/Idempotency للعمليات الخارجية.

كما أن اختبار Batch Processor فشل في إرجاع النتائج المتوقعة، وظهر Unhandled Error في اختبار تنظيف Cache. هذا يضعف الثقة في سلوك concurrency وcleanup.

**الحكم:** P2 — توجد مخاطر نمو غير مثبتة، ويجب إجراء Profiling ببيانات ممثلة قبل الإنتاج.

---

# 14. نتائج الاختبارات والتحقق

تم تشغيل الأوامر الموجودة في `package.json` دون تعديل المصدر.

| الفحص | النتيجة |
|---|---|
| `pnpm check` | فشل، exit code 2 |
| TypeScript diagnostics | أخطاء TS1127/TS1131/TS1002/TS1109/TS1128 في AdvancedSearch وExportManager وexternal-apis وcontact config وcontact routes، وغيرها |
| `pnpm test` | فشل، exit code 1 |
| Test files | 7 failed، 2 passed من أصل 9 |
| Tests | 26 failed، 65 passed، 17 skipped من أصل 108 |
| Unhandled errors | خطأ واحد على الأقل في اختبار Cache cleanup |
| Test mismatch | اختبارات Activity وAuth تستدعي Procedures غير موجودة في `appRouter` الحالي |
| Security behavior | اختبار Phone Service يقبل `123` رغم توقع الاختبار رفضه |
| Build | لم يُعتبر VERIFIED؛ Typecheck والاختبارات فاشلان، ولم تُجرَ عملية نشر |

أهم أسباب الفشل المرصودة: `No procedure found on path` في Activity وAuth، فشل concurrency في Cache، قبول رقم هاتف غير صالح، وUnhandled assertion أثناء cleanup. هذه نتائج اكتشاف وليست إصلاحات.

---

# 15. سجل المشكلات

## MERSAD-P0-001 — Login مخصص وهمي

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P0 — Critical |
| **CATEGORY** | Authentication / Fake Feature |
| **LOCATION** | `server/auth.routes.ts:133-159` |
| **PROBLEM** | Login لا يتحقق من كلمة المرور أو المستخدم ويعيد User ثابتًا و`mock-jwt-token`. |
| **ROOT CAUSE** | مسار مخصص غير موصول بمصدر مصادقة حقيقي. |
| **IMPACT** | إمكانية اعتبار أي بيانات صحيحة شكليًا تسجيل دخول، وتضارب مع Cookie JWT الفعلي. |
| **RECOMMENDED FIX** | إزالة Mock Login أو ربطه بمصدر مصادقة واحد موثق مع Session lifecycle واختبارات سلبية. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة الكود واختبارات Auth الفاشلة. |

## MERSAD-P0-002 — صلاحيات Admin ناقصة في التسجيلات

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P0 — Critical |
| **CATEGORY** | Authorization / Privilege Escalation |
| **LOCATION** | `server/auth.routes.ts:194-329` |
| **PROBLEM** | `getPendingRequests` و`approveRegistration` و`rejectRegistration` تستخدم `protectedProcedure` فقط، مع TODO صريح لفحص Admin. |
| **ROOT CAUSE** | غياب Policy server-side مخصصة لهذه العمليات. |
| **IMPACT** | مستخدم مصادق عليه قد يصل إلى عمليات إدارية حساسة. |
| **RECOMMENDED FIX** | فرض Permission/Role server-side، وربط الموافقة بTransaction وAudit. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة Routes؛ لم تُجرَ عملية هجومية على بيئة خارجية. |

## MERSAD-P0-003 — خطر Tenant/Relationship Injection في إنشاء القضايا

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P0 — Critical |
| **CATEGORY** | Multi-Tenancy / IDOR |
| **LOCATION** | `server/routers.ts:68-127` |
| **PROBLEM** | `clientId` و`matterId` و`lawyerId` تأتي من العميل دون إثبات ملكية العلاقات للمكتب الحالي قبل الإنشاء. |
| **ROOT CAUSE** | Validation يثبت النوع فقط ولا يثبت Tenant relationship. |
| **IMPACT** | احتمال ربط بيانات مكتب بموارد مكتب آخر أو تسريب سياق قانوني. |
| **RECOMMENDED FIX** | Queries ذرية Tenant-scoped لجميع الموارد المرتبطة قبل الكتابة مع اختبارات Firm A/B. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة Router وSchema؛ يحتاج اختبار تكاملي مع قاعدتي بيانات/بيانات Tenant. |

## MERSAD-P0-004 — ملكية الإشعارات غير مؤكدة عند التحديث

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P0 — Critical |
| **CATEGORY** | IDOR / Notifications |
| **LOCATION** | `server/routers.ts:235-245` |
| **PROBLEM** | `notifications.markAsRead` يمرر ID فقط إلى `markNotificationAsRead` ولا يمرر `ctx.user.id`. |
| **ROOT CAUSE** | Ownership check غير موجود في سطح Router. |
| **IMPACT** | احتمال تعديل حالة إشعار مستخدم آخر عند معرفة ID. |
| **RECOMMENDED FIX** | تحديث مشروط بـ`id AND userId` مع اختبار User A/User B. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة Router؛ لم يُنفذ اختبار هجومي جديد. |

## MERSAD-P1-001 — فشل TypeScript في ملفات مصدرية

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P1 — High |
| **CATEGORY** | Build / Code Integrity |
| **LOCATION** | `client/src/components/AdvancedSearch.tsx`، `ExportManager.tsx`، `client/src/lib/external-apis.ts`، `server/external-apis.service.ts`، `server/config/contact.config.ts`، `server/routes/contact.routes.ts` |
| **PROBLEM** | `pnpm check` يفشل بأخطاء parsing وInvalid character وUnterminated string. |
| **ROOT CAUSE** | ملفات غير صالحة نحويًا أو محتوى مُولّد/منسوخ غير صالح. |
| **IMPACT** | عدم إمكانية اعتبار المشروع Type-safe أو صالحًا للبناء. |
| **RECOMMENDED FIX** | تحليل كل ملف مع الحفاظ على السلوك المقصود ثم إعادة typecheck. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | `TYPECHECK_EXIT=2`. |

## MERSAD-P1-002 — اختبارات Router لا تطابق App Router

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P1 — High |
| **CATEGORY** | Testing / Integration |
| **LOCATION** | `server/*.test.ts` مقابل `server/routers.ts` |
| **PROBLEM** | اختبارات Activity وAuth تفشل بـ`No procedure found on path` لعمليات غير موجودة في Router المجمع. |
| **ROOT CAUSE** | Drift بين الاختبارات والمسارات الفعلية أو عدم تسجيل Routers. |
| **IMPACT** | الاختبارات لا تثبت السلوك، وقد تخفي غياب API فعلية. |
| **RECOMMENDED FIX** | توحيد Router composition ثم اختبار Contract فعلي، دون حذف الاختبارات لمجرد إسكات الفشل. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | 26 اختبارًا فاشلًا، مع فشل صريح لمسارات Activity/Auth. |

## MERSAD-P1-003 — Dashboard يعرض بيانات أعمال وهمية

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P1 — High |
| **CATEGORY** | Product Correctness / Fake Analytics |
| **LOCATION** | `client/src/pages/DashboardPage.tsx:61-100` |
| **PROBLEM** | KPIs ورسوم القضايا والإيرادات والنفقات ثابتة داخل `useMemo`. |
| **ROOT CAUSE** | UI مكتملة شكليًا دون APIs تحليلية حقيقية. |
| **IMPACT** | قرارات تشغيلية مبنية على أرقام غير حقيقية، واحتمال خلط بيانات Tenant. |
| **RECOMMENDED FIX** | APIs تحليلية Tenant-scoped مع تعريف واضح للفترة ومصدر كل KPI. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة المصدر؛ تعليقات `Mock data - replace with actual API calls`. |

## MERSAD-P1-004 — Approval لا ينفذ دورة إنشاء كاملة

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P1 — High |
| **CATEGORY** | Business Workflow / Data Integrity |
| **LOCATION** | `server/auth.routes.ts:242-253` |
| **PROBLEM** | المسار يولّد Identifier ويحدّث Status ويرسل Email، لكنه لا ينشئ Firm/User/Identifier فعليًا. |
| **ROOT CAUSE** | TODOs في مسار إنتاجي ظاهريًا. |
| **IMPACT** | نجاح شكلي دون حساب مستخدم أو مكتب قابل لتسجيل الدخول. |
| **RECOMMENDED FIX** | Transaction تشمل Firm وUser وIdentifier وRequest وAudit، ثم إرسال البريد بعد الالتزام. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | TODOs صريحة في المصدر. |

## MERSAD-P1-005 — حماية المستندات غير مثبتة

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P1 — High |
| **CATEGORY** | Document Security |
| **LOCATION** | `server/storage.ts` و`drizzle/schema.ts:219-237` |
| **PROBLEM** | طبقة النقل لا تفرض MIME/size/malware/ownership/tenant/audit، مع وجود URL و`isPublic`. |
| **ROOT CAUSE** | Storage helper مفصول عن Authorization وDocument policy. |
| **IMPACT** | احتمال كشف مستندات قانونية أو قبول ملفات ضارة أو روابط دائمة. |
| **RECOMMENDED FIX** | Private storage، Authorized download، Signed URL قصير، validation، scanning، audit. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة Storage وSchema؛ دورة Upload/Download الكاملة غير متحققة. |

## MERSAD-P2-001 — Branding قديم وثابت

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P2 — Medium |
| **CATEGORY** | Configuration / Product Identity |
| **LOCATION** | `server/config/contact.config.ts` و`package.json` |
| **PROBLEM** | ظهور `CasEngine` و`law-firm-management-app` وبيانات اتصال ثابتة، دون Admin-scoped branding. |
| **ROOT CAUSE** | Config source ثابتة بدل إعداد مركزي قابل للتدقيق. |
| **IMPACT** | عدم اتساق الهوية والرسائل والـMetadata. |
| **RECOMMENDED FIX** | Branding model موثق ومحدد النطاق مع Audit وCache invalidation. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة الملفات والبحث النصي في المستودع. |

## MERSAD-P2-002 — Pagination وDatabase failure semantics غير كافيين

| الحقل | التفاصيل |
|---|---|
| **SEVERITY** | P2 — Medium |
| **CATEGORY** | Performance / Reliability |
| **LOCATION** | `server/db.ts` وRouters القائمة |
| **PROBLEM** | Queries قائمة غير محدودة، وبعض فشل DB يتحول إلى `[]` أو `undefined`. |
| **ROOT CAUSE** | عدم وجود Repository contract موحد للصفحات والأخطاء. |
| **IMPACT** | نمو الذاكرة والحمولة، وخلط فشل النظام مع عدم وجود بيانات. |
| **RECOMMENDED FIX** | Cursor pagination، حدود قصوى، Error taxonomy، ومراقبة استعلامات. |
| **STATUS** | NOT FIXED BY REQUEST |
| **VERIFICATION** | قراءة دوال DB وRouter. |

---

# 16. الميزات غير المكتملة أو غير المثبتة

| الميزة | القيمة | الحالة الحالية | الأولوية |
|---|---|---|---|
| مصادقة Username/Password حقيقية | حماية الحسابات | Mock/متعارضة | P0 |
| Password reset وMFA وSession revocation | تقليل اختراق الحساب | غير مثبتة | P1 |
| Admin permission system | منع privilege escalation | جزئي | P0 |
| Tenant-safe universal search | تشغيل آمن | غير مثبت | P1 |
| Document lifecycle/versioning/scanning | حماية الأدلة والملفات | غير مكتمل | P0/P1 |
| Billing/Payments حقيقية | تشغيل مالي | Services Mock | P1 |
| Conflict checking | واجب مهني وتشغيلي | موجود في Schema فقط | P1 |
| Calendar/deadline jobs | منع فوات المواعيد | غير مثبت | P1 |
| Client portal | خدمة العميل | غير مثبت | P2 |
| Dynamic branding | هوية قابلة للإدارة | غير موجود | P2 |
| Observability/readiness/alerts | تشغيل إنتاجي | غير مثبت | P1 |
| Arabic normalization/OCR/PDF | Arabic-first حقيقي | غير مثبت بالكامل | P2 |
| AI with citations and human review | مساعدة غير ملزمة | غير مثبت | P3/P4 |

---

# 17. قواعد هندسية إلزامية للمراحل القادمة

1. لا تعتمد الواجهة على إخفاء الأزرار كآلية Authorization؛ كل قرار أمني Server-side.
2. كل Query لمورد حساس يجب أن تحمل Tenant Context صريحًا.
3. لا تُستخدم `getXById(id)` في مورد حساس دون Ownership/Tenant check.
4. كل ID قادم من العميل غير موثوق، وكذلك `lawFirmId` و`role` وFile metadata.
5. لا Mock Login ولا Fake Payment ولا Fake Analytics في مسار يمكن أن يراه المستخدم كحقيقي.
6. لا تُعتبر عملية مالية أو اعتماد تسجيل ناجحة دون Transaction وAudit وIdempotency حيث يلزم.
7. لا تُخزن الأسرار في Git ولا تُرسل Tokens حساسة إلى `localStorage` دون ضرورة مثبتة.
8. روابط الوثائق لا تمنح صلاحية؛ الصلاحية تُفحص أولًا ثم يُنشأ رابط مؤقت قصير العمر.
9. يجب أن تميز API بين `[]` كبيانات فارغة وبين Database failure.
10. أي Feature جديدة تحتاج اختبارًا سلبيًا للتفويض، واختبار Tenant A/B، واختبار بيانات غير صالحة.
11. لا يتم تغيير Dependency أو إزالة كود لمجرد الشكل؛ كل تغيير يجب أن يستند إلى حاجة مثبتة واختبارات.
12. لا يُعلن Production Ready قبل نجاح typecheck وbuild والاختبارات الحرجة واختبارات الأمن والعزل.

---

# 18. ترتيب الأولويات

| الأولوية | العمل المطلوب |
|---|---|
| P0 | توحيد مصدر المصادقة وإزالة Mock Login، فرض Admin authorization، واختبارات Tenant/IDOR للمصادر الحساسة، وحماية المستندات |
| P1 | إعادة اتساق Router والاختبارات، إصلاح سلامة TypeScript، تحويل Dashboard إلى بيانات حقيقية، إكمال Approval transaction، وإضافة Observability |
| P2 | Pagination وIndexes وError semantics وBranding مركزي وتجربة RTL/Arabic أعمق |
| P3 | تحسين UX، حالات الفراغ والخطأ، التقارير المتقدمة، وإدارة الأداء بعد قياس حقيقي |
| P4 | AI/OCR/Client Portal وتكاملات مستقبلية، بعد تثبيت الأمن وصحة البيانات |

---

# 19. قائمة جاهزية الإنتاج

| المتطلب | الحالة في خط الأساس |
|---|---|
| Typecheck ناجح | NO |
| Test suite موثوق | NO |
| Build verified | NO-GO بناءً على فشل Typecheck/Tests |
| Authentication موحد وحقيقي | NO |
| Password/session lifecycle | NOT VERIFIED |
| Authorization server-side كامل | NO |
| Tenant isolation tests | NO |
| Private document access | NOT VERIFIED |
| Financial operations real and auditable | NO |
| Real dashboard analytics | NO |
| Backups/restore drill | NOT VERIFIED |
| Health/readiness/alerts | NOT VERIFIED |
| Production secrets validation | NOT VERIFIED |
| Arabic-first acceptance tests | NO |
| No fake features | NO |

---

# 20. حالة التدقيق النهائية

هذه الوثيقة لا تدّعي أن المشكلات أُصلحت. تم تنفيذ **Discovery and Documentation Only**. الحالة الصحيحة للمشروع هي:

> **AUDITED BASELINE — NOT PRODUCTION READY — NO CODE REPAIRS PERFORMED**

الملف الوحيد الذي ينبغي أن يظهر كتغيير مقصود من هذه المهمة هو `MERSAD_ENGINEERING_CONSTITUTION.md`. يجب إجراء دورة لاحقة منفصلة للإصلاحات، مع موافقة صريحة على كل تغيير، ثم تشغيل الاختبارات وإعادة التدقيق.

---

# References

[1]: ./package.json "Project manifest and scripts"
[2]: ./server/_core/sdk.ts "Session creation and request authentication"
[3]: ./server/_core/trpc.ts "Protected and admin procedure definitions"
[4]: ./server/auth.routes.ts "Registration and custom authentication routes"
[5]: ./server/routers.ts "Application tRPC routers and Tenant checks"
[6]: ./server/db.ts "Database access functions"
[7]: ./drizzle/schema.ts "Drizzle schema and legal-domain entities"
[8]: ./server/storage.ts "Storage transport helper"
[9]: ./client/src/hooks/useAuth.ts "Frontend authentication hooks"
[10]: ./client/src/pages/DashboardPage.tsx "Dashboard statistics and chart data"
[11]: ./server/external-apis.service.ts "External-service placeholders and adapters"
[12]: ./server/config/contact.config.ts "Static product/contact branding configuration"
[13]: ./server/activity.test.ts "Activity route tests"
[14]: ./server/auth.test.ts "Authentication route tests"
[15]: ./server/cache.test.ts "Cache and concurrency tests"
[16]: ./server/security.test.ts "Security service tests"
[17]: https://github.com/ossamaamr/law-firm-management "Target repository"

---

## سجل التغييرات

| الإصدار | التغيير |
|---|---|
| 1.0 | إنشاء وثيقة الحالة الأساسية بعد التدقيق، دون إصلاح أو تعديل كود التطبيق |


# 21. ملحق حالة التنفيذ — 2026-08-19

هذا الملحق يحدّث الحالة التنفيذية بعد دورة الإصلاحات اللاحقة، ولا يلغي سجل التدقيق التاريخي في الأقسام السابقة. كانت عبارة **AUDITED BASELINE — NOT PRODUCTION READY — NO CODE REPAIRS PERFORMED** صحيحة عند إنشاء التدقيق الأول، لكنها لم تعد تصف حالة المستودع الحالي بعد تنفيذ الإصلاحات الموثقة في `MERSAD_MILESTONE_REPORT.md`.

| محور الدستور | الحالة الحالية |
|---|---|
| مصدر المصادقة الموحد | منفذ: OAuth cookie وtRPC، مع إزالة عقود المصادقة القديمة وlocalStorage tokens |
| Authorization وعزل المؤسسة | منفذ على المسارات الحساسة التي تمت مراجعتها، مع اختبارات IDOR وTenant |
| حماية المستندات | منفذة للرفع والتحقق والتخزين وروابط التنزيل الموقعة |
| Branding وAdmin Control Center | منفذان على نطاق المكتب مع التدقيق والصلاحيات الأساسية |
| الدعوات وطلبات الانضمام | منفذة مع token hash ومطابقة البريد والموافقة والإلغاء والتدقيق |
| Dashboard وReadiness | منفذان ببيانات حقيقية أساسية ومسارات liveness/readiness |
| Session revocation | منفذ للجلسات الجديدة التي تحمل `jti` عبر migration `0006` |
| Pagination وDatabase failure semantics | منفذة حاليًا في قوائم `cases` و`clients` بحد أقصى 100 وتمييز فشل DB عن القائمة الفارغة |
| الاختبارات | 122 اختبارًا ناجحًا محليًا، و151/151 في دورة MySQL المعزولة السابقة |
| الجاهزية الإنتاجية الكاملة | غير مكتملة: ما زالت MFA، النسخ والاستعادة، التنبيهات، البحث الشامل، دورة المستندات المتقدمة، Billing، Calendar jobs، Client Portal، وArabic OCR/PDF بحاجة إلى تنفيذ أو إثبات |

**نسبة التقدم التنفيذية المحافظة:** تجاوز المشروع 50% من خارطة الدستور، ويُقدّر حاليًا بنحو **60%** بعد إضافة Session Revocation وPagination وDatabase failure semantics. هذه النسبة لا تعني Production Ready؛ فهي تقيس البنود المنفذة أو المنفذة جزئيًا فقط، ولا تمنح البنود غير المثبتة وزنًا كاملًا.

> **قاعدة الاستمرار:** لا يُعلن MERSAD جاهزًا للإنتاج قبل تطبيق migrations رسميًا، وتشغيل اختبارات MySQL المعزولة على البيئة المعتمدة، وإكمال البنود الحرجة المتبقية والتحقق من الأسرار والنسخ والاستعادة والتنبيهات.

---



# 22. ملحق FINAL 90%+ GATE — 2026-08-19

تم تنفيذ تعليمات مصفوفة remediation على المستودع الفعلي، لا على المصفوفة وحدها. أضيفت دورة حياة المستندات بإصدار وسلسلة `previousVersionId` وSHA-256 وحالة `scanStatus` و`retentionUntil` وفهارسها عبر migration `0009_tidy_ben_parker.sql`. أضيف حد تنزيل لا يصدر رابطًا للمستند pending أو quarantined أو المنتهي، وحد scanner خارجي fail-safe لا يدعي نتيجة نظيفة عند غياب المزود.

اكتملت تحسينات Universal Search بإدخال نافذة جلب محدودة، pagination مستقرة، وترتيب exact/prefix، مع استمرار `lawFirmId` و`isDeleted` في الاستعلام. وأضيفت حدود قصوى للقوائم الداخلية غير المحدودة. كما أضيفت خدمة `deadline.service.ts` التي تنفذ warning window للجلسات، وتستخدم claim ذريًا عبر `notificationSent` لمنع التذكيرات المكررة عند تشغيل workers متزامنين، مع اختبار idempotency.

أضيف runbook رسمي للنسخ والتحقق والاستعادة في `docs/MERSAD_BACKUP_RESTORE_RUNBOOK.md`. لا يُحتسب اختبار restore الإنتاجي منفذًا دون بيئة معتمدة، ولا تُخزن الأسرار في المستودع. كما أضيفت Arabic normalization واختبارات لها، مع إبقاء OCR/PDF الخارجي غير مدّعى وغير منفذ عند غياب مزود.

| البند | الحالة بعد FINAL GATE |
|---|---|
| P0 authentication/authorization/tenant/document baseline | VERIFIED ومختبر |
| Document lifecycle | repository architecture منفذة؛ scanner الخارجي BLOCKED فقط |
| Observability | health/readiness/request IDs منفذة؛ alerts الخارجية نقطة تكامل غير مفعلة |
| Database integrity | migrations وفهارس وapproval transaction منفذة؛ تدقيق FK الإنتاجي الشامل يحتاج قاعدة معتمدة |
| Universal Search | tenant-scoped، محدود، ranked، pagination، ومختبر عقديًا |
| Backup/restore | runbook والتحقق البرمجي منفذان؛ production drill BLOCKED بالبيئة |
| Pagination | cases/clients/search كاملة، والقوائم الداخلية capped عند 100 |
| Deadline engine | service وclaim/idempotency tests منفذة؛ scheduler production binding مطلوب |
| Client Portal | BLOCKED عمدًا حتى اعتماد client identity ونطاق البيانات |
| Arabic/RTL | normalization منفذة؛ OCR/PDF والقبول البصري الخارجي BLOCKED |
| MFA/password reset | BLOCKED بسبب capabilities الهوية؛ لم يُدخل password system محلي غير آمن |
| AI | NOT STARTED، خارج أولوية الإصلاح الأمني |

بوابات القبول الأخيرة ناجحة: `pnpm check`، و`pnpm test` بنتيجة **132 اختبارًا ناجحًا و30 متخطيًا** لغياب `DATABASE_URL`، و`pnpm build`، و`git diff --check`. وفق تعريف المصفوفة المحافظ، أصبحت **22 من 24 finding = 91.67%** VERIFIED/IMPLEMENTED أو BLOCKED بشكل مشروع. لا يُعلن هذا Production Ready قبل تطبيق migrations في بيئة معتمدة، وتشغيل MySQL integration وrestore drill، وتوفير scanner/OCR/alerts/identity capabilities المطلوبة.

## 23. ملحق التدقيق الجنائي النهائي — 2026-08-19

### قرار الإطلاق

بعد تدقيق جنائي مستقل للمستودع كاملًا، لا تُعد منصة MERSAD جاهزة للإطلاق على بيانات محاماة أو عملاء حقيقية. التصنيف الإلزامي الحالي هو:

> **NOT READY — ممنوع الإطلاق قبل إغلاق Findings الأمنية P1/High وإثبات قاعدة البيانات والإعدادات الإنتاجية باختبارات فعلية.**

نجاح `pnpm check` و`pnpm test` و`pnpm build` لا يثبت غياب الثغرات، ولا يثبت سلامة MySQL/MariaDB، ولا يعوض اختبار اختراق مستقل.

### Findings الأمنية الجديدة

| ID | الخطورة | finding | الدليل | شرط الإغلاق |
|---|---|---|---|---|
| F-001 | Critical/High | غياب CSRF وOrigin validation على Cookie-authenticated mutations، خصوصًا multipart branding/document upload | `server/_core/index.ts`, `server/_core/cookies.ts`, `client/src/main.tsx`, `server/branding-upload.routes.ts`, `server/document-upload.routes.ts` | CSRF token مرتبط بالجلسة أو Origin allow-list موثوقة، مع browser tests لكل tRPC وmultipart mutation |
| F-002 | High | OAuth callback لا يثبت `state/nonce` server-side مرتبطًا بطلب بدء الدخول | `server/_core/oauth.ts` | state/nonce عشوائي قصير العمر، request-bound، وredirect URI allow-list ثابت |
| F-003 | High | كتابة `meQuery.data` إلى `localStorage` وعدم مسحه في logout | `client/src/_core/hooks/useAuth.ts` | إزالة تخزين user/session data من browser storage ومراجعة كل storage |
| F-004 | High | عمليات حساسة محمية بـ`lawFirmProcedure` دون least-privilege role policy | `server/routers.ts`, `server/_core/trpc.ts` | policy server-side لكل role على update/delete/KYC/download، مع اختبارات denial |
| F-005 | High | Activity export وقراءة activity التفصيلية متاحة لكل عضو مكتب | `server/activity.routes.ts` | قصرها على admin/manager أو policy موثقة، redaction، pagination، وحد أقصى آمن |
| F-006 | High | IP audit يعتمد على `x-forwarded-for` غير موثق كمصدر موثوق | routers/routes متعددة | trusted proxy configuration واستخراج server-side موثق |
| F-007 | High | CSV export لا يهرب quotes/CRLF ولا يمنع formula injection | `server/activity.service.ts` | RFC-compliant escaping وneutralization للقيم الخطرة واختبار Excel-compatible |
| F-008 | High | فشل audit لا يفشل العملية ولا يوجد durable outbox/transaction coupling | `server/activity.service.ts` | transactional outbox أو transaction ذرية، وسياسة fail-closed للأفعال الحساسة |
| F-009 | High | migrations وorphan preflight لم تُثبت على MySQL/MariaDB حقيقية؛ 30 اختبارًا متخطٍ | `drizzle.config.ts`, test output | قاعدة اختبارية معتمدة، preflight = zero، migrations من الصفر والترقية، وكل الاختبارات ناجحة |
| F-010 | High | ledger بلا FKs مالية كاملة ولا transaction تسوية invoice/duePayment/ledger | `drizzle/schema.ts`, ledger router/db | FKs وcross-tenant integrity، state machine وتسوية ذرية واختبارات concurrent |
| F-011 | Medium/High | notification/activity policy غير موحدة مع حساسية البيانات | notification/activity routes | مصفوفة صلاحيات موحدة حسب نوع البيانات |

### Findings قاعدة البيانات والتشغيل

أضيفت الملاحظات التالية إلى بوابة قاعدة البيانات: جداول `projects`, `courtSessions`, `tasks`, `timesheets`, `expenses`, `duePayments`, `invoices`, و`legalServiceRequests` تحتوي علاقات معرفات لا تملك كلها FKs كاملة؛ أرقام `matterNumber/caseNumber/projectNumber/invoiceNumber` فريدة على مستوى الجدول بدل uniqueness مركب مع `lawFirmId`؛ بعض دوال DB تخلط outage مع no-data بإرجاع `[]/undefined/null`؛ بعض استعلامات audit لا تحمل `lawFirmId` إلى طبقة البيانات؛ وتحديثات الموارد تعتمد في بعض المواضع على فحص Router قبل الكتابة بدل tenant-qualified update ذري.

تم تسجيل أن `ledgerEntries` الحالي append-only وidempotent، لكنه لا يحتوي FKs كاملة لـ`matterId/invoiceId/duePaymentId/createdById`، ولا يربط انتقالات invoice/duePayment والتحصيل الحقيقي في transaction واحدة. لذلك P1-007 ليس مكتملًا ماليًا رغم وجود ledger داخلي.

### Findings runtime والواجهة والاعتماديات

لا توجد في bootstrap الرئيسي حماية صريحة كافية لـsecurity headers وCORS وrate limiting وOrigin policy وroute-specific body limits. JWT طويل الأجل ويحتاج مراجعة rotation/idle timeout/session inventory. يحتوي `server/security.service.ts` كودًا قديمًا غير صالح للاستخدام المحلي: PBKDF2 منخفض التكلفة ومقارنة غير constant-time وAES-CBC بمفتاح padded/قد يكون فارغًا ودون authentication tag؛ يجب حذفه أو إصلاحه قبل أي local-password feature.

يوجد bootstrap بديل `server/index.ts` يختلف عن `_core/index.ts` ويحتوي credentialed CORS stub و`/api/test-email` public، ما يثبت runtime drift يجب حسمه أو حذفه. توجد أيضًا صفحات dead/demo مثل `AdminApprovalPage.tsx` التي تستخدم `mockRequests` و`setTimeout` بدل API، و`DashboardLayout.tsx` الذي يحتوي `Page 1`, `Page 2`, و`/some-path`. هي ليست routes حالية وفق `client/src/App.tsx` لكنها خطر regression وخداع عند إعادة الربط.

لا تزال dependency audit تُظهر 6 High advisories ضمن 45 advisory إجماليًا، ولا يجوز إعلان Production Ready قبل إزالتها أو اعتماد mitigation موثقًا. كما أن Client Portal وMFA/Password Reset وArabic OCR/PDF وrestore drill وproduction scheduler وscanner الخارجي غير مكتملة.

### بوابة منع الإطلاق

لا يجوز رفع التصنيف إلى `RELEASE CANDIDATE` قبل إغلاق F-001 وF-002 وF-004 وF-005 وF-008 وF-009 وF-010، ثم إجراء اختبار اختراق خارجي. ولا يجوز إعلان `PRODUCTION READY` قبل اختبار Firm A/Firm B على قاعدة حقيقية، scanner معتمد، restore drill، مراجعة proxy/TLS/headers، معالجة High advisories، ومراجعة مستقلة لإدارة بيانات العملاء.

مرجع التقرير التفصيلي: `docs/MERSAD_FINAL_FORENSIC_AUDIT.md`.

## 24. القسم الأول من خطة الإطلاق — محيط المصادقة والطلبات — 2026-08-19

اكتمل تنفيذ القسم الأول داخل الكود مع اختبارات قابلة لإعادة التشغيل. أضيفت طبقة `server/_core/request-security.ts` التي تصدر CSRF double-submit cookie، وتتحقق من `Origin` أو `Referer` مقابل `PUBLIC_APP_ORIGIN`، وتستخدم مقارنة ثابتة الزمن، وتطبق security headers وrate limiting محدودًا على `/api`. رُكبت الطبقة قبل OAuth ورفع الملفات وtRPC في `server/_core/index.ts`.

أعيد بناء OAuth ليستخدم `/api/oauth/start` لتوليد nonce server-side قصير العمر داخل Cookie HttpOnly، وstate مركبًا يثبت redirect URI. يتحقق callback من nonce وredirect URI قبل أي token exchange، ويُمسح state cookie بعد النجاح أو الفشل. أضيفت متطلبات `PUBLIC_APP_ORIGIN` و`VITE_OAUTH_PORTAL_URL` إلى fail-fast production validation، وأزيل إنشاء state من المتصفح.

أزيل تخزين user/session object في `localStorage` من `useAuth`، وحُذف `server/index.ts` لأنه bootstrap بديل غير مستخدم يحتوي surface غير محمي. تمت إضافة اختبارات CSRF/Origin وOAuth state/nonce، ونجحت بوابات القسم: `pnpm check`، و21 اختبارًا مركّزًا، ثم مجموعة المشروع الكاملة **144 اختبارًا ناجحًا و30 متخطيًا**، و`pnpm build`.

لا يغلق هذا القسم جميع بوابات الإنتاج؛ ما زالت F-004 وF-005 وF-008 وF-009 وF-010 وغيرها مفتوحة، كما أن `pnpm audit --audit-level=high` يحتاج معالجة منفصلة. لا يجوز تغيير التصنيف إلى Production Ready بسبب إغلاق محيط الطلبات وحده.

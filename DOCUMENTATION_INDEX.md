# فهرس التوثيق - CasEngine

دليل شامل لجميع وثائق المشروع

## 📚 الوثائق الرئيسية

### 1. **[README.md](./README.md)** - نظرة عامة على المشروع
   - المميزات الرئيسية
   - المتطلبات والتثبيت
   - هيكل المشروع
   - جداول قاعدة البيانات
   - الأمان والأداء

### 2. **[QUICKSTART.md](./QUICKSTART.md)** - دليل البدء السريع
   - البدء في 5 دقائق
   - المتطلبات الأساسية
   - الأوامر المهمة
   - استكشاف الأخطاء

### 3. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - ملخص المشروع
   - إحصائيات المشروع
   - قائمة الميزات المكتملة
   - الاختبارات والأداء
   - الخطط المستقبلية

### 4. **[API_DOCS.md](./API_DOCS.md)** - توثيق API
   - المصادقة والتحكم بالوصول
   - إدارة القضايا
   - إدارة الموكلين
   - إدارة الفواتير
   - الأنشطة والتقارير
   - رموز الخطأ

### 5. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - دليل النشر
   - متطلبات النشر
   - خطوات النشر
   - النشر مع Docker
   - النشر على Manus
   - الأمان والمراقبة

### 6. **[TESTING.md](./TESTING.md)** - دليل الاختبار
   - أنواع الاختبارات
   - كتابة الاختبارات
   - تغطية الاختبارات
   - اختبارات الأمان
   - اختبارات الأداء

## 🗂️ هيكل الملفات

```
law-firm-management/
├── README.md                  # نظرة عامة
├── QUICKSTART.md             # البدء السريع
├── PROJECT_SUMMARY.md        # ملخص المشروع
├── API_DOCS.md               # توثيق API
├── DEPLOYMENT.md             # دليل النشر
├── TESTING.md                # دليل الاختبار
├── DOCUMENTATION_INDEX.md    # هذا الملف
│
├── client/
│   ├── README.md             # توثيق Frontend
│   └── src/
│       ├── pages/            # صفحات التطبيق
│       ├── components/       # مكونات React
│       └── lib/              # مكتبات مساعدة
│
├── server/
│   ├── README.md             # توثيق Backend
│   ├── routers.ts            # مسارات tRPC
│   └── db.ts                 # قاعدة البيانات
│
└── drizzle/
    └── schema.ts             # مخطط قاعدة البيانات
```

## 🎯 دليل الاستخدام حسب الدور

### للمطورين الجدد
1. اقرأ [QUICKSTART.md](./QUICKSTART.md)
2. اقرأ [README.md](./README.md)
3. استكشف [client/src/](./client/src/)

### لمهندسي الأمان
1. اقرأ [DEPLOYMENT.md](./DEPLOYMENT.md) - قسم الأمان
2. اقرأ [TESTING.md](./TESTING.md) - اختبارات الأمان
3. راجع `server/security.service.ts`

### لمهندسي الأداء
1. اقرأ [TESTING.md](./TESTING.md) - اختبارات الأداء
2. اقرأ [DEPLOYMENT.md](./DEPLOYMENT.md) - قسم الأداء
3. راجع `server/cache.service.ts`

### لمطوري API
1. اقرأ [API_DOCS.md](./API_DOCS.md)
2. راجع `server/routers.ts`
3. اختبر مع Postman أو curl

### لمديري النشر
1. اقرأ [DEPLOYMENT.md](./DEPLOYMENT.md)
2. اقرأ [QUICKSTART.md](./QUICKSTART.md) - قسم الإنتاج
3. راجع `docker-compose.yml`

## 📖 المواضيع الرئيسية

### المصادقة والأمان
- [README.md - الأمان](./README.md#-الأمان)
- [DEPLOYMENT.md - الأمان في الإنتاج](./DEPLOYMENT.md#-الأمان-في-الإنتاج)
- [TESTING.md - اختبارات الأمان](./TESTING.md#-اختبارات-الأمان-المهمة)

### قاعدة البيانات
- [README.md - جداول قاعدة البيانات](./README.md#-جداول-قاعدة-البيانات)
- [DEPLOYMENT.md - إعداد قاعدة البيانات](./DEPLOYMENT.md#-إعداد-قاعدة-البيانات)

### API والتكامل
- [API_DOCS.md](./API_DOCS.md)
- [README.md - LLM Integration](./README.md#-llm-integration)

### الاختبار والجودة
- [TESTING.md](./TESTING.md)
- [PROJECT_SUMMARY.md - الاختبارات](./PROJECT_SUMMARY.md#-الاختبارات)

### النشر والإنتاج
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [QUICKSTART.md - الإنتاج](./QUICKSTART.md#-الإنتاج)

## 🔗 روابط سريعة

### التوثيق الخارجية
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [tRPC Documentation](https://trpc.io/)

### الأدوات والخدمات
- [GitHub Repository](https://github.com/ossamaamr/law-firm-management)
- [Manus Platform](https://manus.im)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 📝 نصائح مهمة

### قبل البدء
- [ ] اقرأ [QUICKSTART.md](./QUICKSTART.md)
- [ ] تثبيت جميع المتطلبات
- [ ] إعداد قاعدة البيانات
- [ ] تشغيل الاختبارات

### أثناء التطوير
- [ ] اتبع معايير الكود
- [ ] اكتب اختبارات للميزات الجديدة
- [ ] وثّق التغييرات
- [ ] اختبر على أجهزة مختلفة

### قبل النشر
- [ ] تشغيل جميع الاختبارات
- [ ] التحقق من الأداء
- [ ] مراجعة الأمان
- [ ] إنشاء نسخة احتياطية

## 🆘 الحصول على المساعدة

### البحث عن حل
1. ابحث في [الأسئلة الشائعة](./FAQ.md)
2. ابحث في [GitHub Issues](https://github.com/ossamaamr/law-firm-management/issues)
3. اقرأ الوثائق ذات الصلة

### الإبلاغ عن مشكلة
1. افتح [GitHub Issue](https://github.com/ossamaamr/law-firm-management/issues/new)
2. وصف المشكلة بوضوح
3. أرفق سجلات الأخطاء
4. اذكر إصدار Node.js والنظام

### طلب ميزة جديدة
1. افتح [GitHub Discussion](https://github.com/ossamaamr/law-firm-management/discussions)
2. اشرح الميزة المطلوبة
3. اشرح الفائدة المتوقعة

## 📊 إحصائيات التوثيق

- **عدد ملفات التوثيق**: 7
- **عدد أسطر التوثيق**: 3000+
- **عدد الأمثلة**: 50+
- **عدد الروابط**: 100+

## 🔄 آخر التحديثات

- **آخر تحديث**: فبراير 2026
- **الإصدار**: 1.0.0
- **الحالة**: ✅ جاهز للإنتاج

---

**ملاحظة**: جميع الوثائق محدثة وتعكس الحالة الحالية للمشروع.

**استمتع بالتطوير! 🚀**

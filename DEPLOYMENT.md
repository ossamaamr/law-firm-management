# دليل النشر - CasEngine

دليل شامل لنشر نظام إدارة مكتب المحاماة على بيئات مختلفة.

## 📋 متطلبات النشر

### المتطلبات الأساسية
- Node.js 18+ مثبت
- npm أو pnpm
- قاعدة بيانات PostgreSQL
- متصفح حديث

### متطلبات الخادم
- 2GB RAM كحد أدنى
- 10GB مساحة تخزين
- اتصال إنترنت مستقر
- SSL/TLS certificate

## 🚀 خطوات النشر

### 1. التحضير

```bash
# استنساخ المستودع
git clone https://github.com/ossamaamr/law-firm-management.git
cd law-firm-management

# تثبيت الاعتماديات
pnpm install

# بناء التطبيق
pnpm build
```

### 2. إعداد متغيرات البيئة

```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل المتغيرات
nano .env
```

#### متغيرات البيئة المطلوبة

```env
# قاعدة البيانات
DATABASE_URL=postgresql://user:password@localhost:5432/law_firm

# المصادقة
JWT_SECRET=your-secret-key-here
OAUTH_SERVER_URL=https://api.manus.im

# البريد الإلكتروني
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# التطبيق
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=نظام إدارة مكتب المحاماة
VITE_APP_ID=your-app-id

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
```

### 3. إعداد قاعدة البيانات

```bash
# تشغيل الهجرات
pnpm db:push

# (اختياري) ملء البيانات الأولية
pnpm db:seed
```

### 4. التشغيل

#### في بيئة التطوير
```bash
pnpm dev
```

#### في بيئة الإنتاج
```bash
# بناء التطبيق
pnpm build

# تشغيل الخادم
NODE_ENV=production node dist/server.js
```

## 🐳 النشر باستخدام Docker

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# تثبيت pnpm
RUN npm install -g pnpm

# نسخ ملفات المشروع
COPY package.json pnpm-lock.yaml ./

# تثبيت الاعتماديات
RUN pnpm install --frozen-lockfile

# نسخ باقي الملفات
COPY . .

# بناء التطبيق
RUN pnpm build

# تعريض المنفذ
EXPOSE 3000

# تشغيل التطبيق
CMD ["node", "dist/server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/law_firm
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: law_firm
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### تشغيل مع Docker

```bash
# بناء الصورة
docker build -t law-firm-app .

# تشغيل الحاوية
docker run -p 3000:3000 --env-file .env law-firm-app

# أو باستخدام docker-compose
docker-compose up -d
```

## 🌐 النشر على Manus

### الخطوات

1. **إنشاء حساب Manus**
   - زيارة https://manus.im
   - إنشاء حساب جديد

2. **ربط المستودع**
   - في لوحة التحكم، اختر "New Project"
   - اختر "Connect GitHub Repository"
   - اختر مستودع law-firm-management

3. **إعداد المتغيرات**
   - في إعدادات المشروع، أضف متغيرات البيئة
   - تأكد من إضافة DATABASE_URL و JWT_SECRET

4. **النشر**
   - انقر على زر "Deploy"
   - انتظر اكتمال النشر
   - التطبيق سيكون متاحاً على الرابط المعطى

## 🔒 الأمان في الإنتاج

### 1. HTTPS/SSL
```bash
# استخدام Let's Encrypt
sudo certbot certonly --standalone -d yourdomain.com
```

### 2. متغيرات البيئة الآمنة
- لا تضع المتغيرات الحساسة في الكود
- استخدم خدمة إدارة المتغيرات
- استخدم .env.local للبيانات الحساسة

### 3. قاعدة البيانات
- استخدم كلمات مرور قوية
- فعّل SSL للاتصال
- عمل نسخ احتياطية منتظمة

### 4. الجدران الناري
- قيّد الوصول للمنفذ 3000
- استخدم Reverse Proxy (Nginx/Apache)
- فعّل Rate Limiting

## 📊 المراقبة والصيانة

### Logs
```bash
# عرض السجلات
pm2 logs law-firm-app

# حفظ السجلات
pm2 logs law-firm-app > logs.txt
```

### النسخ الاحتياطية
```bash
# نسخ احتياطية من قاعدة البيانات
pg_dump law_firm > backup_$(date +%Y%m%d).sql

# استعادة من نسخة احتياطية
psql law_firm < backup_20240101.sql
```

### التحديثات
```bash
# سحب التحديثات
git pull origin main

# تثبيت الاعتماديات الجديدة
pnpm install

# تشغيل الهجرات
pnpm db:push

# إعادة تشغيل التطبيق
pm2 restart law-firm-app
```

## 🚨 استكشاف الأخطاء

### المشكلة: "Connection refused"
```bash
# تحقق من تشغيل قاعدة البيانات
sudo systemctl status postgresql

# أعد تشغيل قاعدة البيانات
sudo systemctl restart postgresql
```

### المشكلة: "Port already in use"
```bash
# ابحث عن العملية المستخدمة للمنفذ
lsof -i :3000

# أوقف العملية
kill -9 <PID>
```

### المشكلة: "Out of memory"
```bash
# زد حجم الذاكرة المخصصة
NODE_OPTIONS=--max-old-space-size=4096 node dist/server.js
```

## 📈 الأداء والتحسينات

### 1. استخدام CDN
- استخدم CloudFlare أو Cloudinary للملفات الثابتة
- ضع الصور والملفات على CDN

### 2. التخزين المؤقت
- فعّل caching في Nginx
- استخدم Redis للجلسات

### 3. قاعدة البيانات
- أنشئ فهارس للاستعلامات الشائعة
- استخدم connection pooling

### 4. الضغط
```nginx
# في nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 🔄 التكامل المستمر

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - name: Deploy
        run: |
          # أضف أوامر النشر هنا
```

## 📞 الدعم والمساعدة

للمساعدة في النشر:
1. تحقق من السجلات
2. اطلب المساعدة من فريق Manus
3. افتح issue على GitHub

---

**آخر تحديث**: فبراير 2026

**الإصدار**: 1.0.0

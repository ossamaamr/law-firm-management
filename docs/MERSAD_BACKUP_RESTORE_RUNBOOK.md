# MERSAD — Backup and Restore Runbook

هذا الإجراء هو مسار المستودع الرسمي للنسخ والاستعادة. لا تُحفظ بيانات الاعتماد داخل المستودع، ولا يُعد نجاح أمر النسخ دليلًا على قابلية الاستعادة حتى ينجح التحقق المرحلي والاستعادة التجريبية.

## المتطلبات

يجب توفير `DATABASE_URL` بصيغة MySQL/MariaDB، وأداة `mysqldump`، وأداة `mysql`، ومخزن نسخ خارجي معتمد بسياسة احتفاظ ومنع حذف عرضي. يجب تشغيل الإجراء بحساب مخصص أقل صلاحية ممكنة، مع منع تسجيل قيمة `DATABASE_URL` أو محتويات النسخة في السجلات.

## إنشاء نسخة مشفرة ومتحقق منها

```bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=./backups}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP="$BACKUP_DIR/mersad-$STAMP.sql"
ARCHIVE="$DUMP.gz.enc"

mysqldump --single-transaction --routines --triggers --events --hex-blob "$DATABASE_URL" > "$DUMP"
test -s "$DUMP"
sha256sum "$DUMP" > "$DUMP.sha256"
gzip -c "$DUMP" | openssl enc -aes-256-gcm -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE > "$ARCHIVE"
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
rm -f "$DUMP"
```

يجب رفع ملف النسخة وملفي checksum إلى مخزن خارجي مع versioning وretention lock. لا تُرسل النسخ إلى مستودع Git ولا تُدرج في artifacts العامة.

## تحقق النسخة

```bash
sha256sum --check mersad-<timestamp>.sql.gz.enc.sha256
openssl enc -d -aes-256-gcm -pbkdf2 -iter 200000 \
  -pass env:BACKUP_PASSPHRASE \
  -in mersad-<timestamp>.sql.gz.enc | gzip -d > restore-check.sql
test -s restore-check.sql
mysql --protocol=TCP --host="$RESTORE_HOST" --user="$RESTORE_USER" \
  --password="$RESTORE_PASSWORD" "$RESTORE_DATABASE" < restore-check.sql
```

يجب تنفيذ الاستعادة في قاعدة بيانات معزولة لا تتصل ببيانات الإنتاج. يتحقق فريق التشغيل من وجود الجداول، وعدد migrations، وسجلات عينة غير حساسة، ثم يحذف قاعدة الاختبار وفق سياسة البيانات.

## الاستعادة الطارئة

يُعلن incident ونافذة التوقف قبل الاستعادة. تُحفظ نسخة من الحالة الحالية إن أمكن، ثم تُستعاد النسخة الأقرب التي نجحت checksum والتحقق المرحلي. بعد الاستعادة يجب تطبيق migrations بالترتيب، وتشغيل `pnpm check` و`pnpm test` و`pnpm build`، وفحص `/health/ready`، ثم اختبار تسجيل الدخول والعزل بين مكتبين قبل إعادة المرور للمستخدمين.

## مؤشرات RPO/RTO وسجل التدقيق

يجب أن يسجل التشغيل وقت بدء النسخ، وقت انتهائه، checksum، حجم النسخة، نتيجة الرفع، ونتيجة آخر restore drill دون تسجيل أسرار أو محتوى قانوني. قيمة RPO وRTO الفعلية تعتمد على البيئة المعتمدة؛ لا تُعلن كأرقام إنتاجية قبل تنفيذ drill موثق. غياب بيئة تخزين واستعادة معتمدة يبقي اختبار التشغيل الإنتاجي **BLOCKED**، لكنه لا يلغي هذا الإجراء.

# توثيق API - CasEngine

توثيق شاملة لجميع نقاط نهاية API في نظام إدارة مكتب المحاماة.

## 🔐 المصادقة

جميع الطلبات تتطلب رمز JWT في رأس الطلب:

```bash
Authorization: Bearer <JWT_TOKEN>
```

### الحصول على رمز JWT

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "@firmName#",
  "username": "username",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "lawyer"
  }
}
```

## 👤 إدارة المستخدمين

### التسجيل الجديد

```http
POST /api/auth/signup
Content-Type: application/json

{
  "identifier": "@firmName#",
  "name": "User Name",
  "email": "user@example.com",
  "phone": "+966501234567",
  "password": "SecurePassword123!",
  "firmName": "مكتب المحاماة",
  "firmAddress": "العنوان"
}

Response: 201 Created
{
  "message": "تم إرسال طلب التسجيل بنجاح",
  "registrationId": "reg-id"
}
```

### التحقق من معرّف الشركة

```http
GET /api/auth/verify-identifier?identifier=@firmName#

Response: 200 OK
{
  "available": true,
  "message": "المعرّف متاح"
}
```

### تسجيل الدخول

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "@firmName#",
  "username": "username",
  "password": "password"
}

Response: 200 OK
{
  "token": "JWT_TOKEN",
  "user": { ... }
}
```

### تسجيل الخروج

```http
POST /api/auth/logout
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "message": "تم تسجيل الخروج بنجاح"
}
```

## 📋 إدارة القضايا

### الحصول على جميع القضايا

```http
GET /api/cases?status=open&priority=high&page=1&limit=10
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    {
      "id": "case-id",
      "caseNumber": "2024-001",
      "title": "قضية الملكية العقارية",
      "status": "open",
      "priority": "high",
      "clientId": "client-id",
      "lawyerId": "lawyer-id",
      "createdDate": "2024-01-15T10:00:00Z",
      "updatedDate": "2024-06-20T15:30:00Z"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}
```

### الحصول على قضية واحدة

```http
GET /api/cases/:caseId
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "id": "case-id",
  "caseNumber": "2024-001",
  "title": "قضية الملكية العقارية",
  "description": "نزاع حول ملكية عقار سكني",
  "status": "open",
  "priority": "high",
  "client": { ... },
  "lawyer": { ... },
  "sessions": [ ... ],
  "documents": [ ... ]
}
```

### إنشاء قضية جديدة

```http
POST /api/cases
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "caseNumber": "2024-001",
  "title": "قضية الملكية العقارية",
  "description": "نزاع حول ملكية عقار سكني",
  "type": "عقاري",
  "status": "open",
  "priority": "high",
  "clientId": "client-id",
  "lawyerId": "lawyer-id"
}

Response: 201 Created
{
  "id": "case-id",
  "caseNumber": "2024-001",
  ...
}
```

### تحديث قضية

```http
PUT /api/cases/:caseId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "قضية الملكية العقارية - محدثة",
  "status": "closed",
  "priority": "medium"
}

Response: 200 OK
{ ... }
```

### حذف قضية

```http
DELETE /api/cases/:caseId
Authorization: Bearer <JWT_TOKEN>

Response: 204 No Content
```

## 👥 إدارة الموكلين

### الحصول على جميع الموكلين

```http
GET /api/clients?type=individual&status=active&page=1&limit=10
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    {
      "id": "client-id",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "phone": "+966501234567",
      "type": "individual",
      "status": "active",
      "totalCases": 3,
      "totalSpent": 45000
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

### إنشاء موكل جديد

```http
POST /api/clients
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "+966501234567",
  "address": "شارع النيل",
  "city": "الرياض",
  "country": "السعودية",
  "type": "individual"
}

Response: 201 Created
{
  "id": "client-id",
  ...
}
```

## 💰 إدارة الفواتير

### الحصول على جميع الفواتير

```http
GET /api/invoices?status=paid&clientId=client-id&page=1&limit=10
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    {
      "id": "invoice-id",
      "invoiceNumber": "INV-2024-001",
      "clientId": "client-id",
      "total": 5390,
      "status": "paid",
      "issueDate": "2024-06-01T00:00:00Z",
      "dueDate": "2024-07-01T00:00:00Z"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 10
}
```

### إنشاء فاتورة جديدة

```http
POST /api/invoices
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "clientId": "client-id",
  "caseId": "case-id",
  "issueDate": "2024-06-01",
  "dueDate": "2024-07-01",
  "items": [
    {
      "description": "استشارة قانونية",
      "quantity": 5,
      "rate": 500
    }
  ],
  "notes": "ملاحظات الفاتورة"
}

Response: 201 Created
{
  "id": "invoice-id",
  "invoiceNumber": "INV-2024-001",
  ...
}
```

### تحميل الفاتورة بصيغة PDF

```http
GET /api/invoices/:invoiceId/download
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
Content-Type: application/pdf
[PDF FILE CONTENT]
```

## 📊 الأنشطة والتدقيق

### الحصول على سجل الأنشطة

```http
GET /api/activities?type=CREATE&userId=user-id&page=1&limit=20
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    {
      "id": "activity-id",
      "type": "CREATE",
      "entity": "case",
      "entityId": "case-id",
      "userId": "user-id",
      "user": { "name": "محمد علي" },
      "description": "تم إنشاء قضية جديدة",
      "timestamp": "2024-06-20T15:30:00Z",
      "ipAddress": "192.168.1.1"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

### إحصائيات الأنشطة

```http
GET /api/activities/stats?period=month
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "totalActivities": 150,
  "byType": {
    "CREATE": 45,
    "UPDATE": 60,
    "DELETE": 15,
    "LOGIN": 30
  },
  "byUser": {
    "user-id-1": 50,
    "user-id-2": 40
  }
}
```

### تصدير الأنشطة

```http
GET /api/activities/export?format=csv&period=month
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
Content-Type: text/csv
[CSV DATA]
```

## 🔔 الإشعارات

### الحصول على الإشعارات

```http
GET /api/notifications?read=false&page=1&limit=10
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    {
      "id": "notification-id",
      "type": "court_session",
      "title": "تذكير: جلسة قضائية غداً",
      "message": "لديك جلسة قضائية مقررة غداً",
      "read": false,
      "timestamp": "2024-06-20T15:30:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

### تحديد إشعار كمقروء

```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "id": "notification-id",
  "read": true
}
```

### حذف إشعار

```http
DELETE /api/notifications/:notificationId
Authorization: Bearer <JWT_TOKEN>

Response: 204 No Content
```

## 📈 التقارير

### الحصول على إحصائيات عامة

```http
GET /api/reports/overview?period=6months
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "totalCases": 69,
  "activeCases": 18,
  "closedCases": 51,
  "winRate": 84,
  "totalRevenue": 477000,
  "totalExpenses": 138000,
  "netProfit": 339000
}
```

### تقرير أداء المحامين

```http
GET /api/reports/lawyers-performance?period=6months
Authorization: Bearer <JWT_TOKEN>

Response: 200 OK
{
  "data": [
    {
      "lawyerId": "lawyer-id",
      "name": "محمد علي",
      "casesHandled": 24,
      "winRate": 85,
      "revenue": 180000,
      "avgCaseValue": 7500
    }
  ]
}
```

## ⚠️ رموز الخطأ

| الرمز | الوصف |
|------|-------|
| 200 | نجح |
| 201 | تم الإنشاء |
| 204 | لا محتوى |
| 400 | طلب سيء |
| 401 | غير مصرح |
| 403 | ممنوع |
| 404 | غير موجود |
| 409 | تضارب |
| 429 | عدد الطلبات كثير جداً |
| 500 | خطأ في الخادم |

## 🔄 معدل التحديد (Rate Limiting)

- الحد الأقصى: 100 طلب في الدقيقة
- الرأس: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 📝 الأمثلة

### مثال كامل: إنشاء قضية جديدة

```bash
#!/bin/bash

TOKEN="your-jwt-token"
API_URL="https://api.example.com"

# 1. إنشاء موكل جديد
CLIENT_RESPONSE=$(curl -X POST "$API_URL/api/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "phone": "+966501234567",
    "city": "الرياض",
    "type": "individual"
  }')

CLIENT_ID=$(echo $CLIENT_RESPONSE | jq -r '.id')

# 2. إنشاء قضية جديدة
CASE_RESPONSE=$(curl -X POST "$API_URL/api/cases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"caseNumber\": \"2024-001\",
    \"title\": \"قضية الملكية العقارية\",
    \"type\": \"عقاري\",
    \"status\": \"open\",
    \"priority\": \"high\",
    \"clientId\": \"$CLIENT_ID\"
  }")

CASE_ID=$(echo $CASE_RESPONSE | jq -r '.id')

echo "تم إنشاء القضية: $CASE_ID"
```

---

**آخر تحديث**: فبراير 2026

**الإصدار**: 1.0.0

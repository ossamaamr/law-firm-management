import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Clock,
  User,
  FileText,
  DollarSign,
  AlertCircle,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { useLanguage } from "@/_core/contexts/LanguageContext";

// Mock data for activities
const mockActivities = [
  {
    id: 1,
    userName: "أحمد محمد",
    userRole: "محامي",
    action: "إضافة",
    actionType: "create",
    entityType: "ملف",
    entityName: "MAT-2024-001",
    entityDetails: "ملف قضية الطلاق - الموكل: محمد سالم",
    timestamp: "2026-02-26T14:30:00Z",
    ipAddress: "192.168.1.100",
    changes: {
      before: null,
      after: { status: "جديد", priority: "عالي", budget: "5000 ريال" },
    },
  },
  {
    id: 2,
    userName: "فاطمة علي",
    userRole: "محاسبة",
    action: "تعديل",
    actionType: "update",
    entityType: "فاتورة",
    entityName: "INV-2024-042",
    entityDetails: "فاتورة ملف MAT-2024-001",
    timestamp: "2026-02-26T13:45:00Z",
    ipAddress: "192.168.1.101",
    changes: {
      before: { status: "مسودة", amount: "4500 ريال" },
      after: { status: "مرسلة", amount: "5000 ريال" },
    },
  },
  {
    id: 3,
    userName: "محمود سالم",
    userRole: "مساعد قانوني",
    action: "حذف",
    actionType: "delete",
    entityType: "مرفق",
    entityName: "DOC-2024-015",
    entityDetails: "حذف مرفق من الملف MAT-2024-001",
    timestamp: "2026-02-26T12:20:00Z",
    ipAddress: "192.168.1.102",
    changes: {
      before: { fileName: "عقد_التوكيل.pdf", size: "2.5 MB" },
      after: null,
    },
  },
  {
    id: 4,
    userName: "أحمد محمد",
    userRole: "محامي",
    action: "تحميل",
    actionType: "upload",
    entityType: "مستند",
    entityName: "DOC-2024-016",
    entityDetails: "تحميل مستند جديد: حكم_المحكمة.pdf",
    timestamp: "2026-02-26T11:15:00Z",
    ipAddress: "192.168.1.100",
    changes: {
      before: null,
      after: { fileName: "حكم_المحكمة.pdf", size: "1.8 MB", uploadedBy: "أحمد محمد" },
    },
  },
  {
    id: 5,
    userName: "فاطمة علي",
    userRole: "محاسبة",
    action: "إضافة",
    actionType: "create",
    entityType: "مصروف",
    entityName: "EXP-2024-008",
    entityDetails: "مصروف تنقل - ملف MAT-2024-001",
    timestamp: "2026-02-26T10:30:00Z",
    ipAddress: "192.168.1.101",
    changes: {
      before: null,
      after: { amount: "250 ريال", category: "تنقل", date: "2026-02-26" },
    },
  },
];

interface Activity {
  id: number;
  userName: string;
  userRole: string;
  action: string;
  actionType: string;
  entityType: string;
  entityName: string;
  entityDetails: string;
  timestamp: string;
  ipAddress: string;
  changes: {
    before: Record<string, any> | null;
    after: Record<string, any> | null;
  };
}

export default function ActivityTimelinePage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const translations = {
    ar: {
      title: "سجل النشاطات",
      subtitle: "تتبع جميع التعديلات والتغييرات في المكتب",
      search: "ابحث عن النشاط...",
      filterByAction: "فلترة حسب الإجراء",
      filterByUser: "فلترة حسب المستخدم",
      allActions: "جميع الإجراءات",
      allUsers: "جميع المستخدمين",
      create: "إضافة",
      update: "تعديل",
      delete: "حذف",
      upload: "تحميل",
      download: "تحميل",
      user: "المستخدم",
      action: "الإجراء",
      entity: "الكيان",
      timestamp: "الوقت",
      details: "التفاصيل",
      changes: "التغييرات",
      before: "قبل",
      after: "بعد",
      ipAddress: "عنوان IP",
      noResults: "لا توجد نتائج",
      viewDetails: "عرض التفاصيل",
      timeline: "الخط الزمني",
      statistics: "الإحصائيات",
      totalActivities: "إجمالي النشاطات",
      todayActivities: "نشاطات اليوم",
      thisWeek: "هذا الأسبوع",
      thisMonth: "هذا الشهر",
      exportReport: "تصدير التقرير",
    },
    en: {
      title: "Activity Timeline",
      subtitle: "Track all changes and modifications in the firm",
      search: "Search for activity...",
      filterByAction: "Filter by Action",
      filterByUser: "Filter by User",
      allActions: "All Actions",
      allUsers: "All Users",
      create: "Create",
      update: "Update",
      delete: "Delete",
      upload: "Upload",
      download: "Download",
      user: "User",
      action: "Action",
      entity: "Entity",
      timestamp: "Time",
      details: "Details",
      changes: "Changes",
      before: "Before",
      after: "After",
      ipAddress: "IP Address",
      noResults: "No results found",
      viewDetails: "View Details",
      timeline: "Timeline",
      statistics: "Statistics",
      totalActivities: "Total Activities",
      todayActivities: "Today's Activities",
      thisWeek: "This Week",
      thisMonth: "This Month",
      exportReport: "Export Report",
    },
  };

  const t = translations[isArabic ? "ar" : "en"];

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "create":
        return <Plus className="w-5 h-5 text-green-600" />;
      case "update":
        return <Edit className="w-5 h-5 text-blue-600" />;
      case "delete":
        return <Trash2 className="w-5 h-5 text-red-600" />;
      case "upload":
        return <Upload className="w-5 h-5 text-purple-600" />;
      case "download":
        return <Download className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      upload: "bg-purple-100 text-purple-800",
      download: "bg-orange-100 text-orange-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "ملف":
      case "File":
        return <FileText className="w-4 h-4" />;
      case "فاتورة":
      case "Invoice":
        return <DollarSign className="w-4 h-4" />;
      case "مستند":
      case "Document":
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityDetails.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === "all" || activity.actionType === filterAction;
    const matchesUser = filterUser === "all" || activity.userName === filterUser;

    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueUsers = Array.from(new Set(activities.map((a) => a.userName)));

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${isArabic ? "rtl" : "ltr"}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <CardHeader className="mb-6">
          <CardTitle className="text-3xl">{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">{t.timeline}</TabsTrigger>
            <TabsTrigger value="statistics">{t.statistics}</TabsTrigger>
          </TabsList>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.filterByAction} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allActions}</SelectItem>
                      <SelectItem value="create">{t.create}</SelectItem>
                      <SelectItem value="update">{t.update}</SelectItem>
                      <SelectItem value="delete">{t.delete}</SelectItem>
                      <SelectItem value="upload">{t.upload}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.filterByUser} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allUsers}</SelectItem>
                      {uniqueUsers.map((user) => (
                        <SelectItem key={user} value={user}>
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Activities List */}
            {filteredActivities.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t.noResults}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => (
                  <Card key={activity.id} className="hover:shadow-md transition">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 flex items-start pt-1">
                          {getActionIcon(activity.actionType)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-800">
                                  {activity.userName}
                                </span>
                                <Badge className={getActionBadge(activity.actionType)}>
                                  {activity.action}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {activity.entityType}: <strong>{activity.entityName}</strong>
                              </p>
                            </div>
                            <time className="text-sm text-gray-500 whitespace-nowrap">
                              {new Date(activity.timestamp).toLocaleString(
                                isArabic ? "ar-SA" : "en-US"
                              )}
                            </time>
                          </div>

                          {/* Details */}
                          <p className="text-sm text-gray-600 mb-3">
                            {activity.entityDetails}
                          </p>

                          {/* Changes Preview */}
                          {(activity.changes.before || activity.changes.after) && (
                            <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
                              {activity.changes.before && (
                                <p className="text-gray-600 mb-1">
                                  <span className="font-semibold">{t.before}:</span>{" "}
                                  {JSON.stringify(activity.changes.before).substring(0, 50)}...
                                </p>
                              )}
                              {activity.changes.after && (
                                <p className="text-gray-600">
                                  <span className="font-semibold">{t.after}:</span>{" "}
                                  {JSON.stringify(activity.changes.after).substring(0, 50)}...
                                </p>
                              )}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{t.ipAddress}: {activity.ipAddress}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedActivity(activity)}
                            >
                              {t.viewDetails}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {activities.length}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {t.totalActivities}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {activities.filter((a) => a.actionType === "create").length}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{t.create}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {activities.filter((a) => a.actionType === "update").length}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{t.update}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">
                      {activities.filter((a) => a.actionType === "delete").length}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">{t.delete}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Button */}
            <div className="mt-6">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                {t.exportReport}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Details Modal (Simple Card) */}
        {selectedActivity && (
          <Card className="fixed inset-4 z-50 overflow-auto">
            <CardHeader>
              <CardTitle>{t.details}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedActivity(null)}
                className="absolute right-4 top-4"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t.user}</p>
                  <p className="font-semibold">{selectedActivity.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.action}</p>
                  <Badge className={getActionBadge(selectedActivity.actionType)}>
                    {selectedActivity.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.entity}</p>
                  <p className="font-semibold">
                    {selectedActivity.entityType}: {selectedActivity.entityName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.timestamp}</p>
                  <p className="font-semibold">
                    {new Date(selectedActivity.timestamp).toLocaleString(
                      isArabic ? "ar-SA" : "en-US"
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">{t.details}</p>
                <p className="bg-gray-50 p-3 rounded">
                  {selectedActivity.entityDetails}
                </p>
              </div>

              {selectedActivity.changes.before && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t.before}</p>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedActivity.changes.before, null, 2)}
                  </pre>
                </div>
              )}

              {selectedActivity.changes.after && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t.after}</p>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedActivity.changes.after, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">{t.ipAddress}</p>
                <p className="font-mono text-sm">
                  {selectedActivity.ipAddress}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

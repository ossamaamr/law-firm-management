import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/_core/contexts/LanguageContext";
import {
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Clock,
  ArrowRight,
} from "lucide-react";

interface Activity {
  id: number;
  userName: string;
  userRole: string;
  action: string;
  actionType: string;
  entityType: string;
  entityName: string;
  timestamp: string;
}

interface DashboardActivityWidgetProps {
  activities: Activity[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export default function DashboardActivityWidget({
  activities,
  isLoading = false,
  onViewAll,
}: DashboardActivityWidgetProps) {
  const { language } = useLanguage();
  const isArabic = language === "ar";

  const translations = {
    ar: {
      title: "آخر النشاطات",
      subtitle: "التعديلات الأخيرة في المكتب",
      viewAll: "عرض الكل",
      noActivities: "لا توجد نشاطات حالياً",
      loading: "جاري التحميل...",
    },
    en: {
      title: "Recent Activities",
      subtitle: "Latest changes in the firm",
      viewAll: "View All",
      noActivities: "No activities yet",
      loading: "Loading...",
    },
  };

  const t = translations[isArabic ? "ar" : "en"];

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "create":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "update":
        return <Edit className="w-4 h-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case "upload":
        return <Upload className="w-4 h-4 text-purple-600" />;
      case "download":
        return <Download className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isArabic ? "الآن" : "Now";
    if (diffMins < 60)
      return isArabic ? `قبل ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24)
      return isArabic ? `قبل ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7)
      return isArabic ? `قبل ${diffDays} يوم` : `${diffDays}d ago`;

    return date.toLocaleDateString(isArabic ? "ar-SA" : "en-US");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">{t.loading}</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t.noActivities}</div>
        ) : (
          <>
            {/* Activities List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(activity.actionType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-800">
                        {activity.userName}
                      </span>
                      <Badge
                        className={`text-xs ${getActionBadge(activity.actionType)}`}
                      >
                        {activity.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {activity.entityType}: <strong>{activity.entityName}</strong>
                    </p>
                    <time className="text-xs text-gray-400">
                      {formatTime(activity.timestamp)}
                    </time>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            {activities.length > 5 && onViewAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                className="w-full"
              >
                {t.viewAll}
                <ArrowRight className={`w-4 h-4 ${isArabic ? "mr-2 rotate-180" : "ml-2"}`} />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

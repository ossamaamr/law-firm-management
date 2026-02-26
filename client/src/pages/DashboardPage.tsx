import React, { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useActivity } from "@/hooks/useActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "wouter";

/**
 * Dashboard Page - لوحة التحكم الرئيسية
 * Comprehensive dashboard with statistics, charts, and recent activities
 */

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  totalClients: number;
  upcomingSessions: number;
  totalInvoices: number;
  pendingInvoices: number;
  totalExpenses: number;
  teamMembers: number;
}

interface ActivitySummary {
  type: string;
  count: number;
  percentage: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { activities, stats, isLoading } = useActivity();
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const dashboardStats: DashboardStats = useMemo(() => ({
    totalCases: 24,
    activeCases: 18,
    totalClients: 45,
    upcomingSessions: 7,
    totalInvoices: 156,
    pendingInvoices: 12,
    totalExpenses: 45000,
    teamMembers: 8,
  }), []);

  // Activity summary data
  const activitySummary: ActivitySummary[] = useMemo(() => [
    { type: "تسجيل دخول", count: 45, percentage: 30 },
    { type: "إنشاء قضية", count: 24, percentage: 16 },
    { type: "تحديث ملف", count: 36, percentage: 24 },
    { type: "إضافة موكل", count: 18, percentage: 12 },
    { type: "أخرى", count: 27, percentage: 18 },
  ], []);

  // Chart data for cases trend
  const casesTrendData = useMemo(() => [
    { month: "يناير", active: 12, closed: 3 },
    { month: "فبراير", active: 14, closed: 5 },
    { month: "مارس", active: 16, closed: 4 },
    { month: "أبريل", active: 18, closed: 6 },
    { month: "مايو", active: 20, closed: 7 },
    { month: "يونيو", active: 18, closed: 8 },
  ], []);

  // Chart data for revenue
  const revenueData = useMemo(() => [
    { month: "يناير", revenue: 15000, expenses: 8000 },
    { month: "فبراير", revenue: 18000, expenses: 9000 },
    { month: "مارس", revenue: 22000, expenses: 10000 },
    { month: "أبريل", revenue: 25000, expenses: 11000 },
    { month: "مايو", revenue: 28000, expenses: 12000 },
    { month: "يونيو", revenue: 32000, expenses: 13000 },
  ], []);

  // Pie chart colors
  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const recentActivities = activities?.slice(0, 5) || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "LOGIN":
        return <Clock className="w-4 h-4" />;
      case "CREATE":
        return <CheckCircle className="w-4 h-4" />;
      case "UPDATE":
        return <TrendingUp className="w-4 h-4" />;
      case "DELETE":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "LOGIN":
        return "bg-blue-100 text-blue-800";
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatActivityType = (type: string) => {
    const typeMap: Record<string, string> = {
      LOGIN: "تسجيل دخول",
      CREATE: "إنشاء",
      UPDATE: "تحديث",
      DELETE: "حذف",
      APPROVE: "موافقة",
      REJECT: "رفض",
    };
    return typeMap[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          مرحباً بك، {user?.name}
        </h1>
        <p className="text-gray-600 mt-2">
          {new Date().toLocaleDateString("ar-SA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Cases Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي القضايا</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalCases}</div>
            <p className="text-xs text-gray-600 mt-1">
              {dashboardStats.activeCases} قضية نشطة
            </p>
          </CardContent>
        </Card>

        {/* Clients Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموكلين</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalClients}</div>
            <p className="text-xs text-gray-600 mt-1">
              موكلين نشطين هذا الشهر
            </p>
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">جلسات قادمة</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.upcomingSessions}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              في الأسبوع القادم
            </p>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(dashboardStats.totalExpenses / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-gray-600 mt-1">
              هذا الشهر
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Cases Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه القضايا</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={casesTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" fill="#3b82f6" name="نشطة" />
                <Bar dataKey="closed" fill="#10b981" name="مغلقة" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات والنفقات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  name="الإيرادات"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  name="النفقات"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الأنشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activitySummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {activitySummary.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>الأنشطة الأخيرة</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/activities")}
              >
                عرض الكل
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${getActivityColor(
                          activity.type
                        )}`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {formatActivityType(activity.type)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {activity.user?.name || "مستخدم"}
                      </Badge>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.timestamp).toLocaleDateString(
                          "ar-SA"
                        )}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">لا توجد أنشطة حالياً</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate("/cases/new")}
          >
            <FileText className="w-4 h-4 mr-2" />
            إنشاء قضية جديدة
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate("/clients/new")}
          >
            <Users className="w-4 h-4 mr-2" />
            إضافة موكل جديد
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate("/sessions/new")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            جدولة جلسة
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate("/invoices/new")}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            إنشاء فاتورة
          </Button>
        </div>
      </div>
    </div>
  );
}

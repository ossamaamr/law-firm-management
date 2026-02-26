import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react";

/**
 * Reports and Analytics Page - التقارير والتحليلات
 * Comprehensive reporting and analytics dashboard
 */

interface ReportData {
  month: string;
  cases: number;
  revenue: number;
  expenses: number;
  clients: number;
}

interface CaseAnalytics {
  type: string;
  count: number;
  percentage: number;
  avgDuration: number;
}

interface LawyerPerformance {
  name: string;
  casesHandled: number;
  winRate: number;
  revenue: number;
  avgCaseValue: number;
}

export function ReportsPage() {
  const [reportType, setReportType] = useState("overview");
  const [dateRange, setDateRange] = useState("6months");
  const [selectedLawyer, setSelectedLawyer] = useState("all");

  // Mock data for reports
  const monthlyData: ReportData[] = useMemo(() => [
    { month: "يناير", cases: 8, revenue: 45000, expenses: 18000, clients: 12 },
    { month: "فبراير", cases: 10, revenue: 52000, expenses: 20000, clients: 15 },
    { month: "مارس", cases: 12, revenue: 58000, expenses: 22000, clients: 18 },
    { month: "أبريل", cases: 14, revenue: 65000, expenses: 24000, clients: 20 },
    { month: "مايو", cases: 16, revenue: 72000, expenses: 26000, clients: 22 },
    { month: "يونيو", cases: 18, revenue: 85000, expenses: 28000, clients: 25 },
  ], []);

  const caseAnalytics: CaseAnalytics[] = useMemo(() => [
    { type: "عقاري", count: 24, percentage: 35, avgDuration: 120 },
    { type: "عمالي", count: 18, percentage: 26, avgDuration: 90 },
    { type: "أحوال شخصية", count: 15, percentage: 22, avgDuration: 60 },
    { type: "تجاري", count: 12, percentage: 17, avgDuration: 100 },
  ], []);

  const lawyerPerformance: LawyerPerformance[] = useMemo(() => [
    {
      name: "محمد علي",
      casesHandled: 24,
      winRate: 85,
      revenue: 180000,
      avgCaseValue: 7500,
    },
    {
      name: "سارة خالد",
      casesHandled: 20,
      winRate: 80,
      revenue: 145000,
      avgCaseValue: 7250,
    },
    {
      name: "أحمد حسن",
      casesHandled: 18,
      winRate: 78,
      revenue: 125000,
      avgCaseValue: 6944,
    },
    {
      name: "فاطمة محمود",
      casesHandled: 15,
      winRate: 82,
      revenue: 110000,
      avgCaseValue: 7333,
    },
  ], []);

  const caseOutcomeData = useMemo(() => [
    { name: "مكسوبة", value: 58, fill: "#10b981" },
    { name: "مخسورة", value: 18, fill: "#ef4444" },
    { name: "تسوية", value: 24, fill: "#f59e0b" },
  ], []);

  const stats = useMemo(() => ({
    totalCases: 69,
    activeCases: 18,
    closedCases: 51,
    winRate: 84,
    totalRevenue: 477000,
    totalExpenses: 138000,
    netProfit: 339000,
    avgCaseValue: 6913,
    totalClients: 112,
    newClientsThisMonth: 3,
  }), []);

  const handleExportReport = (format: "pdf" | "excel" | "csv") => {
    console.log(`Exporting report as ${format}`);
    // TODO: Implement export functionality
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">التقارير والتحليلات</h1>
            <p className="text-gray-600 mt-2">
              تحليل شامل لأداء المكتب والقضايا والموارد البشرية
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExportReport("pdf")}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport("excel")}
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport("csv")}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">نظرة عامة</SelectItem>
              <SelectItem value="cases">القضايا</SelectItem>
              <SelectItem value="financial">مالي</SelectItem>
              <SelectItem value="performance">الأداء</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">شهر واحد</SelectItem>
              <SelectItem value="3months">3 أشهر</SelectItem>
              <SelectItem value="6months">6 أشهر</SelectItem>
              <SelectItem value="1year">سنة واحدة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              إجمالي القضايا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.activeCases} نشطة، {stats.closedCases} مغلقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              معدل الفوز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.winRate}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round((stats.totalCases * stats.winRate) / 100)} قضية مكسوبة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              الإيرادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(stats.totalRevenue / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-gray-600 mt-1">
              متوسط: {stats.avgCaseValue.toLocaleString("ar-SA")} ر.س
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              الموكلين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-gray-600 mt-1">
              +{stats.newClientsThisMonth} هذا الشهر
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاه القضايا والإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cases"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCases)"
                  name="القضايا"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="الإيرادات"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Case Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>نتائج القضايا</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={caseOutcomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {caseOutcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Case Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>توزيع أنواع القضايا</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="عدد القضايا" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>متوسط مدة القضايا بالأيام</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={caseAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="avgDuration"
                  fill="#10b981"
                  name="متوسط المدة (يوم)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lawyer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>أداء المحامين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">المحامي</th>
                  <th className="text-right py-3 px-4 font-semibold">
                    القضايا
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    معدل الفوز
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    الإيرادات
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">
                    متوسط القيمة
                  </th>
                </tr>
              </thead>
              <tbody>
                {lawyerPerformance.map((lawyer, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{lawyer.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {lawyer.casesHandled}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          {lawyer.winRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {(lawyer.revenue / 1000).toFixed(1)}K
                    </td>
                    <td className="py-3 px-4">
                      {lawyer.avgCaseValue.toLocaleString("ar-SA")} ر.س
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

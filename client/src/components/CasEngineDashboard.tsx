import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Menu, X, LogOut, Settings, Bell, User, Moon, Sun, Globe,
  FileText, Users, Briefcase, DollarSign, AlertCircle, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

interface DashboardStats {
  totalCases: number;
  openCases: number;
  pendingCases: number;
  closedCases: number;
  totalClients: number;
  totalMatters: number;
  pendingInvoices: number;
  totalRevenue: number;
  upcomingSessions: number;
}

interface ChartData {
  name?: string;
  value?: number;
  month?: string;
  revenue?: number;
  [key: string]: any;
}

export const CasEngineDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isRTL = language === 'ar';

  // Mock data - replace with real data from API
  const stats: DashboardStats = {
    totalCases: 24,
    openCases: 12,
    pendingCases: 8,
    closedCases: 4,
    totalClients: 18,
    totalMatters: 20,
    pendingInvoices: 3,
    totalRevenue: 45000,
    upcomingSessions: 5,
  };

  const caseStatusData: ChartData[] = [
    { name: t('open'), value: stats.openCases },
    { name: t('pending'), value: stats.pendingCases },
    { name: t('closed'), value: stats.closedCases },
  ];

  const revenueData = [
    { month: t('january'), revenue: 4000 },
    { month: t('february'), revenue: 3000 },
    { month: t('march'), revenue: 2000 },
    { month: t('april'), revenue: 2780 },
    { month: t('may'), revenue: 1890 },
    { month: t('june'), revenue: 2390 },
  ];

  const navigationItems = [
    { id: 'overview', label: t('overview'), icon: Briefcase },
    { id: 'cases', label: t('cases'), icon: FileText },
    { id: 'clients', label: t('clients'), icon: Users },
    { id: 'invoices', label: t('invoices'), icon: DollarSign },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col shadow-sm`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="font-bold text-gray-900 dark:text-white">CasEngine</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">نظام إدارة المحاماة</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                } ${!sidebarOpen && 'justify-center'}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            title={sidebarOpen ? undefined : t('theme')}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            {sidebarOpen && <span className="text-sm">{theme === 'dark' ? t('light') : t('dark')}</span>}
          </button>

          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            title={sidebarOpen ? undefined : t('language')}
          >
            <Globe className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">{language === 'ar' ? 'English' : 'العربية'}</span>}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title={sidebarOpen ? undefined : t('logout')}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">{t('logout')}</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('welcome')}, {user?.name}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile */}
            <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('totalCases')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.totalCases}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {stats.openCases} {t('open')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('totalClients')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.totalClients}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {stats.totalMatters} {t('matters')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('pendingInvoices')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {stats.pendingInvoices}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      بقيمة ${stats.totalRevenue}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('upcomingSessions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.upcomingSessions}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      في الـ 7 أيام القادمة
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Case Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('caseStatus')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={caseStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {caseStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('monthlyRevenue')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData as any}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#3498db"
                          strokeWidth={2}
                          dot={{ fill: '#3498db', r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('recentActivities')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            تم إضافة قضية جديدة
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            قضية رقم #2024-001 - قبل ساعة
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'cases' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('cases')}</CardTitle>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('addNew')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400">{t('comingSoon')}</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'clients' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('clients')}</CardTitle>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('addNew')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400">{t('comingSoon')}</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'invoices' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('invoices')}</CardTitle>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('addNew')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400">{t('comingSoon')}</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('settings')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 dark:text-gray-400">{t('comingSoon')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CasEngineDashboard;

import React, { useEffect, useState } from 'react';
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
import { trpc } from '@/lib/trpc';
import { useActivity } from '@/hooks/useActivity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];

interface DashboardStats {
  totalCases: number;
  openCases: number;
  pendingCases: number;
  closedCases: number;
  totalClients: number;
  totalMatters: number | null;
  pendingInvoices: number | null;
  totalRevenue: number | null;
  upcomingSessions: number | null;
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
  const { activities } = useActivity();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isRTL = language === 'ar';

  const dashboardQuery = trpc.dashboard.summary.useQuery(undefined, {
    enabled: Boolean(user?.lawFirmId),
  });
  const canManageAdmin = user?.role === 'admin' || user?.role === 'manager';
  const brandingQuery = trpc.branding.get.useQuery(undefined, {
    enabled: Boolean(user?.lawFirmId),
  });
  const adminUsersQuery = trpc.admin.users.list.useQuery(undefined, {
    enabled: Boolean(user?.lawFirmId && canManageAdmin),
  });
  const adminHealthQuery = trpc.admin.health.useQuery(undefined, {
    enabled: Boolean(user?.lawFirmId && canManageAdmin),
    refetchInterval: 60_000,
  });
  const updateRoleMutation = trpc.admin.users.updateRole.useMutation({
    onSuccess: async () => {
      await adminUsersQuery.refetch();
      toast.success(language === 'ar' ? 'تم تحديث دور المستخدم' : 'User role updated');
    },
    onError: error => toast.error(error.message || (language === 'ar' ? 'تعذر تحديث الدور' : 'Unable to update role')),
  });
  const brandingMutation = trpc.branding.update.useMutation({
    onSuccess: async () => {
      await brandingQuery.refetch();
      toast.success(language === 'ar' ? 'تم تحديث هوية المنصة' : 'Platform branding updated');
    },
    onError: error => {
      toast.error(error.message || (language === 'ar' ? 'تعذر تحديث الهوية' : 'Unable to update branding'));
    },
  });
  const [brandingForm, setBrandingForm] = useState({
    platformNameAr: '',
    platformNameEn: '',
    logoUrl: '',
  });

  useEffect(() => {
    if (!brandingQuery.data) return;
    setBrandingForm({
      platformNameAr: brandingQuery.data.platformNameAr,
      platformNameEn: brandingQuery.data.platformNameEn,
      logoUrl: brandingQuery.data.logoUrl ?? '',
    });
  }, [brandingQuery.data]);

  const summary = dashboardQuery.data;
  const canManageBranding = canManageAdmin;
  const [logoUploadPending, setLogoUploadPending] = useState(false);

  const uploadBrandingLogo = async (file: File) => {
    if (!canManageBranding) return;
    setLogoUploadPending(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await fetch('/api/branding/logo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || (language === 'ar' ? 'تعذر رفع الشعار' : 'Logo upload failed'));
      await brandingQuery.refetch();
      toast.success(language === 'ar' ? 'تم رفع الشعار وتحديث الهوية' : 'Logo uploaded and branding updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (language === 'ar' ? 'تعذر رفع الشعار' : 'Logo upload failed'));
    } finally {
      setLogoUploadPending(false);
    }
  };
  const stats: DashboardStats = {
    totalCases: summary?.cases.total ?? 0,
    openCases: summary?.cases.open ?? 0,
    pendingCases: summary?.cases.pending ?? 0,
    closedCases: summary?.cases.closed ?? 0,
    totalClients: summary?.clients.total ?? 0,
    totalMatters: summary?.matters.total ?? null,
    pendingInvoices: summary?.invoices.pendingCount ?? null,
    totalRevenue: summary?.invoices.totalFinalAmount ?? null,
    upcomingSessions: summary?.upcomingSessions ?? null,
  };

  const caseStatusData: ChartData[] = [
    { name: t('open'), value: stats.openCases },
    { name: t('pending'), value: stats.pendingCases },
    { name: t('closed'), value: stats.closedCases },
  ];

  const revenueData: Array<{ month: string; revenue: number }> = summary
    ? [{ month: language === 'ar' ? 'الفترة المحددة' : 'Selected period', revenue: summary.invoices.totalFinalAmount }]
    : [];

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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center overflow-hidden">
                {brandingQuery.data?.logoUrl ? (
                  <img
                    src={brandingQuery.data.logoUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Briefcase className="w-6 h-6 text-white" />
                )}
              </div>
              {sidebarOpen && (
                <div className="min-w-0">
                  <h1 className="font-bold text-gray-900 dark:text-white truncate">
                    {language === 'ar' ? brandingQuery.data?.platformNameAr : brandingQuery.data?.platformNameEn}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {language === 'ar' ? 'نظام إدارة المحاماة' : 'Legal operating system'}
                  </p>
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
                      {stats.totalMatters === null ? '—' : `${stats.totalMatters} ${t('matters')}`}
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
                      {stats.pendingInvoices === null ? '—' : stats.pendingInvoices}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {stats.totalRevenue === null ? 'بيانات الفواتير غير متاحة بعد' : `بقيمة $${stats.totalRevenue}`}
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
                      {stats.upcomingSessions === null ? '—' : stats.upcomingSessions}
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
                    {activities.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد نشاطات مسجلة بعد.</p>
                    ) : activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.actionType} — {activity.entityType}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.entityName} · {new Date(activity.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
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
                <CardTitle>{language === 'ar' ? 'هوية المنصة' : 'Platform identity'}</CardTitle>
                <CardDescription>
                  {language === 'ar'
                    ? 'تظهر هذه الهوية داخل مساحة مكتبك فقط، ولا يمكن لمكتب آخر قراءتها أو تعديلها.'
                    : 'This identity is scoped to your firm and cannot be read or changed by another firm.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brandingQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جارٍ تحميل الإعدادات…' : 'Loading settings…'}</p>
                ) : (
                  <form
                    className="space-y-5 max-w-2xl"
                    dir={isRTL ? 'rtl' : 'ltr'}
                    onSubmit={event => {
                      event.preventDefault();
                      if (!canManageBranding) return;
                      brandingMutation.mutate({
                        platformNameAr: brandingForm.platformNameAr,
                        platformNameEn: brandingForm.platformNameEn,
                        logoUrl: brandingForm.logoUrl.trim() || null,
                      });
                    }}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="platformNameAr">{language === 'ar' ? 'اسم المنصة بالعربية' : 'Arabic platform name'}</Label>
                      <Input
                        id="platformNameAr"
                        value={brandingForm.platformNameAr}
                        onChange={event => setBrandingForm(current => ({ ...current, platformNameAr: event.target.value }))}
                        disabled={!canManageBranding || brandingMutation.isPending}
                        maxLength={120}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="platformNameEn">{language === 'ar' ? 'اسم المنصة بالإنجليزية' : 'English platform name'}</Label>
                      <Input
                        id="platformNameEn"
                        value={brandingForm.platformNameEn}
                        onChange={event => setBrandingForm(current => ({ ...current, platformNameEn: event.target.value }))}
                        disabled={!canManageBranding || brandingMutation.isPending}
                        maxLength={120}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="logoFile">{language === 'ar' ? 'شعار المكتب' : 'Firm logo'}</Label>
                      <Input
                        id="logoFile"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={!canManageBranding || brandingMutation.isPending || logoUploadPending}
                        onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) void uploadBrandingLogo(file);
                          event.currentTarget.value = '';
                        }}
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'PNG أو JPEG أو WebP، بحد أقصى 2MB. يتحقق الخادم من النوع والمحتوى.' : 'PNG, JPEG, or WebP up to 2MB. The server verifies type and content.'}
                      </p>
                      {logoUploadPending && <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جارٍ رفع الشعار…' : 'Uploading logo…'}</p>}
                      {brandingForm.logoUrl && (
                        <p className="text-xs text-muted-foreground truncate" dir="ltr">{brandingForm.logoUrl}</p>
                      )}
                    </div>
                    {canManageBranding ? (
                      <Button type="submit" disabled={brandingMutation.isPending}>
                        {brandingMutation.isPending ? (language === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : t('save')}
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'للتعديل، يلزم دور المدير أو المسؤول.' : 'Manager or admin access is required to edit branding.'}
                      </p>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && canManageAdmin && (
            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]" dir={isRTL ? 'rtl' : 'ltr'}>
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'إدارة مستخدمي المكتب' : 'Firm user management'}</CardTitle>
                  <CardDescription>
                    {language === 'ar' ? 'تُعرض حسابات مكتبك فقط. تغيير الأدوار يخضع لقيود الخادم وسجل التدقيق.' : 'Only your firm users are shown. Role changes are server-guarded and audited.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {adminUsersQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جارٍ تحميل المستخدمين…' : 'Loading users…'}</p>
                  ) : adminUsersQuery.data?.length ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="p-3 text-start font-medium">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                            <th className="p-3 text-start font-medium">{language === 'ar' ? 'الدور' : 'Role'}</th>
                            <th className="p-3 text-start font-medium">{language === 'ar' ? 'آخر دخول' : 'Last sign-in'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsersQuery.data.map(firmUser => (
                            <tr key={firmUser.id} className="border-t">
                              <td className="p-3">
                                <div className="font-medium">{firmUser.name || '—'}</div>
                                <div className="text-xs text-muted-foreground" dir="ltr">{firmUser.email || '—'}</div>
                              </td>
                              <td className="p-3">
                                <select
                                  className="h-9 rounded-md border bg-background px-2 text-sm"
                                  value={firmUser.role}
                                  disabled={firmUser.id === user?.id || updateRoleMutation.isPending || (user?.role === 'manager' && (firmUser.role === 'admin' || firmUser.role === 'manager'))}
                                  onChange={event => updateRoleMutation.mutate({ userId: firmUser.id, role: event.target.value as 'admin' | 'manager' | 'lawyer' | 'accountant' | 'user' })}
                                  aria-label={language === 'ar' ? `دور ${firmUser.name || firmUser.email || firmUser.id}` : `Role for ${firmUser.name || firmUser.email || firmUser.id}`}
                                >
                                  {(['admin', 'manager', 'lawyer', 'accountant', 'user'] as const).map(role => (
                                    <option key={role} value={role} disabled={user?.role === 'manager' && (role === 'admin' || role === 'manager')}>
                                      {language === 'ar' ? ({ admin: 'مسؤول', manager: 'مدير', lawyer: 'محامٍ', accountant: 'محاسب', user: 'مستخدم' }[role]) : role}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3 text-muted-foreground" dir="ltr">
                                {firmUser.lastSignedIn ? new Date(firmUser.lastSignedIn).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'لا يوجد مستخدمون مرتبطون بالمكتب.' : 'No users are assigned to this firm.'}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === 'ar' ? 'صحة النظام' : 'System health'}</CardTitle>
                  <CardDescription>{language === 'ar' ? 'مؤشرات تشغيلية مختصرة للمستخدم الإداري.' : 'A concise operational view for administrators.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adminHealthQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جارٍ الفحص…' : 'Checking…'}</p>
                  ) : adminHealthQuery.data ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{language === 'ar' ? 'الحالة العامة' : 'Overall status'}</span>
                        <Badge variant={adminHealthQuery.data.status === 'healthy' ? 'default' : 'secondary'}>{adminHealthQuery.data.status === 'healthy' ? (language === 'ar' ? 'سليم' : 'Healthy') : (language === 'ar' ? 'متدهور' : 'Degraded')}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm"><span>Database</span><span className="text-muted-foreground">{adminHealthQuery.data.database}</span></div>
                      <div className="flex items-center justify-between text-sm"><span>Storage</span><span className="text-muted-foreground">{adminHealthQuery.data.storage}</span></div>
                      <div className="flex items-center justify-between text-sm"><span>Environment</span><span className="text-muted-foreground" dir="ltr">{adminHealthQuery.data.environment}</span></div>
                      <div className="flex items-center justify-between text-sm"><span>Response</span><span className="text-muted-foreground" dir="ltr">{adminHealthQuery.data.responseTimeMs} ms</span></div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تعذر قراءة الصحة.' : 'Health data unavailable.'}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CasEngineDashboard;

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CaseFormData {
  caseNumber: string;
  title: string;
  caseType: string;
  courtName: string;
  judge: string;
  oppositeParty: string;
  filingDate: string;
  nextSessionDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  budget: string;
  description: string;
}

export default function CasesPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);
  const [formData, setFormData] = useState<CaseFormData>({
    caseNumber: '',
    title: '',
    caseType: 'civil',
    courtName: '',
    judge: '',
    oppositeParty: '',
    filingDate: '',
    nextSessionDate: '',
    priority: 'medium',
    budget: '',
    description: '',
  });

  // Mock data - replace with real API calls
  const cases = [
    {
      id: 1,
      caseNumber: '#2024-001',
      title: 'قضية عقارية',
      caseType: 'civil',
      courtName: 'محكمة الاستئناف - الرياض',
      judge: 'القاضي أحمد العتيبي',
      oppositeParty: 'محمد علي الدوسري',
      status: 'open',
      priority: 'high',
      filingDate: new Date('2024-01-10'),
      nextSessionDate: new Date('2024-03-15'),
      budget: '50000',
      expenditure: '15000',
    },
    {
      id: 2,
      caseNumber: '#2024-002',
      title: 'قضية عمالية',
      caseType: 'labor',
      courtName: 'محكمة العمل - جدة',
      judge: 'القاضية فاطمة الشمري',
      oppositeParty: 'شركة النور للتجارة',
      status: 'pending',
      priority: 'medium',
      filingDate: new Date('2024-02-01'),
      nextSessionDate: new Date('2024-03-20'),
      budget: '30000',
      expenditure: '8000',
    },
    {
      id: 3,
      caseNumber: '#2024-003',
      title: 'قضية تجارية',
      caseType: 'commercial',
      courtName: 'محكمة التجارة - الدمام',
      judge: 'القاضي سالم الحربي',
      oppositeParty: 'شركة الخليج للاستيراد والتصدير',
      status: 'closed',
      priority: 'low',
      filingDate: new Date('2023-12-01'),
      nextSessionDate: new Date('2024-02-28'),
      budget: '25000',
      expenditure: '25000',
    },
  ];

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch = caseItem.caseNumber.includes(searchQuery) ||
                         caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         caseItem.oppositeParty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddCase = () => {
    setEditingCase(null);
    setFormData({
      caseNumber: '',
      title: '',
      caseType: 'civil',
      courtName: '',
      judge: '',
      oppositeParty: '',
      filingDate: '',
      nextSessionDate: '',
      priority: 'medium',
      budget: '',
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditCase = (caseItem: any) => {
    setEditingCase(caseItem);
    setFormData({
      caseNumber: caseItem.caseNumber,
      title: caseItem.title,
      caseType: caseItem.caseType,
      courtName: caseItem.courtName,
      judge: caseItem.judge,
      oppositeParty: caseItem.oppositeParty,
      filingDate: caseItem.filingDate.toISOString().split('T')[0],
      nextSessionDate: caseItem.nextSessionDate.toISOString().split('T')[0],
      priority: caseItem.priority,
      budget: caseItem.budget,
      description: '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveCase = () => {
    console.log('Saving case:', formData);
    setIsDialogOpen(false);
  };

  const handleDeleteCase = (caseId: number) => {
    console.log('Deleting case:', caseId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      open: 'default',
      pending: 'secondary',
      closed: 'outline',
    };
    const labels: Record<string, string> = {
      open: 'مفتوحة',
      pending: 'معلقة',
      closed: 'مغلقة',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels: Record<string, string> = {
      low: 'منخفضة',
      medium: 'متوسطة',
      high: 'عالية',
      urgent: 'عاجلة',
    };
    return (
      <Badge className={colors[priority]}>
        {labels[priority]}
      </Badge>
    );
  };

  const upcomingSessions = cases.filter((c) => {
    const nextSession = new Date(c.nextSessionDate);
    const today = new Date();
    const daysUntilSession = Math.ceil((nextSession.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilSession > 0 && daysUntilSession <= 7;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('cases')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة القضايا والجلسات القضائية
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddCase} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCase ? 'تعديل القضية' : 'إضافة قضية جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    رقم القضية
                  </label>
                  <Input
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                    placeholder="#2024-001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    عنوان القضية
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان القضية"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نوع القضية
                  </label>
                  <select
                    value={formData.caseType}
                    onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="civil">مدني</option>
                    <option value="criminal">جنائي</option>
                    <option value="commercial">تجاري</option>
                    <option value="labor">عمالي</option>
                    <option value="family">أحوال شخصية</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    الأولوية
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    اسم المحكمة
                  </label>
                  <Input
                    value={formData.courtName}
                    onChange={(e) => setFormData({ ...formData, courtName: e.target.value })}
                    placeholder="محكمة الاستئناف"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    القاضي
                  </label>
                  <Input
                    value={formData.judge}
                    onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                    placeholder="اسم القاضي"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  الطرف الآخر
                </label>
                <Input
                  value={formData.oppositeParty}
                  onChange={(e) => setFormData({ ...formData, oppositeParty: e.target.value })}
                  placeholder="اسم الطرف الآخر"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    تاريخ التسجيل
                  </label>
                  <Input
                    type="date"
                    value={formData.filingDate}
                    onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    تاريخ الجلسة التالية
                  </label>
                  <Input
                    type="date"
                    value={formData.nextSessionDate}
                    onChange={(e) => setFormData({ ...formData, nextSessionDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  الميزانية المتوقعة
                </label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveCase} className="flex-1">
                  {t('save')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Sessions Alert */}
      {upcomingSessions.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-200">
              <AlertCircle className="w-5 h-5" />
              جلسات قادمة في الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingSessions.map((caseItem) => (
                <div key={caseItem.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{caseItem.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {caseItem.nextSessionDate.toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    عرض التفاصيل
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ابحث عن قضية برقمها أو العنوان..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="pending">معلقة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            قائمة القضايا ({filteredCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم القضية</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>نوع القضية</TableHead>
                  <TableHead>الطرف الآخر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>الجلسة التالية</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{caseItem.caseNumber}</TableCell>
                    <TableCell>{caseItem.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {caseItem.caseType === 'civil' && 'مدني'}
                        {caseItem.caseType === 'criminal' && 'جنائي'}
                        {caseItem.caseType === 'commercial' && 'تجاري'}
                        {caseItem.caseType === 'labor' && 'عمالي'}
                      </Badge>
                    </TableCell>
                    <TableCell>{caseItem.oppositeParty}</TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                    <TableCell className="text-sm">
                      {caseItem.nextSessionDate.toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCase(caseItem)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCase(caseItem.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCases.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">لا توجد قضايا</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              إجمالي القضايا
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {cases.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              قضايا مفتوحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {cases.filter((c) => c.status === 'open').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              قضايا معلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {cases.filter((c) => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              قضايا مغلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {cases.filter((c) => c.status === 'closed').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

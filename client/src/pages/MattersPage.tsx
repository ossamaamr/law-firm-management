import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, FileText, DollarSign, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MatterFormData {
  matterNumber: string;
  clientName: string;
  matterType: string;
  description: string;
  openingDate: string;
  status: 'active' | 'inactive' | 'closed';
  feeArrangement: string;
  estimatedBudget: string;
  assignedLawyer: string;
}

export default function MattersPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'closed'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatter, setEditingMatter] = useState<any>(null);
  const [formData, setFormData] = useState<MatterFormData>({
    matterNumber: '',
    clientName: '',
    matterType: 'general',
    description: '',
    openingDate: new Date().toISOString().split('T')[0],
    status: 'active',
    feeArrangement: 'hourly',
    estimatedBudget: '',
    assignedLawyer: '',
  });

  // Mock data - replace with real API calls
  const matters = [
    {
      id: 1,
      matterNumber: 'MAT-2024-001',
      clientName: 'أحمد محمد',
      matterType: 'عقاري',
      description: 'قضية عقارية متعلقة بنزاع على ملكية عقار',
      status: 'active',
      openingDate: new Date('2024-01-10'),
      feeArrangement: 'hourly',
      estimatedBudget: 50000,
      assignedLawyer: 'محمد علي',
      caseCount: 2,
      documentCount: 15,
      totalExpenditure: 12500,
    },
    {
      id: 2,
      matterNumber: 'MAT-2024-002',
      clientName: 'شركة النور للتجارة',
      matterType: 'عمالي',
      description: 'قضايا عمالية متعددة',
      status: 'active',
      openingDate: new Date('2024-02-01'),
      feeArrangement: 'fixed',
      estimatedBudget: 30000,
      assignedLawyer: 'فاطمة الشمري',
      caseCount: 1,
      documentCount: 8,
      totalExpenditure: 5000,
    },
    {
      id: 3,
      matterNumber: 'MAT-2024-003',
      clientName: 'محمد علي الدوسري',
      matterType: 'تجاري',
      description: 'استشارات قانونية تجارية',
      status: 'inactive',
      openingDate: new Date('2023-12-15'),
      feeArrangement: 'retainer',
      estimatedBudget: 25000,
      assignedLawyer: 'سالم الحربي',
      caseCount: 0,
      documentCount: 5,
      totalExpenditure: 8000,
    },
  ];

  const filteredMatters = matters.filter((matter) => {
    const matchesSearch = matter.matterNumber.includes(searchQuery) ||
                         matter.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         matter.matterType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || matter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddMatter = () => {
    setEditingMatter(null);
    setFormData({
      matterNumber: `MAT-${new Date().getFullYear()}-${String(matters.length + 1).padStart(3, '0')}`,
      clientName: '',
      matterType: 'general',
      description: '',
      openingDate: new Date().toISOString().split('T')[0],
      status: 'active',
      feeArrangement: 'hourly',
      estimatedBudget: '',
      assignedLawyer: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditMatter = (matter: any) => {
    setEditingMatter(matter);
    setFormData({
      matterNumber: matter.matterNumber,
      clientName: matter.clientName,
      matterType: matter.matterType,
      description: matter.description,
      openingDate: matter.openingDate.toISOString().split('T')[0],
      status: matter.status,
      feeArrangement: matter.feeArrangement,
      estimatedBudget: matter.estimatedBudget.toString(),
      assignedLawyer: matter.assignedLawyer,
    });
    setIsDialogOpen(true);
  };

  const handleSaveMatter = () => {
    console.log('Saving matter:', formData);
    setIsDialogOpen(false);
  };

  const handleDeleteMatter = (matterId: number) => {
    console.log('Deleting matter:', matterId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      closed: 'outline',
    };
    const labels: Record<string, string> = {
      active: 'نشطة',
      inactive: 'معطلة',
      closed: 'مغلقة',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status]}</Badge>;
  };

  const activeMatterCount = matters.filter((m) => m.status === 'active').length;
  const totalBudget = matters.reduce((sum, m) => sum + m.estimatedBudget, 0);
  const totalExpenditure = matters.reduce((sum, m) => sum + m.totalExpenditure, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الملفات القانونية</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة الملفات والقضايا والمستندات
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddMatter} className="gap-2">
              <Plus className="w-4 h-4" />
              ملف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMatter ? 'تعديل الملف' : 'إنشاء ملف جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    رقم الملف
                  </label>
                  <Input
                    value={formData.matterNumber}
                    onChange={(e) => setFormData({ ...formData, matterNumber: e.target.value })}
                    placeholder="MAT-2024-001"
                    disabled
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    اسم العميل
                  </label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    placeholder="اسم العميل"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    نوع الملف
                  </label>
                  <select
                    value={formData.matterType}
                    onChange={(e) => setFormData({ ...formData, matterType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="general">عام</option>
                    <option value="عقاري">عقاري</option>
                    <option value="عمالي">عمالي</option>
                    <option value="تجاري">تجاري</option>
                    <option value="أسري">أسري</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    المحامي المسؤول
                  </label>
                  <Input
                    value={formData.assignedLawyer}
                    onChange={(e) => setFormData({ ...formData, assignedLawyer: e.target.value })}
                    placeholder="اسم المحامي"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  وصف الملف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الملف والقضايا المتعلقة به"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    ترتيب الأتعاب
                  </label>
                  <select
                    value={formData.feeArrangement}
                    onChange={(e) => setFormData({ ...formData, feeArrangement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="hourly">بالساعة</option>
                    <option value="fixed">سعر ثابت</option>
                    <option value="retainer">عقد دوري</option>
                    <option value="contingency">نسبة من الحكم</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    الميزانية المتوقعة
                  </label>
                  <Input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    تاريخ الفتح
                  </label>
                  <Input
                    type="date"
                    value={formData.openingDate}
                    onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    الحالة
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="active">نشطة</option>
                    <option value="inactive">معطلة</option>
                    <option value="closed">مغلقة</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveMatter} className="flex-1">
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              إجمالي الملفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {matters.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              ملفات نشطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {activeMatterCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              الميزانية الإجمالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalBudget.toLocaleString('ar-SA')} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              الإنفاق الفعلي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {totalExpenditure.toLocaleString('ar-SA')} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="ابحث عن ملف..."
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
              <option value="active">نشطة</option>
              <option value="inactive">معطلة</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Matters Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            قائمة الملفات ({filteredMatters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الملف</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>نوع الملف</TableHead>
                  <TableHead>المحامي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الميزانية</TableHead>
                  <TableHead>الإنفاق</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatters.map((matter) => (
                  <TableRow key={matter.id}>
                    <TableCell className="font-medium">{matter.matterNumber}</TableCell>
                    <TableCell>{matter.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{matter.matterType}</Badge>
                    </TableCell>
                    <TableCell>{matter.assignedLawyer}</TableCell>
                    <TableCell>{getStatusBadge(matter.status)}</TableCell>
                    <TableCell className="font-medium">
                      {matter.estimatedBudget.toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell className="text-sm text-orange-600 dark:text-orange-400">
                      {matter.totalExpenditure.toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMatter(matter)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMatter(matter.id)}
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

          {filteredMatters.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">لا توجد ملفات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

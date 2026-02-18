import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Download, Eye, Trash2, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceFormData {
  invoiceNumber: string;
  clientName: string;
  caseNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  description: string;
  items: Array<{
    description: string;
    quantity: string;
    rate: string;
  }>;
}

export default function InvoicesPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: '',
    clientName: '',
    caseNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    amount: '',
    description: '',
    items: [{ description: '', quantity: '1', rate: '' }],
  });

  // Mock data - replace with real API calls
  const invoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      clientName: 'أحمد محمد',
      caseNumber: '#2024-001',
      amount: 50000,
      invoiceDate: new Date('2024-02-01'),
      dueDate: new Date('2024-02-15'),
      status: 'paid',
      paidDate: new Date('2024-02-14'),
      description: 'استشارة قانونية وتمثيل أمام المحكمة',
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-002',
      clientName: 'شركة النور للتجارة',
      caseNumber: '#2024-002',
      amount: 30000,
      invoiceDate: new Date('2024-02-05'),
      dueDate: new Date('2024-02-20'),
      status: 'sent',
      paidDate: null,
      description: 'خدمات قانونية - قضية عمالية',
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-003',
      clientName: 'محمد علي الدوسري',
      caseNumber: '#2024-003',
      amount: 25000,
      invoiceDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-01'),
      status: 'overdue',
      paidDate: null,
      description: 'استشارة قانونية',
    },
    {
      id: 4,
      invoiceNumber: 'INV-2024-004',
      clientName: 'فاطمة أحمد',
      caseNumber: '#2024-004',
      amount: 15000,
      invoiceDate: new Date('2024-02-10'),
      dueDate: new Date('2024-02-25'),
      status: 'draft',
      paidDate: null,
      description: 'مسودة فاتورة',
    },
  ];

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.includes(searchQuery) ||
                         invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.caseNumber.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      clientName: '',
      caseNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      amount: '',
      description: '',
      items: [{ description: '', quantity: '1', rate: '' }],
    });
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      caseNumber: invoice.caseNumber,
      invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      amount: invoice.amount.toString(),
      description: invoice.description,
      items: [{ description: '', quantity: '1', rate: '' }],
    });
    setIsDialogOpen(true);
  };

  const handleSaveInvoice = () => {
    console.log('Saving invoice:', formData);
    setIsDialogOpen(false);
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    console.log('Deleting invoice:', invoiceId);
  };

  const handleDownloadInvoice = (invoiceId: number) => {
    console.log('Downloading invoice:', invoiceId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      sent: 'secondary',
      paid: 'default',
      overdue: 'destructive',
    };
    const labels: Record<string, string> = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      overdue: 'متأخرة',
    };
    return <Badge variant={variants[status] || 'outline'}>{labels[status]}</Badge>;
  };

  const totalRevenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter((inv) => inv.status !== 'paid' && inv.status !== 'draft')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueAmount = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">الفواتير والفوترة</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة الفواتير والمدفوعات والمحاسبة
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddInvoice} className="gap-2">
              <Plus className="w-4 h-4" />
              فاتورة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInvoice ? 'تعديل الفاتورة' : 'إنشاء فاتورة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    رقم الفاتورة
                  </label>
                  <Input
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    placeholder="INV-2024-001"
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
                    المبلغ الإجمالي
                  </label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    تاريخ الفاتورة
                  </label>
                  <Input
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    تاريخ الاستحقاق
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الخدمات"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveInvoice} className="flex-1">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <DollarSign className="w-4 h-4" />
              الإيرادات المحققة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {totalRevenue.toLocaleString('ar-SA')} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              المبالغ المعلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingAmount.toLocaleString('ar-SA')} ر.س
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-4 h-4" />
              المبالغ المتأخرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {overdueAmount.toLocaleString('ar-SA')} ر.س
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
                  placeholder="ابحث عن فاتورة..."
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
              <option value="draft">مسودات</option>
              <option value="sent">مرسلة</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            قائمة الفواتير ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>رقم القضية</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.caseNumber}</TableCell>
                    <TableCell className="font-medium">
                      {invoice.amount.toLocaleString('ar-SA')} ر.س
                    </TableCell>
                    <TableCell className="text-sm">
                      {invoice.dueDate.toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditInvoice(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
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

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">لا توجد فواتير</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

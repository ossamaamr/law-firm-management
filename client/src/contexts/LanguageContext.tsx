import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    overview: 'نظرة عامة',
    cases: 'القضايا',
    clients: 'العملاء',
    invoices: 'الفواتير',
    settings: 'الإعدادات',
    dashboard: 'لوحة التحكم',
    welcome: 'مرحباً',
    logout: 'تسجيل الخروج',
    theme: 'المظهر',
    language: 'اللغة',
    light: 'فاتح',
    dark: 'غامق',

    // Stats
    totalCases: 'إجمالي القضايا',
    totalClients: 'إجمالي العملاء',
    pendingInvoices: 'الفواتير المعلقة',
    upcomingSessions: 'الجلسات القادمة',
    open: 'مفتوحة',
    pending: 'معلقة',
    closed: 'مغلقة',
    matters: 'الملفات',

    // Charts
    caseStatus: 'حالة القضايا',
    monthlyRevenue: 'الإيرادات الشهرية',
    recentActivities: 'الأنشطة الأخيرة',

    // Months
    january: 'يناير',
    february: 'فبراير',
    march: 'مارس',
    april: 'أبريل',
    may: 'مايو',
    june: 'يونيو',

    // Buttons
    addNew: 'إضافة جديد',
    comingSoon: 'قريباً...',

    // File Viewer
    download: 'تحميل',
    close: 'إغلاق',
    previous: 'السابق',
    next: 'التالي',
    page: 'الصفحة',
    of: 'من',
    unsupportedFileType: 'نوع الملف غير مدعوم للعرض المباشر',
    documentPreview: 'معاينة المستند',
    dragDropFile: 'اسحب الملف هنا أو انقر للاختيار',
    supportedFormats: 'الملفات المدعومة: PDF, صور, مستندات',

    // Forms
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    address: 'العنوان',
    city: 'المدينة',
    country: 'الدولة',
    description: 'الوصف',
    status: 'الحالة',
    type: 'النوع',
    date: 'التاريخ',
    amount: 'المبلغ',
    notes: 'الملاحظات',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',

    // Case Management
    caseNumber: 'رقم القضية',
    caseType: 'نوع القضية',
    courtName: 'اسم المحكمة',
    judge: 'القاضي',
    oppositeParty: 'الطرف الآخر',
    filingDate: 'تاريخ التسجيل',
    nextSessionDate: 'تاريخ الجلسة التالية',
    priority: 'الأولوية',
    budget: 'الميزانية',

    // Client Management
    clientName: 'اسم العميل',
    clientType: 'نوع العميل',
    individual: 'فرد',
    company: 'شركة',
    nationalId: 'الهوية الوطنية',
    kycStatus: 'حالة التحقق',
    conflictCheck: 'فحص التعارض',

    // Matter Management
    matterNumber: 'رقم الملف',
    matterType: 'نوع الملف',
    leadLawyer: 'المحامي الرئيسي',
    feeAgreement: 'اتفاقية الأتعاب',
    feeAmount: 'مبلغ الأتعاب',

    // Invoice Management
    invoiceNumber: 'رقم الفاتورة',
    invoiceDate: 'تاريخ الفاتورة',
    dueDate: 'تاريخ الاستحقاق',
    totalAmount: 'المبلغ الإجمالي',
    taxAmount: 'مبلغ الضريبة',
    finalAmount: 'المبلغ النهائي',
    paid: 'مدفوع',
    unpaid: 'غير مدفوع',
    overdue: 'متأخر عن الموعد',

    // Error Messages
    errorLoadingData: 'خطأ في تحميل البيانات',
    errorSavingData: 'خطأ في حفظ البيانات',
    errorDeletingData: 'خطأ في حذف البيانات',
    requiredField: 'هذا الحقل مطلوب',
    invalidEmail: 'البريد الإلكتروني غير صحيح',
    fileTooLarge: 'حجم الملف كبير جداً',

    // Success Messages
    dataSavedSuccessfully: 'تم حفظ البيانات بنجاح',
    dataDeletedSuccessfully: 'تم حذف البيانات بنجاح',
    dataUpdatedSuccessfully: 'تم تحديث البيانات بنجاح',
  },
  en: {
    // Navigation
    overview: 'Overview',
    cases: 'Cases',
    clients: 'Clients',
    invoices: 'Invoices',
    settings: 'Settings',
    dashboard: 'Dashboard',
    welcome: 'Welcome',
    logout: 'Logout',
    theme: 'Theme',
    language: 'Language',
    light: 'Light',
    dark: 'Dark',

    // Stats
    totalCases: 'Total Cases',
    totalClients: 'Total Clients',
    pendingInvoices: 'Pending Invoices',
    upcomingSessions: 'Upcoming Sessions',
    open: 'Open',
    pending: 'Pending',
    closed: 'Closed',
    matters: 'Matters',

    // Charts
    caseStatus: 'Case Status',
    monthlyRevenue: 'Monthly Revenue',
    recentActivities: 'Recent Activities',

    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',

    // Buttons
    addNew: 'Add New',
    comingSoon: 'Coming Soon...',

    // File Viewer
    download: 'Download',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    unsupportedFileType: 'Unsupported file type for direct preview',
    documentPreview: 'Document Preview',
    dragDropFile: 'Drag file here or click to select',
    supportedFormats: 'Supported formats: PDF, Images, Documents',

    // Forms
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    country: 'Country',
    description: 'Description',
    status: 'Status',
    type: 'Type',
    date: 'Date',
    amount: 'Amount',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',

    // Case Management
    caseNumber: 'Case Number',
    caseType: 'Case Type',
    courtName: 'Court Name',
    judge: 'Judge',
    oppositeParty: 'Opposite Party',
    filingDate: 'Filing Date',
    nextSessionDate: 'Next Session Date',
    priority: 'Priority',
    budget: 'Budget',

    // Client Management
    clientName: 'Client Name',
    clientType: 'Client Type',
    individual: 'Individual',
    company: 'Company',
    nationalId: 'National ID',
    kycStatus: 'KYC Status',
    conflictCheck: 'Conflict Check',

    // Matter Management
    matterNumber: 'Matter Number',
    matterType: 'Matter Type',
    leadLawyer: 'Lead Lawyer',
    feeAgreement: 'Fee Agreement',
    feeAmount: 'Fee Amount',

    // Invoice Management
    invoiceNumber: 'Invoice Number',
    invoiceDate: 'Invoice Date',
    dueDate: 'Due Date',
    totalAmount: 'Total Amount',
    taxAmount: 'Tax Amount',
    finalAmount: 'Final Amount',
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',

    // Error Messages
    errorLoadingData: 'Error loading data',
    errorSavingData: 'Error saving data',
    errorDeletingData: 'Error deleting data',
    requiredField: 'This field is required',
    invalidEmail: 'Invalid email address',
    fileTooLarge: 'File size is too large',

    // Success Messages
    dataSavedSuccessfully: 'Data saved successfully',
    dataDeletedSuccessfully: 'Data deleted successfully',
    dataUpdatedSuccessfully: 'Data updated successfully',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ar']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

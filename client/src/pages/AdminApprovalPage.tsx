import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, AlertCircle, Search, Mail } from "lucide-react";
import { useLanguage } from "@/_core/contexts/LanguageContext";

// Mock data for demonstration
const mockRequests = [
  {
    id: 1,
    email: "ahmed@example.com",
    fullName: "أحمد محمد علي",
    phone: "+966501234567",
    birthDate: "1990-05-15",
    firmName: "مكتب أحمد للمحاماة",
    licenseNumber: "LIC-2024-001",
    city: "الرياض",
    country: "السعودية",
    status: "pending",
    createdAt: "2026-02-26T10:30:00Z",
  },
  {
    id: 2,
    email: "fatima@example.com",
    fullName: "فاطمة علي السعيد",
    phone: "+966502345678",
    birthDate: "1992-03-20",
    firmName: "مكتب فاطمة للاستشارات القانونية",
    licenseNumber: "LIC-2024-002",
    city: "جدة",
    country: "السعودية",
    status: "pending",
    createdAt: "2026-02-26T11:15:00Z",
  },
  {
    id: 3,
    email: "mohammed@example.com",
    fullName: "محمد سالم الدوسري",
    phone: "+966503456789",
    birthDate: "1988-07-10",
    firmName: "مكتب الدوسري للمحاماة",
    licenseNumber: "LIC-2024-003",
    city: "الدمام",
    country: "السعودية",
    status: "approved",
    createdAt: "2026-02-25T14:45:00Z",
  },
];

interface RegistrationRequest {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  birthDate: string;
  firmName: string;
  licenseNumber?: string;
  city: string;
  country: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function AdminApprovalPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [requests, setRequests] = useState<RegistrationRequest[]>(mockRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [generatedIdentifier, setGeneratedIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const translations = {
    ar: {
      title: "لوحة الموافقة على طلبات التسجيل",
      subtitle: "إدارة طلبات التسجيل الجديدة والموافقة عليها",
      pending: "قيد الانتظار",
      approved: "موافق عليه",
      rejected: "مرفوض",
      allRequests: "جميع الطلبات",
      pendingRequests: "الطلبات المعلقة",
      approvedRequests: "الطلبات الموافق عليها",
      rejectedRequests: "الطلبات المرفوضة",
      search: "ابحث عن البريد أو الاسم...",
      viewDetails: "عرض التفاصيل",
      approve: "موافقة",
      reject: "رفض",
      send: "إرسال",
      close: "إغلاق",
      requestDetails: "تفاصيل الطلب",
      personalInfo: "البيانات الشخصية",
      firmInfo: "بيانات المكتب",
      email: "البريد الإلكتروني",
      fullName: "الاسم الكامل",
      phone: "رقم الهاتف",
      birthDate: "تاريخ الميلاد",
      firmName: "اسم المكتب",
      licenseNumber: "رقم الترخيص",
      city: "المدينة",
      country: "الدولة",
      createdAt: "تاريخ الطلب",
      approveRequest: "الموافقة على الطلب",
      approveDesc: "هل أنت متأكد من الموافقة على هذا الطلب؟",
      generateIdentifier: "سيتم إنشاء معرف فريد للمكتب",
      identifier: "المعرف الفريد",
      rejectRequest: "رفض الطلب",
      rejectDesc: "أدخل سبب الرفض",
      rejectionReason: "سبب الرفض",
      confirmApprove: "تأكيد الموافقة",
      confirmReject: "تأكيد الرفض",
      sendEmail: "إرسال بريد إلكتروني",
      emailSent: "تم إرسال البريد الإلكتروني بنجاح",
      noResults: "لا توجد نتائج",
      pendingCount: "معلق",
      approvedCount: "موافق عليه",
      rejectedCount: "مرفوض",
    },
    en: {
      title: "Registration Approval Dashboard",
      subtitle: "Manage and approve new registration requests",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      allRequests: "All Requests",
      pendingRequests: "Pending Requests",
      approvedRequests: "Approved Requests",
      rejectedRequests: "Rejected Requests",
      search: "Search by email or name...",
      viewDetails: "View Details",
      approve: "Approve",
      reject: "Reject",
      send: "Send",
      close: "Close",
      requestDetails: "Request Details",
      personalInfo: "Personal Information",
      firmInfo: "Firm Information",
      email: "Email",
      fullName: "Full Name",
      phone: "Phone",
      birthDate: "Date of Birth",
      firmName: "Firm Name",
      licenseNumber: "License Number",
      city: "City",
      country: "Country",
      createdAt: "Request Date",
      approveRequest: "Approve Request",
      approveDesc: "Are you sure you want to approve this request?",
      generateIdentifier: "A unique identifier will be generated for the firm",
      identifier: "Unique Identifier",
      rejectRequest: "Reject Request",
      rejectDesc: "Enter the reason for rejection",
      rejectionReason: "Rejection Reason",
      confirmApprove: "Confirm Approval",
      confirmReject: "Confirm Rejection",
      sendEmail: "Send Email",
      emailSent: "Email sent successfully",
      noResults: "No results found",
      pendingCount: "Pending",
      approvedCount: "Approved",
      rejectedCount: "Rejected",
    },
  };

  const t = translations[isArabic ? "ar" : "en"];

  const filteredRequests = requests.filter(
    (req) =>
      req.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter((r) => r.status === "pending");
  const approvedRequests = filteredRequests.filter((r) => r.status === "approved");
  const rejectedRequests = filteredRequests.filter((r) => r.status === "rejected");

  const generateIdentifier = (firmName: string) => {
    const sanitized = firmName
      .replace(/\s+/g, "_")
      .toLowerCase()
      .substring(0, 15);
    return `@${sanitized}#`;
  };

  const handleApprove = (request: RegistrationRequest) => {
    const identifier = generateIdentifier(request.firmName);
    setGeneratedIdentifier(identifier);
    setSelectedRequest(request);
  };

  const handleReject = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
  };

  const confirmApprove = () => {
    if (selectedRequest) {
      setLoading(true);
      // TODO: Call API to approve request
      setTimeout(() => {
        setRequests(
          requests.map((r) =>
            r.id === selectedRequest.id ? { ...r, status: "approved" } : r
          )
        );
        setLoading(false);
        setSelectedRequest(null);
        setGeneratedIdentifier("");
      }, 1000);
    }
  };

  const confirmReject = () => {
    if (selectedRequest && rejectionReason) {
      setLoading(true);
      // TODO: Call API to reject request
      setTimeout(() => {
        setRequests(
          requests.map((r) =>
            r.id === selectedRequest.id ? { ...r, status: "rejected" } : r
          )
        );
        setLoading(false);
        setSelectedRequest(null);
        setRejectionReason("");
      }, 1000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
            <Clock size={14} className="mr-1" />
            {t.pending}
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800">
            <CheckCircle2 size={14} className="mr-1" />
            {t.approved}
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800">
            <XCircle size={14} className="mr-1" />
            {t.rejected}
          </Badge>
        );
      default:
        return null;
    }
  };

  const RequestCard = ({ request }: { request: RegistrationRequest }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{request.fullName}</h3>
            <p className="text-sm text-gray-600">{request.email}</p>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-gray-600">{t.phone}</p>
            <p className="font-medium">{request.phone}</p>
          </div>
          <div>
            <p className="text-gray-600">{t.firmName}</p>
            <p className="font-medium">{request.firmName}</p>
          </div>
          <div>
            <p className="text-gray-600">{t.city}</p>
            <p className="font-medium">{request.city}</p>
          </div>
          <div>
            <p className="text-gray-600">{t.createdAt}</p>
            <p className="font-medium">
              {new Date(request.createdAt).toLocaleDateString(isArabic ? "ar-SA" : "en-US")}
            </p>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(request)}
                >
                  <CheckCircle2 size={16} className="mr-1" />
                  {t.approve}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.approveRequest}</DialogTitle>
                  <DialogDescription>{t.approveDesc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">{t.generateIdentifier}</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-white px-3 py-2 rounded border border-blue-200 font-mono text-lg font-bold text-blue-600">
                        {generatedIdentifier}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(generatedIdentifier)}
                      >
                        {isArabic ? "نسخ" : "Copy"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      {t.close}
                    </Button>
                    <Button
                      onClick={confirmApprove}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {t.confirmApprove}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReject(request)}
                >
                  <XCircle size={16} className="mr-1" />
                  {t.reject}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.rejectRequest}</DialogTitle>
                  <DialogDescription>{t.rejectDesc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder={t.rejectionReason}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      {t.close}
                    </Button>
                    <Button
                      onClick={confirmReject}
                      disabled={loading || !rejectionReason}
                      variant="destructive"
                      className="flex-1"
                    >
                      {t.confirmReject}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${isArabic ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto">
        <CardHeader className="mb-6">
          <CardTitle className="text-3xl">{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</p>
                <p className="text-sm text-gray-600">{t.pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{approvedRequests.length}</p>
                <p className="text-sm text-gray-600">{t.approvedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{rejectedRequests.length}</p>
                <p className="text-sm text-gray-600">{t.rejectedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              {t.pendingRequests} ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              {t.approvedRequests} ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {t.rejectedRequests} ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingRequests.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t.noResults}</AlertDescription>
              </Alert>
            ) : (
              pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedRequests.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t.noResults}</AlertDescription>
              </Alert>
            ) : (
              approvedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedRequests.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t.noResults}</AlertDescription>
              </Alert>
            ) : (
              rejectedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

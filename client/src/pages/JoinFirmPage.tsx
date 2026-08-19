import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

export default function JoinFirmPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { user, loading } = useAuth();
  const requestsQuery = trpc.registration.mine.useQuery(undefined, { enabled: Boolean(user) });
  const [firmIdentifier, setFirmIdentifier] = useState("");
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [requestedRole, setRequestedRole] = useState<"lawyer" | "accountant" | "user">("user");
  const requestMutation = trpc.registration.requestToJoin.useMutation({
    onSuccess: async () => {
      setFirmIdentifier("");
      await requestsQuery.refetch();
    },
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{isArabic ? "جارٍ التحقق…" : "Checking…"}</div>;
  if (!user) return (
    <main className={`min-h-screen flex items-center justify-center p-4 ${isArabic ? "rtl" : "ltr"}`}>
      <Card className="w-full max-w-md"><CardHeader><CardTitle>{isArabic ? "طلب الانضمام إلى مكتب" : "Request to join a firm"}</CardTitle></CardHeader><CardContent><Button className="w-full" onClick={() => window.location.assign(getLoginUrl())}>{isArabic ? "تسجيل الدخول" : "Sign in"}</Button></CardContent></Card>
    </main>
  );

  if (user.lawFirmId) return (
    <main className={`min-h-screen flex items-center justify-center p-4 ${isArabic ? "rtl" : "ltr"}`}>
      <Card className="w-full max-w-md"><CardHeader><CardTitle>{isArabic ? "الحساب مرتبط بمكتب" : "Account already assigned"}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{isArabic ? "لا يمكن إرسال طلب انضمام جديد من حساب مرتبط بمكتب." : "An assigned account cannot submit another join request."}</p></CardContent></Card>
    </main>
  );

  return (
    <main className={`min-h-screen bg-muted/30 flex items-center justify-center p-4 ${isArabic ? "rtl" : "ltr"}`}>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{isArabic ? "طلب الانضمام إلى مكتب قائم" : "Request to join an existing firm"}</CardTitle>
          <CardDescription>{isArabic ? "أدخل معرف المكتب الذي يبدأ بـ @ وينتهي بـ #. سيظهر الطلب لمسؤولي المكتب للمراجعة." : "Enter the firm identifier beginning with @ and ending with #. Firm administrators will review your request."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requestMutation.error && <Alert variant="destructive"><AlertDescription>{requestMutation.error.message}</AlertDescription></Alert>}
          {requestMutation.data && <Alert><AlertDescription>{isArabic ? `تم إرسال الطلب إلى ${requestMutation.data.firmName} وهو الآن قيد المراجعة.` : `Your request was sent to ${requestMutation.data.firmName} and is pending review.`}</AlertDescription></Alert>}
          <form className="space-y-4" onSubmit={event => { event.preventDefault(); requestMutation.mutate({ firmIdentifier, fullName, phone: phone || undefined, requestedRole }); }}>
            <div className="grid gap-2"><Label htmlFor="firmIdentifier">{isArabic ? "معرف المكتب" : "Firm identifier"}</Label><Input id="firmIdentifier" value={firmIdentifier} onChange={event => setFirmIdentifier(event.target.value)} placeholder="@firm-name#" pattern="@[a-zA-Z0-9_-]+#" required dir="ltr" /></div>
            <div className="grid gap-2"><Label htmlFor="fullName">{isArabic ? "الاسم الكامل" : "Full name"}</Label><Input id="fullName" value={fullName} onChange={event => setFullName(event.target.value)} minLength={2} maxLength={255} required /></div>
            <div className="grid gap-2"><Label htmlFor="phone">{isArabic ? "الهاتف (اختياري)" : "Phone (optional)"}</Label><Input id="phone" value={phone} onChange={event => setPhone(event.target.value)} maxLength={32} dir="ltr" /></div>
            <div className="grid gap-2"><Label htmlFor="requestedRole">{isArabic ? "الدور المطلوب" : "Requested role"}</Label><select id="requestedRole" className="h-10 rounded-md border bg-background px-3 text-sm" value={requestedRole} onChange={event => setRequestedRole(event.target.value as typeof requestedRole)}><option value="user">{isArabic ? "مستخدم" : "User"}</option><option value="lawyer">{isArabic ? "محامٍ" : "Lawyer"}</option><option value="accountant">{isArabic ? "محاسب" : "Accountant"}</option></select></div>
            <Button className="w-full" type="submit" disabled={requestMutation.isPending}>{requestMutation.isPending ? (isArabic ? "جارٍ الإرسال…" : "Submitting…") : (isArabic ? "إرسال الطلب" : "Submit request")}</Button>
          </form>
          <section className="space-y-3">
            <h2 className="font-medium">{isArabic ? "طلباتي السابقة" : "My previous requests"}</h2>
            {requestsQuery.data?.length ? requestsQuery.data.map(request => <div key={request.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span>{request.email}</span><Badge variant={request.status === "pending" ? "secondary" : "outline"}>{request.status}</Badge></div>) : <p className="text-sm text-muted-foreground">{isArabic ? "لا توجد طلبات سابقة." : "No previous requests."}</p>}
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

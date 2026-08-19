import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ShieldCheck } from "lucide-react";

export default function InviteAcceptPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { user, loading } = useAuth();
  const [, params] = useRoute<{ token: string }>("/invite/:token");
  const acceptMutation = trpc.invitations.accept.useMutation();

  const accept = () => {
    if (params?.token) acceptMutation.mutate({ token: params.token });
  };

  const errorMessage = acceptMutation.error?.message;

  return (
    <main className={`min-h-screen bg-muted/30 flex items-center justify-center p-4 ${isArabic ? "rtl" : "ltr"}`}>
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>{isArabic ? "دعوة للانضمام إلى مكتب قانوني" : "Invitation to join a legal firm"}</CardTitle>
          <CardDescription>
            {isArabic ? "تأكد من دخولك بالحساب الذي استلم الدعوة قبل قبولها." : "Make sure you are signed in with the account that received this invitation."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isArabic ? "جارٍ التحقق من الجلسة…" : "Checking session…"}
            </div>
          ) : !user ? (
            <>
              <Alert>
                <AlertDescription>
                  {isArabic ? "يلزم تسجيل الدخول أولًا، ثم ستعود تلقائيًا إلى هذه الدعوة." : "Sign in first, then return to this invitation."}
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => window.location.assign(getLoginUrl())}>
                {isArabic ? "تسجيل الدخول" : "Sign in"}
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-background p-4 text-sm">
                <p className="font-medium">{isArabic ? "الحساب الحالي" : "Current account"}</p>
                <p className="mt-1 text-muted-foreground" dir="ltr">{user.email || user.name || "—"}</p>
              </div>
              {errorMessage && <Alert variant="destructive"><AlertDescription>{errorMessage}</AlertDescription></Alert>}
              {acceptMutation.data ? (
                <Alert><AlertDescription>{isArabic ? "تم قبول الدعوة. يمكنك الآن فتح لوحة المكتب." : "Invitation accepted. You can now open the firm dashboard."}</AlertDescription></Alert>
              ) : (
                <Button className="w-full" onClick={accept} disabled={acceptMutation.isPending || !params?.token}>
                  {acceptMutation.isPending ? (isArabic ? "جارٍ قبول الدعوة…" : "Accepting…") : (isArabic ? "قبول الدعوة والانضمام" : "Accept invitation")}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

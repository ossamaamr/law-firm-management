import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "@/_core/contexts/LanguageContext";

// Validation schema
const loginSchema = z.object({
  firmIdentifier: z.string()
    .min(1, "معرف المكتب مطلوب")
    .regex(/^@[a-zA-Z0-9_-]+#$/, "صيغة المعرف غير صحيحة. الصيغة الصحيحة: @اسم_المكتب#"),
  userName: z.string()
    .min(2, "اسم المستخدم يجب أن يكون حرفين على الأقل"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface FirmData {
  id: number;
  name: string;
  city: string;
  country: string;
  employees: Array<{
    id: number;
    name: string;
    role: string;
    email: string;
  }>;
  recentActivities: Array<{
    id: number;
    userName: string;
    action: string;
    entityType: string;
    timestamp: string;
  }>;
}

export default function LoginPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firmData, setFirmData] = useState<FirmData | null>(null);
  const [loginData, setLoginData] = useState<LoginFormData | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      firmIdentifier: "",
      userName: "",
      password: "",
    },
  });

  const translations = {
    ar: {
      title: "تسجيل الدخول",
      subtitle: "نظام إدارة المكاتب القانونية",
      firmIdentifier: "معرف المكتب",
      firmIdentifierPlaceholder: "@اسم_المكتب#",
      firmIdentifierDesc: "أدخل معرف مكتبك الفريد",
      userName: "اسم المستخدم",
      userNamePlaceholder: "أدخل اسمك",
      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      rememberMe: "تذكرني",
      forgotPassword: "هل نسيت كلمة المرور؟",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب جديد",
      loggingIn: "جاري تسجيل الدخول...",
      invalidCredentials: "معرف المكتب أو اسم المستخدم أو كلمة المرور غير صحيحة",
      firmNotFound: "المكتب المطلوب غير موجود",
      serverError: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً",
      welcomeMessage: "مرحباً بك في",
      firmInfo: "معلومات المكتب",
      firmName: "اسم المكتب",
      location: "الموقع",
      employees: "الموظفون",
      recentActivities: "النشاطات الأخيرة",
      role: "الدور",
      email: "البريد الإلكتروني",
      action: "الإجراء",
      timestamp: "الوقت",
      logout: "تسجيل الخروج",
      noActivities: "لا توجد نشاطات حديثة",
      viewDashboard: "عرض لوحة التحكم",
    },
    en: {
      title: "Login",
      subtitle: "Legal Practice Management System",
      firmIdentifier: "Firm Identifier",
      firmIdentifierPlaceholder: "@firm_name#",
      firmIdentifierDesc: "Enter your unique firm identifier",
      userName: "User Name",
      userNamePlaceholder: "Enter your name",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      rememberMe: "Remember me",
      forgotPassword: "Forgot password?",
      login: "Login",
      signup: "Create new account",
      loggingIn: "Logging in...",
      invalidCredentials: "Invalid firm identifier, username, or password",
      firmNotFound: "Firm not found",
      serverError: "Server error. Please try again later",
      welcomeMessage: "Welcome to",
      firmInfo: "Firm Information",
      firmName: "Firm Name",
      location: "Location",
      employees: "Employees",
      recentActivities: "Recent Activities",
      role: "Role",
      email: "Email",
      action: "Action",
      timestamp: "Time",
      logout: "Logout",
      noActivities: "No recent activities",
      viewDashboard: "View Dashboard",
    },
  };

  const t = translations[isArabic ? "ar" : "en"];

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // TODO: Call API to verify credentials and fetch firm data
      // For now, using mock data
      const mockFirmData: FirmData = {
        id: 1,
        name: "مكتب أحمد للمحاماة",
        city: "الرياض",
        country: "السعودية",
        employees: [
          { id: 1, name: "أحمد محمد", role: "محامي", email: "ahmed@firm.com" },
          { id: 2, name: "فاطمة علي", role: "محاسبة", email: "fatima@firm.com" },
          { id: 3, name: "محمود سالم", role: "مساعد قانوني", email: "mahmoud@firm.com" },
        ],
        recentActivities: [
          { id: 1, userName: "أحمد محمد", action: "إضافة", entityType: "ملف", timestamp: "2026-02-26 14:30" },
          { id: 2, userName: "فاطمة علي", action: "تعديل", entityType: "فاتورة", timestamp: "2026-02-26 13:45" },
          { id: 3, userName: "محمود سالم", action: "حذف", entityType: "مرفق", timestamp: "2026-02-26 12:20" },
        ],
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setLoginData(data);
      setFirmData(mockFirmData);
      setIsLoggedIn(true);
    } catch (error) {
      setErrorMessage(t.serverError);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setFirmData(null);
    setLoginData(null);
    form.reset();
  };

  // Login Form View
  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 ${isArabic ? "rtl" : "ltr"}`}>
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Firm Identifier */}
                <FormField
                  control={form.control}
                  name="firmIdentifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.firmIdentifier}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t.firmIdentifierPlaceholder}
                          {...field}
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>{t.firmIdentifierDesc}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* User Name */}
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.userName}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.userNamePlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.password}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder={t.passwordPlaceholder}
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remember Me & Forgot Password */}
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>{t.rememberMe}</span>
                  </label>
                  <a href="#" className="text-blue-600 hover:text-blue-800">
                    {t.forgotPassword}
                  </a>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-10"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.loggingIn}
                    </>
                  ) : (
                    t.login
                  )}
                </Button>

                {/* Signup Link */}
                <div className="text-center text-sm">
                  <span className="text-gray-600">{isArabic ? "ليس لديك حساب؟ " : "Don't have an account? "}</span>
                  <a href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold">
                    {t.signup}
                  </a>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard View After Login
  return (
    <div className={`min-h-screen bg-gray-50 p-6 ${isArabic ? "rtl" : "ltr"}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {t.welcomeMessage} {firmData?.name}! 👋
            </h1>
            <p className="text-gray-600">{loginData?.userName}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            {t.logout}
          </Button>
        </div>

        {/* Firm Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t.firmInfo}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t.firmName}</p>
                <p className="text-lg font-semibold">{firmData?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t.location}</p>
                <p className="text-lg font-semibold">
                  {firmData?.city}, {firmData?.country}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">{t.firmIdentifier}</p>
                <p className="text-lg font-semibold font-mono text-blue-600">
                  {loginData?.firmIdentifier}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employees Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t.employees} ({firmData?.employees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t.userName}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t.role}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">{t.email}</th>
                  </tr>
                </thead>
                <tbody>
                  {firmData?.employees.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{employee.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {employee.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{employee.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t.recentActivities}</CardTitle>
          </CardHeader>
          <CardContent>
            {firmData?.recentActivities.length === 0 ? (
              <p className="text-gray-600 text-center py-6">{t.noActivities}</p>
            ) : (
              <div className="space-y-4">
                {firmData?.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {activity.userName} <span className="text-gray-600 font-normal">{activity.action}</span> {activity.entityType}
                      </p>
                      <p className="text-sm text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Link */}
        <div className="mt-8 text-center">
          <Button className="bg-blue-600 hover:bg-blue-700 px-8 h-10">
            {t.viewDashboard}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/_core/contexts/LanguageContext";

// Validation schemas
const step1Schema = z.object({
  hasExistingIdentifier: z.boolean(),
  existingIdentifier: z.string().optional(),
});

const step2Schema = z.object({
  fullName: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل"),
  birthDate: z.string().min(1, "تاريخ الميلاد مطلوب"),
});

const step3Schema = z.object({
  firmName: z.string().min(3, "اسم المكتب يجب أن يكون 3 أحرف على الأقل"),
  licenseNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function SignupPage() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      hasExistingIdentifier: false,
      existingIdentifier: "",
    },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      birthDate: "",
    },
  });

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      firmName: "",
      licenseNumber: "",
      address: "",
      city: "",
      country: "",
    },
  });

  const onStep1Submit = (data: Step1Data) => {
    setStep1Data(data);
    if (data.hasExistingIdentifier && data.existingIdentifier) {
      // Verify existing identifier
      setLoading(true);
      // TODO: Call API to verify identifier
      setTimeout(() => {
        setLoading(false);
        setCurrentStep(4); // Go to confirmation
      }, 1000);
    } else {
      setCurrentStep(2);
    }
  };

  const onStep2Submit = (data: Step2Data) => {
    setStep2Data(data);
    if (step1Data?.hasExistingIdentifier) {
      setCurrentStep(4); // Skip firm details if using existing identifier
    } else {
      setCurrentStep(3);
    }
  };

  const onStep3Submit = (data: Step3Data) => {
    setStep3Data(data);
    setCurrentStep(4);
  };

  const onConfirmSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        ...step2Data,
        hasExistingIdentifier: step1Data?.hasExistingIdentifier,
        existingIdentifier: step1Data?.existingIdentifier,
        ...step3Data,
      };

      // TODO: Call API to submit registration
      console.log("Submitting registration:", payload);

      setSuccessMessage(
        isArabic
          ? "تم إرسال طلب التسجيل بنجاح! سيتم إرسال بريد إلكتروني إليك قريباً."
          : "Registration request submitted successfully! You will receive an email shortly."
      );

      // Reset form after success
      setTimeout(() => {
        form1.reset();
        form2.reset();
        form3.reset();
        setCurrentStep(1);
        setStep1Data(null);
        setStep2Data(null);
        setStep3Data(null);
      }, 2000);
    } catch (error) {
      setErrorMessage(
        isArabic ? "حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى." : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const translations = {
    ar: {
      title: "إنشاء حساب جديد",
      subtitle: "انضم إلى نظام إدارة المكاتب القانونية",
      step1Title: "هل لديك معرف موجود؟",
      step1Desc: "إذا كان لديك معرف مكتب موجود، يمكنك استخدامه للانضمام",
      hasIdentifier: "نعم، لدي معرف موجود",
      noIdentifier: "لا، أريد إنشاء معرف جديد",
      enterIdentifier: "أدخل معرفك",
      identifierFormat: "الصيغة: @اسم_المكتب#",
      step2Title: "البيانات الشخصية",
      step2Desc: "أدخل بياناتك الشخصية",
      fullName: "الاسم الكامل",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      birthDate: "تاريخ الميلاد",
      step3Title: "بيانات المكتب",
      step3Desc: "أدخل معلومات مكتبك القانوني",
      firmName: "اسم المكتب",
      licenseNumber: "رقم الترخيص",
      address: "العنوان",
      city: "المدينة",
      country: "الدولة",
      step4Title: "تأكيد البيانات",
      step4Desc: "تحقق من بياناتك قبل الإرسال",
      next: "التالي",
      previous: "السابق",
      submit: "إرسال الطلب",
      cancel: "إلغاء",
      confirm: "تأكيد",
      verifying: "جاري التحقق...",
      submitting: "جاري الإرسال...",
      success: "تم بنجاح!",
      error: "حدث خطأ",
    },
    en: {
      title: "Create New Account",
      subtitle: "Join the Legal Practice Management System",
      step1Title: "Do you have an existing identifier?",
      step1Desc: "If you have an existing firm identifier, you can use it to join",
      hasIdentifier: "Yes, I have an existing identifier",
      noIdentifier: "No, I want to create a new identifier",
      enterIdentifier: "Enter your identifier",
      identifierFormat: "Format: @firm_name#",
      step2Title: "Personal Information",
      step2Desc: "Enter your personal details",
      fullName: "Full Name",
      email: "Email",
      phone: "Phone Number",
      birthDate: "Date of Birth",
      step3Title: "Firm Information",
      step3Desc: "Enter your law firm details",
      firmName: "Firm Name",
      licenseNumber: "License Number",
      address: "Address",
      city: "City",
      country: "Country",
      step4Title: "Confirm Information",
      step4Desc: "Review your information before submitting",
      next: "Next",
      previous: "Previous",
      submit: "Submit Request",
      cancel: "Cancel",
      confirm: "Confirm",
      verifying: "Verifying...",
      submitting: "Submitting...",
      success: "Success!",
      error: "Error",
    },
  };

  const t = translations[isArabic ? "ar" : "en"];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isArabic ? "rtl" : "ltr"}`}>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex flex-col items-center ${
                  step <= currentStep ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    step < currentStep
                      ? "bg-green-500 text-white"
                      : step === currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 size={20} /> : step}
                </div>
                <span className="text-xs font-medium">{isArabic ? `الخطوة ${step}` : `Step ${step}`}</span>
              </div>
            ))}
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {successMessage && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Existing Identifier */}
          {currentStep === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step1Title}</h3>
              <p className="text-gray-600 mb-6">{t.step1Desc}</p>
              <Form {...form1}>
                <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-6">
                  <FormField
                    control={form1.control}
                    name="hasExistingIdentifier"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="has-identifier"
                            checked={field.value === true}
                            onChange={() => field.onChange(true)}
                            className="w-4 h-4"
                          />
                          <label htmlFor="has-identifier" className="cursor-pointer">
                            {t.hasIdentifier}
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="no-identifier"
                            checked={field.value === false}
                            onChange={() => field.onChange(false)}
                            className="w-4 h-4"
                          />
                          <label htmlFor="no-identifier" className="cursor-pointer">
                            {t.noIdentifier}
                          </label>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form1.watch("hasExistingIdentifier") && (
                    <FormField
                      control={form1.control}
                      name="existingIdentifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.enterIdentifier}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.identifierFormat} {...field} />
                          </FormControl>
                          <FormDescription>{t.identifierFormat}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit" className="w-full">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t.next}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step2Title}</h3>
              <p className="text-gray-600 mb-6">{t.step2Desc}</p>
              <Form {...form2}>
                <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
                  <FormField
                    control={form2.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.fullName}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.fullName} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.email}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t.email} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.phone}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.phone} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form2.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.birthDate}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      {t.previous}
                    </Button>
                    <Button type="submit" className="flex-1">
                      {t.next}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 3: Firm Information */}
          {currentStep === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step3Title}</h3>
              <p className="text-gray-600 mb-6">{t.step3Desc}</p>
              <Form {...form3}>
                <form onSubmit={form3.handleSubmit(onStep3Submit)} className="space-y-4">
                  <FormField
                    control={form3.control}
                    name="firmName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.firmName}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.firmName} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form3.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.licenseNumber}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.licenseNumber} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form3.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.address}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.address} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form3.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.city}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.city} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form3.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.country}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.country} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1"
                    >
                      {t.previous}
                    </Button>
                    <Button type="submit" className="flex-1">
                      {t.next}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.step4Title}</h3>
              <p className="text-gray-600 mb-6">{t.step4Desc}</p>

              <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600">{t.fullName}</p>
                  <p className="font-semibold">{step2Data?.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.email}</p>
                  <p className="font-semibold">{step2Data?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t.phone}</p>
                  <p className="font-semibold">{step2Data?.phone}</p>
                </div>
                {!step1Data?.hasExistingIdentifier && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">{t.firmName}</p>
                      <p className="font-semibold">{step3Data?.firmName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t.city}</p>
                      <p className="font-semibold">{step3Data?.city}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(step1Data?.hasExistingIdentifier ? 1 : 3)}
                  className="flex-1"
                >
                  {t.previous}
                </Button>
                <Button
                  onClick={onConfirmSubmit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t.submit}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

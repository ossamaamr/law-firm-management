import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

/**
 * Authentication Hook
 * هوك المصادقة
 */

export interface SignupData {
  hasExistingIdentifier: boolean;
  firmIdentifier?: string;
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  firmName?: string;
  licenseNumber?: string;
  city?: string;
  country?: string;
}

export function useAuth() {
  const query = trpc.auth.me.useQuery();
  return { user: query.data, isLoading: query.isLoading, error: query.error?.message ?? null };
}

export interface LoginData {
  firmIdentifier: string;
  userName: string;
  password: string;
}

export function useAuthSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: (data) => {
      setError(null);
      // Redirect to success page or login
      navigate("/login");
    },
    onError: (error) => {
      setError(error.message || "حدث خطأ أثناء التسجيل");
    },
  });

  const signup = useCallback(
    async (data: SignupData) => {
      setIsLoading(true);
      setError(null);

      try {
        await signupMutation.mutateAsync(data);
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء التسجيل");
      } finally {
        setIsLoading(false);
      }
    },
    [signupMutation]
  );

  return {
    signup,
    isLoading,
    error,
    isSuccess: signupMutation.isSuccess,
  };
}

export function useAuthLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setError(null);
      navigate("/dashboard");
    },
    onError: (error) => {
      setError(error.message || "بيانات الدخول غير صحيحة");
    },
  });

  const login = useCallback(
    async (data: LoginData) => {
      setIsLoading(true);
      setError(null);

      try {
        await loginMutation.mutateAsync(data);
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
      } finally {
        setIsLoading(false);
      }
    },
    [loginMutation]
  );

  return {
    login,
    isLoading,
    error,
    isSuccess: loginMutation.isSuccess,
  };
}

export function useVerifyIdentifier() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const verify = useCallback(
    async (firmIdentifier: string) => {
      setIsLoading(true);
      setError(null);

      try {
        return await utils.auth.verifyIdentifier.fetch({ firmIdentifier });
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء التحقق");
        return { exists: false, firmId: null };
      } finally {
        setIsLoading(false);
      }
    },
    [utils]
  );

  return {
    verify,
    isLoading,
    error,
  };
}

export function useAdminApproval() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveMutation = trpc.auth.approveRegistration.useMutation({
    onSuccess: (data) => {
      setError(null);
    },
    onError: (error) => {
      setError(error.message || "حدث خطأ أثناء الموافقة");
    },
  });

  const rejectMutation = trpc.auth.rejectRegistration.useMutation({
    onSuccess: (data) => {
      setError(null);
    },
    onError: (error) => {
      setError(error.message || "حدث خطأ أثناء الرفض");
    },
  });

  const approve = useCallback(
    async (requestId: number, firmName: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await approveMutation.mutateAsync({ requestId, firmName });
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء الموافقة");
      } finally {
        setIsLoading(false);
      }
    },
    [approveMutation]
  );

  const reject = useCallback(
    async (requestId: number, rejectionReason: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await rejectMutation.mutateAsync({ requestId, rejectionReason });
      } catch (err: any) {
        setError(err.message || "حدث خطأ أثناء الرفض");
      } finally {
        setIsLoading(false);
      }
    },
    [rejectMutation]
  );

  return {
    approve,
    reject,
    isLoading,
    error,
    isApproveSuccess: approveMutation.isSuccess,
    isRejectSuccess: rejectMutation.isSuccess,
  };
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api/auth';
import { LoginData } from '@/lib/types/user';
import { useAuth } from '@/lib/contexts/AuthContext';

// 登入表單驗證 schema
const formSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件地址'),
  password: z.string().min(1, '請輸入密碼'),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    // 檢查 URL 參數是否含有 registered=true
    const isRegistered = searchParams.get('registered');
    if (isRegistered) {
      setSuccessMessage('註冊成功，請登入您的帳戶');
    }
  }, [searchParams]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const loginData: LoginData = {
        email: data.email,
        password: data.password,
      };
      
      const response = await authApi.login(loginData);
      
      // 使用 AuthContext 的 login 函數更新身份驗證狀態
      login(response.user);
      
      // 登入成功後跳轉到首頁
      router.push('/');
    } catch (err: any) {
      console.error('登入失敗:', err);
      setError(err.response?.data?.message || '登入失敗，請檢查您的憑證');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            登入您的帳戶
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            還沒有帳戶？{' '}
            <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              註冊
            </Link>
          </p>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                電子郵件
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                忘記密碼？
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? '處理中...' : '登入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
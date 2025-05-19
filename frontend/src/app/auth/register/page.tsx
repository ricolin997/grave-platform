'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/api/auth';
import { RegisterData } from '@/lib/types/user';

// 註冊表單驗證 schema
const formSchema = z.object({
  role: z.enum(['buyer', 'seller'], {
    required_error: '請選擇您的角色',
  }),
  name: z.string().min(2, '姓名至少需要2個字元'),
  email: z.string().email('請輸入有效的電子郵件地址'),
  password: z.string().min(6, '密碼至少需要6個字元'),
  confirmPassword: z.string().min(6, '密碼至少需要6個字元'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: '密碼不匹配',
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'buyer',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      
      const registerData: RegisterData = {
        role: data.role,
        name: data.name,
        email: data.email,
        password: data.password,
      };
      
      await authApi.register(registerData);
      
      // 註冊成功後跳轉到登入頁面
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      console.error('註冊失敗:', err);
      setError(err.response?.data?.message || '註冊失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            創建新帳戶
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有帳戶？{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              登入
            </Link>
          </p>
        </div>
        
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
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                角色
              </label>
              <select
                id="role"
                {...register('role')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="buyer">買家</option>
                <option value="seller">賣家</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            
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
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                確認密碼
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? '處理中...' : '註冊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PiggyBank, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [authError, setAuthError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setAuthError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      setAuthError('Email ou senha incorretos.')
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0e17]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm space-y-8 relative">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-xl shadow-brand-900/50 glow">
            <PiggyBank size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient">PoupaMeta</h1>
            <p className="text-slate-400 text-sm mt-1">Entre na sua conta</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#13151f] border border-white/8 rounded-2xl p-6 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                label="Senha"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {authError && (
              <p className="text-sm text-red-400 text-center">{authError}</p>
            )}

            <div className="flex justify-end">
              <Link
                href="/recuperar-senha"
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
              id="btn-entrar"
            >
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Não tem conta?{' '}
            <Link
              href="/cadastro"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

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
      setIsRedirecting(true)
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

      {/* Redirecting Modal Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0e17]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#13151f] border border-brand-500/20 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-5 animate-in zoom-in-95 duration-300">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-600/20 shadow-xl shadow-brand-900/50 glow animate-pulse">
              <PiggyBank size={36} className="text-brand-400" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">Quase lá!</h2>
              <p className="text-brand-400/80 text-sm font-medium">
                Abrindo o seu cofre...
              </p>
            </div>
          </div>
        </div>
      )}

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
              disabled={isCheckingAuth || isSubmitting}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                label="Senha"
                placeholder="••••••••"
                disabled={isCheckingAuth || isSubmitting}
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                disabled={isCheckingAuth || isSubmitting}
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-9 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {authError && (
              <p className="text-sm text-red-400 text-center">{authError}</p>
            )}

            <div className="flex justify-end">
              <Link
                href={isCheckingAuth ? "#" : "/recuperar-senha"}
                className={`text-xs text-brand-400 transition-colors ${isCheckingAuth ? 'opacity-50 cursor-default pointer-events-none' : 'hover:text-brand-300'}`}
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isCheckingAuth || isSubmitting}
              disabled={isCheckingAuth || isSubmitting}
              className="w-full transition-all"
              id="btn-entrar"
            >
              {isCheckingAuth ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Não tem conta?{' '}
            <Link
              href={isCheckingAuth ? "#" : "/cadastro"}
              className={`text-brand-400 font-medium transition-colors ${isCheckingAuth ? 'opacity-50 cursor-default pointer-events-none' : 'hover:text-brand-300'}`}
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

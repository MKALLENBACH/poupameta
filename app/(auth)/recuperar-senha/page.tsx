'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { PiggyBank } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

export default function RecuperarSenhaPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0e17]">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 shadow-xl glow">
            <PiggyBank size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Recuperar Senha</h1>
        </div>

        <div className="bg-[#13151f] border border-white/8 rounded-2xl p-6 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-3 py-2">
              <div className="text-4xl">📧</div>
              <p className="text-sm text-slate-300">
                Link de recuperação enviado! Verifique seu email.
              </p>
              <Link href="/login">
                <Button variant="outline" size="md" className="w-full mt-2">
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email"
                placeholder="seu@email.com"
                error={errors.email?.message}
                {...register('email')}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                className="w-full"
              >
                Enviar link
              </Button>
              <p className="text-center text-sm text-slate-500">
                <Link href="/login" className="text-brand-400 hover:text-brand-300">
                  Voltar ao Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { PiggyBank, X, Download } from 'lucide-react'
import Button from '@/components/ui/Button'

export function InstallPrompt() {
  const [isMobile, setIsMobile] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone || 
                             document.referrer.includes('android-app://')
    
    setIsStandalone(isStandaloneMode)

    if (isStandaloneMode) return

    // Detect User Agent
    const ua = window.navigator.userAgent
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream

    setIsMobile(mobile)
    setIsIOS(ios)

    // Handle standard Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (mobile) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Show custom prompt for iOS after a slight delay if mobile
    if (mobile && ios) {
      const timer = setTimeout(() => setShowPrompt(true), 1500)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If iOS, just close it (they have to follow manual instructions below)
      if (isIOS) setShowPrompt(false)
      return
    }

    // Show the native prompt
    deferredPrompt.prompt()
    
    // Wait for user to respond
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    
    // Clear prompt
    setDeferredPrompt(null)
  }

  if (!showPrompt || isStandalone || !isMobile) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 max-w-sm mx-auto">
      <div className="bg-[#1a1d2e] border border-brand-500/30 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 relative overflow-hidden">
        {/* Close Button */}
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center border border-brand-500/20">
            <PiggyBank className="text-brand-400" size={24} />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-white font-semibold text-sm">Instalar PoupaMeta</h3>
            <p className="text-slate-400 text-xs mt-0.5 leading-snug">
              Adicione à tela inicial para acesso rápido e experiência de aplicativo.
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-white/5 rounded-lg p-3 text-xs text-slate-300">
            <p>Para instalar no iOS:</p>
            <ol className="list-decimal pl-4 mt-1 space-y-1">
              <li>Toque no botão de Compartilhar <span className="inline-block px-1 border border-white/20 rounded mx-1">⎋</span></li>
              <li>Role para baixo e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong> <span className="inline-block px-1 border border-white/20 rounded mx-1">+</span></li>
            </ol>
          </div>
        ) : (
          <Button 
            variant="primary" 
            size="sm" 
            className="w-full flex items-center justify-center gap-2"
            onClick={handleInstallClick}
          >
            <Download size={16} />
            Instalar App
          </Button>
        )}
      </div>
    </div>
  )
}

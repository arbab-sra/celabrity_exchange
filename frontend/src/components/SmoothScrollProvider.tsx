'use client'

import { ReactLenis } from '@studio-freight/react-lenis'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
interface LenisProviderProps {
  children: ReactNode
}

function LenisProvider({ children}:LenisProviderProps) {
  const pathname = usePathname()

  useEffect(() => {
    const lenis = (document.documentElement as any).lenis
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    }
  }, [pathname])

  const lenisOptions = {
    lerp: 0.1, // Adjust the smoothness of the scroll
    duration: 1.2,
    easing: (t:number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothTouch: true,
  }

  return (
    <ReactLenis root options={lenisOptions}>
      {children as any}
    </ReactLenis>
  )
}

export default LenisProvider

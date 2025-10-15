'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/providers/ThemeProvider'
import { Button } from './ui/button'

export function ThemeToggle() {
  const {  toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-all duration-300"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-purple-300" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

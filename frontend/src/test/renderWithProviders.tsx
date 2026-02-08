import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ThemeProvider } from '../context/ThemeContext'
import { TaskTreeProvider } from '../context/TaskTreeContext'
import { TimerProvider } from '../context/TimerContext'

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TaskTreeProvider>
        <TimerProvider>
          {children}
        </TimerProvider>
      </TaskTreeProvider>
    </ThemeProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.tsx'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { ThemeProvider } from './context/ThemeContext'
import { TaskTreeProvider } from './context/TaskTreeContext'
import { MemoProvider } from './context/MemoContext'
import { TimerProvider } from './context/TimerContext'
import { AudioProvider } from './context/AudioContext'
import { NoteProvider } from './context/NoteContext'
import { CalendarProvider } from './context/CalendarContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <TaskTreeProvider>
          <CalendarProvider>
          <MemoProvider>
            <NoteProvider>
              <TimerProvider>
                <AudioProvider>
                  <App />
                </AudioProvider>
              </TimerProvider>
            </NoteProvider>
          </MemoProvider>
          </CalendarProvider>
        </TaskTreeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

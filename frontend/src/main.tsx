import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './context/ThemeContext'
import { TaskTreeProvider } from './context/TaskTreeContext'
import { MemoProvider } from './context/MemoContext'
import { TimerProvider } from './context/TimerContext'
import { AudioProvider } from './context/AudioContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <TaskTreeProvider>
          <MemoProvider>
            <TimerProvider>
              <AudioProvider>
                <App />
              </AudioProvider>
            </TimerProvider>
          </MemoProvider>
        </TaskTreeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

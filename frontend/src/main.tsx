import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext'
import { TaskTreeProvider } from './context/TaskTreeContext'
import { TimerProvider } from './context/TimerContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TaskTreeProvider>
        <TimerProvider>
          <App />
        </TimerProvider>
      </TaskTreeProvider>
    </ThemeProvider>
  </StrictMode>,
)

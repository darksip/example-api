import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'

export type Page = 'chat' | 'conversations' | 'settings'

interface LayoutProps {
  children: ReactNode
  currentPage: Page
  onNavigate: (page: Page) => void
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div className="layout">
      <header className="layout-header">
        <h1 className="logo">Halapi Demo</h1>
        <nav className="nav">
          <button
            className={`nav-item ${currentPage === 'chat' ? 'active' : ''}`}
            onClick={() => onNavigate('chat')}
            type="button"
          >
            Chat
          </button>
          <button
            className={`nav-item ${currentPage === 'conversations' ? 'active' : ''}`}
            onClick={() => onNavigate('conversations')}
            type="button"
          >
            Conversations
          </button>
          <button
            className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => onNavigate('settings')}
            type="button"
          >
            <Settings size={16} />
            Settings
          </button>
        </nav>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  )
}

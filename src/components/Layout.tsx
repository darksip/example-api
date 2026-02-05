import { Settings } from 'lucide-react'
import type { ReactNode } from 'react'

/** Available pages in the application */
export type Page = 'chat' | 'conversations' | 'settings'

interface LayoutProps {
  /** Content to render in the main area */
  children: ReactNode
  /** Currently active page for navigation highlighting */
  currentPage: Page
  /** Callback when user clicks a navigation item */
  onNavigate: (page: Page) => void
}

/**
 * Layout wrapper component with header navigation.
 * Provides the main structure with logo, nav buttons, and content area.
 */
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

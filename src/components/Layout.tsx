import { Settings, User } from 'lucide-react'
import type { ReactNode } from 'react'
import type { VirtualUser } from '../config/api'

/** Available pages in the application */
export type Page = 'chat' | 'conversations' | 'settings'

interface LayoutProps {
  /** Content to render in the main area */
  children: ReactNode
  /** Currently active page for navigation highlighting */
  currentPage: Page
  /** Callback when user clicks a navigation item */
  onNavigate: (page: Page) => void
  /** Currently selected virtual user */
  currentUser: VirtualUser | null
  /** List of all virtual users */
  virtualUsers: VirtualUser[]
  /** Callback when user changes the current virtual user */
  onUserChange: (userId: string | null) => void
}

/**
 * Layout wrapper component with header navigation.
 * Provides the main structure with logo, nav buttons, user selector, and content area.
 */
export function Layout({
  children,
  currentPage,
  onNavigate,
  currentUser,
  virtualUsers,
  onUserChange,
}: LayoutProps) {
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
        {virtualUsers.length > 0 && (
          <div className="header-user-selector">
            <User size={14} />
            <select
              value={currentUser?.id || ''}
              onChange={(e) => onUserChange(e.target.value || null)}
              className="header-user-select"
            >
              {!currentUser && <option value="">Sélectionner un utilisateur</option>}
              {virtualUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>
      <main className="layout-main">{children}</main>
    </div>
  )
}

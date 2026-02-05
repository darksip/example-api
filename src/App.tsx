/**
 * Main application component for the Halapi chat application.
 *
 * This module handles:
 * - Page routing between Chat, Conversations, and Settings pages
 * - Navigation state management
 * - Configuration-based access control (redirects to settings if unconfigured)
 * - Conversation selection and continuation
 *
 * @module App
 */

import { useCallback, useEffect, useState } from 'react'
import { Layout, type Page } from './components/Layout'
import { isConfigured } from './config/api'
import { ChatPage } from './pages/ChatPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { SettingsPage } from './pages/SettingsPage'

/**
 * Root application component that manages routing and navigation state.
 *
 * The app uses a simple state-based routing approach:
 * - 'chat': Main chat interface (default when configured)
 * - 'conversations': List of previous conversations
 * - 'settings': Token configuration page (default when unconfigured)
 *
 * Navigation is restricted when the API is not configured - users can only
 * access the settings page until they register a valid token.
 *
 * @returns The rendered application wrapped in the Layout component
 *
 * @example
 * // In main.tsx
 * createRoot(rootElement).render(
 *   <StrictMode>
 *     <App />
 *   </StrictMode>
 * )
 */
function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() =>
    isConfigured() ? 'chat' : 'settings'
  )
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    undefined
  )

  // Redirect to settings if not configured
  useEffect(() => {
    if (!isConfigured() && currentPage !== 'settings') {
      setCurrentPage('settings')
    }
  }, [currentPage])

  /**
   * Handles navigation between pages.
   *
   * Enforces access control by preventing navigation away from settings
   * when the API is not configured. Clears the selected conversation
   * when navigating away from the chat page.
   *
   * @param page - The target page to navigate to ('chat', 'conversations', or 'settings')
   */
  const handleNavigate = useCallback((page: Page) => {
    // Don't allow navigation away from settings if not configured
    if (page !== 'settings' && !isConfigured()) {
      return
    }
    setCurrentPage(page)
    if (page !== 'chat') {
      setSelectedConversationId(undefined)
    }
  }, [])

  /**
   * Handles conversation selection from the ConversationsPage.
   *
   * Sets the selected conversation ID and navigates to the chat page
   * to continue the conversation.
   *
   * @param id - The unique identifier of the selected conversation
   */
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id)
    setCurrentPage('chat')
  }, [])

  /**
   * Renders the appropriate page component based on current navigation state.
   *
   * @returns The page component for the current route
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatPage conversationId={selectedConversationId} />
      case 'conversations':
        return <ConversationsPage onSelectConversation={handleSelectConversation} />
      case 'settings':
        return <SettingsPage />
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  )
}

export default App

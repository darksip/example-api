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
import {
  getCurrentUser,
  getVirtualUsers,
  halapiClient,
  isConfigured,
  setCurrentUser as setCurrentUserStorage,
  type VirtualUser,
} from './config/api'
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
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    if (!isConfigured()) return 'settings'
    // Also require at least one virtual user
    if (getVirtualUsers().length === 0) return 'settings'
    return 'chat'
  })
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    undefined
  )

  // Virtual users state
  const [virtualUsers, setVirtualUsers] = useState<VirtualUser[]>([])
  const [currentUser, setCurrentUser] = useState<VirtualUser | null>(null)

  // Load virtual users and current user on mount
  useEffect(() => {
    if (isConfigured()) {
      setVirtualUsers(getVirtualUsers())
      setCurrentUser(getCurrentUser())
    }
  }, [])

  // Redirect to settings if not configured or no virtual users
  useEffect(() => {
    const needsSetup = !isConfigured() || virtualUsers.length === 0
    if (needsSetup && currentPage !== 'settings') {
      setCurrentPage('settings')
    }
  }, [currentPage, virtualUsers.length])

  /**
   * Handles changing the current virtual user.
   * Fetches the most recent conversation for the new user and navigates to it.
   */
  const handleUserChange = useCallback(async (userId: string | null) => {
    // Update storage and state
    setCurrentUserStorage(userId)
    const newUser = userId ? virtualUsers.find((u) => u.id === userId) || null : null
    setCurrentUser(newUser)

    // Fetch the most recent conversation for this user
    if (isConfigured()) {
      try {
        const response = await halapiClient.getConversations(userId || undefined, 1)
        const firstConversation = response.conversations[0]
        if (firstConversation) {
          // Load the most recent conversation
          setSelectedConversationId(firstConversation.id)
          setCurrentPage('chat')
        } else {
          // No conversations for this user, start fresh
          setSelectedConversationId(undefined)
          setCurrentPage('chat')
        }
      } catch {
        // On error, just go to chat without a conversation
        setSelectedConversationId(undefined)
        setCurrentPage('chat')
      }
    }
  }, [virtualUsers])

  /**
   * Refreshes the virtual users list (called after adding/removing users in Settings)
   */
  const refreshVirtualUsers = useCallback(() => {
    setVirtualUsers(getVirtualUsers())
    setCurrentUser(getCurrentUser())
  }, [])

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
    // Don't allow navigation away from settings if not configured or no users
    const needsSetup = !isConfigured() || virtualUsers.length === 0
    if (page !== 'settings' && needsSetup) {
      return
    }
    setCurrentPage(page)
    if (page !== 'chat') {
      setSelectedConversationId(undefined)
    }
  }, [virtualUsers.length])

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
        return <ChatPage conversationId={selectedConversationId} currentUser={currentUser} />
      case 'conversations':
        return <ConversationsPage onSelectConversation={handleSelectConversation} currentUser={currentUser} />
      case 'settings':
        return <SettingsPage onUsersChange={refreshVirtualUsers} />
    }
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      currentUser={currentUser}
      virtualUsers={virtualUsers}
      onUserChange={handleUserChange}
    >
      {renderPage()}
    </Layout>
  )
}

export default App

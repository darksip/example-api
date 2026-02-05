import { useCallback, useEffect, useState } from 'react'
import { Layout, type Page } from './components/Layout'
import { isConfigured } from './config/api'
import { ChatPage } from './pages/ChatPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { SettingsPage } from './pages/SettingsPage'

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

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id)
    setCurrentPage('chat')
  }, [])

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

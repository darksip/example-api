import { useCallback, useState } from 'react'
import { AuthGate } from './components/AuthGate'
import { Layout, type Page } from './components/Layout'
import { useAuth } from './hooks/useAuth'
import { ChatPage } from './pages/ChatPage'
import { ConversationsPage } from './pages/ConversationsPage'

function App() {
  const { isAuthenticated, isLoading, error, authenticate } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('chat')
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    undefined
  )

  const handleNavigate = useCallback((page: Page) => {
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
    }
  }

  // Show auth gate if not authenticated
  if (!isAuthenticated) {
    return <AuthGate isLoading={isLoading} error={error} onAuthenticate={authenticate} />
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  )
}

export default App

import { useCallback, useState } from 'react'
import { Layout, type Page } from './components/Layout'
import { ChatPage } from './pages/ChatPage'
import { ConversationsPage } from './pages/ConversationsPage'

function App() {
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

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  )
}

export default App

import { useCallback, useState } from 'react'
import { Layout, type Page } from './components/Layout'
import { ChatPage } from './pages/ChatPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { SettingsPage } from './pages/SettingsPage'

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

  const handleSettingsSave = useCallback(() => {
    // Force re-render of current page when settings are saved
  }, [])

  const renderPage = () => {
    switch (currentPage) {
      case 'chat':
        return (
          <ChatPage
            conversationId={selectedConversationId}
            onNavigateToSettings={() => handleNavigate('settings')}
          />
        )
      case 'conversations':
        return (
          <ConversationsPage
            onSelectConversation={handleSelectConversation}
            onNavigateToSettings={() => handleNavigate('settings')}
          />
        )
      case 'settings':
        return <SettingsPage onSave={handleSettingsSave} />
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  )
}

export default App

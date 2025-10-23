import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: 'Hello! How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: messages.length,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // TODO: Replace with your actual backend API endpoint
      // const response = await axios.post('http://localhost:3000/api/chat', {
      //   message: inputValue
      // })

      // For now, using a simple response logic
      const botResponse = await simulateBotResponse(inputValue.toLowerCase())

      const botMessage: Message = {
        id: messages.length + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }

      setTimeout(() => {
        setMessages(prev => [...prev, botMessage])
        setIsLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: messages.length + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  // Simulate bot response - Replace this with actual API call
  const simulateBotResponse = async (message: string): Promise<string> => {
    // This is where you'll integrate with your backend
    if (message.includes('name') || message.includes('what is your name')) {
      return 'My name is ChatBot! Nice to meet you.'
    } else if (message.includes('old') || message.includes('how old are you') || message.includes('age')) {
      return 'I am 1 year old. I was created recently!'
    } else if (message.includes('help')) {
      return 'I can help you with various questions. Just ask me anything!'
    } else {
      return "I'm here to help! Could you please rephrase your question?"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <button
          className="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-content">
              <div className="chatbot-avatar">🤖</div>
              <div className="chatbot-header-text">
                <h3>ChatBot</h3>
                <span className="chatbot-status">Online</span>
              </div>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'message-user' : 'message-bot'}`}
              >
                <div className="message-bubble">
                  {message.text}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message message-bot">
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="chatbot-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className="chatbot-send-btn"
              disabled={isLoading || !inputValue.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

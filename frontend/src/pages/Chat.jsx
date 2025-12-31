import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getResume, sendChatMessage } from '../services/api'
import { Send, MessageCircle, ArrowLeft, Loader } from 'lucide-react'

const Chat = () => {
  const { id } = useParams()
  const [resume, setResume] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchResume()
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchResume = async () => {
    try {
      const response = await getResume(id)
      setResume(response.data.resume)

      // Add initial greeting
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I've analyzed your resume. I can help you with:\n\n• Understanding your strengths and skills\n• Career advice and job recommendations\n• Interview preparation questions\n• Resume improvement suggestions\n\nWhat would you like to know?`
        }
      ])
    } catch (err) {
      console.error('Failed to load resume')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()

    if (!inputMessage.trim() || sending) return

    const userMessage = inputMessage.trim()
    setInputMessage('')

    // Add user message to chat
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setSending(true)

    try {
      const response = await sendChatMessage({
        resumeId: id,
        message: userMessage,
        conversationHistory: messages,
      })

      setMessages(response.data.conversationHistory)
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.'
        }
      ])
    } finally {
      setSending(false)
    }
  }

  const suggestedQuestions = [
    "What are my strongest skills?",
    "What jobs would be best for me?",
    "How can I improve my resume?",
    "What interview questions should I prepare for?",
    "What skills should I learn next?"
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              to={`/resume/${id}`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Resume Assistant</h1>
              <p className="text-sm text-gray-600">
                {resume?.parsedData?.name || resume?.fileName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3">
                <Loader className="h-5 w-5 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions (only show initially) */}
        {messages.length <= 1 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">Suggested questions:</p>
            <div className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputMessage(question)}
                  className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about your resume..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || sending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="h-5 w-5" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default Chat

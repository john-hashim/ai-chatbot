import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import chatbotRoutes from './routes/chatbot.routes.js'
import documentRoutes from './routes/document.routes.js'
import chatRoutes from './routes/chat.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/chatbot', analyticsRoutes)
app.use('/api/chatbot', chatbotRoutes)
app.use('/api/chatbot', documentRoutes)
app.use('/api/chatbot', chatRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'AI Chatbot Backend Server is running!' })
})

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export default app

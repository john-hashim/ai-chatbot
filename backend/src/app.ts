import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import chatbotRoutes from './routes/chatbot.routes.js'
import documentRoutes from './routes/document.routes.js'
import chatRoutes from './routes/chat.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'
import embedRoutes from './routes/embed.routes.js'
import bookingsRoutes from './routes/bookings.routes.js'
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
app.use('/api/embed', embedRoutes)
app.use('/api/chatbot', bookingsRoutes)

//Finding embed directory path and provide embed.js ( embed.js is same as embed.tsx from embed app)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const embedDistPath = path.join(__dirname, '../../embed/dist')
console.log(embedDistPath)
app.use('/embed-assets', express.static(embedDistPath))

app.get('/embed/:embedKey', (req, res) => {
  res.sendFile(path.join(embedDistPath, 'iframe.html'))
})

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

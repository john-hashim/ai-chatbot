import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import chatbotRoutes from './routes/chatbot.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/chatbot', chatbotRoutes)

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

# Chatbot Widget - Standalone Embeddable Application

A beautiful, standalone React chatbot widget that can be embedded in any website using iframe or script injection.

## 🚀 Features

- **Standalone Application**: Completely separate from your main app
- **Easy Embedding**: Two methods - iframe or script injection
- **Modern UI**: Beautiful gradient design with smooth animations
- **Responsive**: Works on desktop and mobile devices
- **Typing Indicator**: Shows when bot is thinking
- **Auto-scroll**: Automatically scrolls to latest messages
- **Timestamps**: Shows message time
- **Customizable**: Easy to modify colors, position, and behavior
- **Backend Ready**: Prepared for API integration

## 📁 Project Structure

```
chatbot-widget/
├── src/
│   ├── App.tsx          # Main chatbot component
│   ├── App.css          # Chatbot styles
│   ├── main.tsx         # React entry point
│   └── index.css        # Global styles
├── public/
│   └── embed.js         # Script for script injection embedding
├── examples/
│   ├── iframe-embed.html    # Example: iframe embedding
│   └── script-embed.html    # Example: script injection
├── vite.config.ts       # Optimized build configuration
└── package.json
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd chatbot-widget
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The widget will run on `http://localhost:5174`

### 3. Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## 📦 Embedding the Widget

### Method 1: iframe Embedding (Recommended)

Add this code to your HTML where you want the chatbot:

```html
<iframe
    src="http://localhost:5174"
    style="position: fixed; bottom: 0; right: 0; width: 100%; height: 100%; max-width: 420px; max-height: 680px; border: none; z-index: 999999;"
    title="Chatbot Widget"
    allow="autoplay">
</iframe>
```

**Pros:**
- Complete isolation (no CSS/JS conflicts)
- Works with any framework
- Easy to implement
- Secure

**Example:** See `examples/iframe-embed.html`

### Method 2: Script Injection

Add this code before closing `</body>` tag:

```html
<!-- Optional: Customize widget URL -->
<script>
  window.CHATBOT_WIDGET_URL = 'http://localhost:5174';
</script>

<!-- Load the embed script -->
<script src="http://localhost:5174/embed.js"></script>
```

**Pros:**
- One-line integration
- Automatically handles iframe creation
- Customizable via configuration

**Example:** See `examples/script-embed.html`

## 🎨 Customization

### Change Colors

Edit `src/App.css`:

```css
/* Change gradient colors */
.chatbot-toggle-btn {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

.chatbot-header {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Change Position

In `src/App.css`, modify `.chatbot-container`:

```css
.chatbot-container {
  position: fixed;
  bottom: 20px;    /* Distance from bottom */
  right: 20px;     /* Distance from right */
  /* Change to left: 20px; for left side */
}
```

### Change Size

In `src/App.css`, modify `.chatbot-window`:

```css
.chatbot-window {
  width: 380px;    /* Widget width */
  height: 600px;   /* Widget height */
}
```

### Modify Welcome Message

In `src/App.tsx`, change the initial message:

```typescript
const [messages, setMessages] = useState<Message[]>([
  {
    id: 0,
    text: 'Your custom welcome message here!',
    sender: 'bot',
    timestamp: new Date()
  }
])
```

## 🔌 Backend Integration

### Current Setup

The widget uses a simple response function (`simulateBotResponse`) in `src/App.tsx`.

### Connect to Your Backend

Replace the simulation with actual API calls:

```typescript
const handleSendMessage = async () => {
  // ... existing code ...

  try {
    // Call your backend API
    const response = await axios.post('http://localhost:3000/api/chat', {
      message: inputValue,
      userId: 'user-id',  // Optional: user identification
    })

    const botMessage: Message = {
      id: messages.length + 1,
      text: response.data.message,
      sender: 'bot',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, botMessage])
    setIsLoading(false)
  } catch (error) {
    console.error('Error:', error)
    // Handle error...
  }
}
```

### Backend Requirements

Your backend should accept:
```json
{
  "message": "user's message"
}
```

And return:
```json
{
  "message": "bot's response"
}
```

## 🌐 Deployment

### Deploy Widget

1. Build the widget:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to:
   - **Vercel**: `vercel deploy`
   - **Netlify**: Drag & drop `dist/` folder
   - **Your server**: Upload via FTP/SSH
   - **AWS S3**: Upload as static website
   - **GitHub Pages**: Push to `gh-pages` branch

3. Get your deployment URL (e.g., `https://your-widget.vercel.app`)

### Update Embedding Code

Replace `http://localhost:5174` with your production URL:

```html
<!-- iframe method -->
<iframe src="https://your-widget.vercel.app" ...></iframe>

<!-- Script method -->
<script>
  window.CHATBOT_WIDGET_URL = 'https://your-widget.vercel.app';
</script>
<script src="https://your-widget.vercel.app/embed.js"></script>
```

## 🧪 Testing Examples

### Test iframe Embedding

1. Start the widget: `npm run dev`
2. Open `examples/iframe-embed.html` in your browser
3. Click the chat icon to test

### Test Script Injection

1. Start the widget: `npm run dev`
2. Open `examples/script-embed.html` in your browser
3. The widget should load automatically

## 🔧 Configuration Options

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_WIDGET_TITLE=ChatBot
VITE_WIDGET_SUBTITLE=Online
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

### Widget Configuration

You can pass configuration via URL parameters:

```html
<iframe src="http://localhost:5174?theme=dark&position=left"></iframe>
```

Then read in `src/App.tsx`:
```typescript
const params = new URLSearchParams(window.location.search)
const theme = params.get('theme') // 'dark'
const position = params.get('position') // 'left'
```

## 📱 Mobile Responsiveness

The widget automatically adapts to mobile screens. On screens < 480px:
- Widget takes full width (minus padding)
- Height adjusts to viewport
- Max height: 600px

## 🐛 Troubleshooting

### Widget not showing

- Check that dev server is running on port 5174
- Check browser console for errors
- Verify iframe `src` URL is correct
- Check CORS settings if loading from different domain

### CORS errors

Add to `vite.config.ts`:
```typescript
server: {
  cors: true,
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
}
```

### Styles not applying

- Check that `App.css` is imported in `App.tsx`
- Clear browser cache
- Check browser dev tools for CSS conflicts

## 📊 Bundle Size

Optimized build size:
- Main bundle: ~150KB (gzipped)
- React vendor: ~130KB (gzipped)
- Total: ~280KB (gzipped)

## 🔐 Security Considerations

1. **iframe sandbox**: Add sandbox attribute for extra security
   ```html
   <iframe sandbox="allow-scripts allow-same-origin" ...></iframe>
   ```

2. **CSP Headers**: Configure Content Security Policy
3. **Input Validation**: Always validate user input on backend
4. **Rate Limiting**: Implement rate limiting on API
5. **Authentication**: Add user authentication if needed

## 🚀 Advanced Features (To Add)

- [ ] File upload support
- [ ] Voice input
- [ ] Multi-language support
- [ ] Persistent chat history
- [ ] User authentication
- [ ] Analytics integration
- [ ] Custom themes
- [ ] Emoji picker
- [ ] Markdown support
- [ ] Code syntax highlighting

## 📝 License

MIT License - Feel free to use in your projects!

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
- Check the examples folder
- Review this README
- Check browser console for errors
- Ensure backend API is running

## 🎯 Shared Backend

This widget can connect to the same backend as your main admin dashboard:

```
Main Dashboard (Port 5173) ──┐
                              ├──> Backend API (Port 3000) ──> Database
Chatbot Widget (Port 5174) ───┘
```

Both apps can:
- Share the same user database
- Access the same knowledge base
- Use the same conversation history
- Connect to the same AI models

Simply configure both to point to the same backend URL!

---

Made with ❤️ for easy chatbot integration

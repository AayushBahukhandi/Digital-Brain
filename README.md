# Digital Brain

AI-powered content summarizer for YouTube videos, Instagram content, X (Twitter) posts, and Facebook videos with intelligent chat functionality.

## Features

- 🧠 **AI-Powered Summarization** - Transform long-form content into concise, actionable insights
- 🎥 **YouTube Support** - Process any YouTube video URL
- 📱 **Instagram Support** - Summarize Instagram Reels and posts
- 🐦 **X (Twitter) Support** - Process X/Twitter video posts
- 📘 **Facebook Support** - Summarize Facebook videos and content
- 💬 **Smart Chat** - Ask questions about your summarized content
- ⚡ **Fast Processing** - Get summaries in seconds to minutes
- 🔍 **Searchable Notes** - Find and organize your content library

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Framer Motion for animations
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- SQLite database
- YouTube Transcript API
- Instagram content processing
- X (Twitter) content processing
- Facebook content processing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd digital-brain
```

2. Install all dependencies
```bash
npm run install:all
```

3. Set up environment variables
```bash
# Backend (.env file in backend directory)
PORT=3001
DATABASE_PATH=./database.sqlite
```

4. Start the development servers
```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

## Usage

1. **Add Content**: Paste a YouTube or Instagram URL
2. **Process**: Click "Summarize Content" and wait for AI processing
3. **Review**: Read the generated summary and key points
4. **Chat**: Ask questions about the content using the chat feature
5. **Organize**: Access all your summaries from the notes library

## API Endpoints

- `POST /api/videos/process` - Process a new video/content URL
- `GET /api/videos` - Get all processed content
- `GET /api/videos/:id` - Get specific content details
- `POST /api/videos/:id/chat` - Chat with specific content

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
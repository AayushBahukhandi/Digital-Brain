# Requirements Document

## Introduction

The YouTube Video Summarizer is a modern web application that allows users to paste YouTube links, automatically fetch video transcripts, generate AI-powered summaries, and provide an interactive chat interface to query saved videos. The application will feature a sleek UI with glassmorphic design elements, real-time chat capabilities, and comprehensive video management functionality.

## Requirements

### Requirement 1

**User Story:** As a user, I want to input YouTube video URLs and receive AI-generated summaries, so that I can quickly understand video content without watching the entire video.

#### Acceptance Criteria

1. WHEN a user pastes a valid YouTube URL THEN the system SHALL extract the video ID and validate the URL format
2. WHEN a valid YouTube URL is submitted THEN the system SHALL fetch the video transcript using the youtube-transcript package
3. WHEN a transcript is successfully retrieved THEN the system SHALL chunk the transcript into segments of ≤ 8000 tokens
4. WHEN transcript chunks are prepared THEN the system SHALL send them to OpenRouter's Gemini model for summarization
5. WHEN the AI summary is generated THEN the system SHALL store the video metadata, transcript, and summary in SQLite database
6. IF a YouTube URL is invalid or transcript unavailable THEN the system SHALL display appropriate error messages

### Requirement 2

**User Story:** As a user, I want to view and manage my saved video summaries, so that I can organize and access my video notes efficiently.

#### Acceptance Criteria

1. WHEN a user accesses the notes section THEN the system SHALL display all saved video summaries as cards with thumbnails, titles, and preview text
2. WHEN a user clicks on a note card THEN the system SHALL open a modal displaying the embedded video and full markdown summary
3. WHEN viewing a summary modal THEN the system SHALL provide options to copy summary text and download as PDF
4. WHEN a user selects edit on a note THEN the system SHALL allow modification of the summary content
5. WHEN a user selects delete on a note THEN the system SHALL remove the note after confirmation
6. WHEN notes are displayed THEN the system SHALL show creation date, video duration, and action buttons (View, Edit, Delete, Chat)

### Requirement 3

**User Story:** As a user, I want to chat with my saved videos using AI, so that I can ask specific questions about video content and get contextual answers.

#### Acceptance Criteria

1. WHEN a user clicks the Chat button on a note THEN the system SHALL open a chat interface in a side panel
2. WHEN the chat interface opens THEN the system SHALL display previous chat history for that video if available
3. WHEN a user sends a message in chat THEN the system SHALL use the video summary and transcript as context for AI responses
4. WHEN the AI responds THEN the system SHALL display the response with timestamps and source references
5. WHEN chat is active THEN the system SHALL provide suggested question chips for common queries
6. WHEN multiple users access the same video THEN the system SHALL maintain separate chat histories per user

### Requirement 4

**User Story:** As a user, I want a modern and responsive interface with smooth animations, so that I have an engaging and professional user experience.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a glassmorphic navigation bar with Home, Notes, and Chat links
2. WHEN users interact with UI elements THEN the system SHALL provide hover effects and smooth transitions
3. WHEN content is loading THEN the system SHALL display skeleton loaders with appropriate animations
4. WHEN operations complete THEN the system SHALL show success/error feedback with fade-in animations
5. WHEN pages transition THEN the system SHALL use smooth fade-in effects
6. WHEN the application is accessed on different devices THEN the system SHALL maintain responsive design across all screen sizes

### Requirement 5

**User Story:** As a user, I want secure authentication and data persistence, so that my video summaries and chat history are saved and protected.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL create a secure account with email and password
2. WHEN a user logs in THEN the system SHALL authenticate using JWT tokens
3. WHEN authenticated THEN the system SHALL associate all notes and chats with the user's account
4. WHEN data is stored THEN the system SHALL use SQLite database with Prisma ORM for data persistence
5. WHEN users access their data THEN the system SHALL ensure data isolation between different users
6. IF authentication fails THEN the system SHALL display appropriate error messages and prevent unauthorized access

### Requirement 6

**User Story:** As a developer, I want a well-structured codebase with modern technologies, so that the application is maintainable, scalable, and performant.

#### Acceptance Criteria

1. WHEN the frontend is built THEN the system SHALL use React 18 with TypeScript, Tailwind CSS, and Framer Motion
2. WHEN the backend is implemented THEN the system SHALL use Node.js with Express/Fastify and WebSocket support
3. WHEN forms are created THEN the system SHALL use React Hook Form with Zod validation
4. WHEN UI components are needed THEN the system SHALL utilize Radix UI and Lucide React icons
5. WHEN state management is required THEN the system SHALL implement Zustand for client-side state
6. WHEN the application is deployed THEN the system SHALL support frontend deployment on Vercel and backend on cloud platforms
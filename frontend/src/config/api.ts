const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  VERIFY: `${API_BASE_URL}/auth/verify`,
  
  // Video endpoints
  VIDEOS: `${API_BASE_URL}/videos`,
  PROCESS_VIDEO: `${API_BASE_URL}/videos/process`,
  
  // Chat endpoints
  GLOBAL_CHAT: `${API_BASE_URL}/chat/global`,
  
  // Voice notes endpoints
  VOICE_NOTES: `${API_BASE_URL}/voice-notes`,
  VOICE_NOTES_UPLOAD: `${API_BASE_URL}/voice-notes/upload`,
  
  // TTS endpoints
  TTS_VOICES: `${API_BASE_URL}/tts/voices`,
  TTS_CONVERT: `${API_BASE_URL}/tts/convert`,
  TTS_TEST: `${API_BASE_URL}/tts/test`,
  
  // Notes endpoints
  NOTES: `${API_BASE_URL}/notes`,
  NOTES_ASK_AI: `${API_BASE_URL}/notes/ask-ai`,
};

// For dynamic endpoints
export const getVideoEndpoint = (videoId: string) => `${API_BASE_URL}/videos/${videoId}`;
export const getVideoTagsEndpoint = (videoId: string) => `${API_BASE_URL}/videos/${videoId}/tags`;
export const getVideoTitleEndpoint = (videoId: string) => `${API_BASE_URL}/videos/${videoId}/title`;
export const getVideoRegenerateTagsEndpoint = (videoId: string) => `${API_BASE_URL}/videos/${videoId}/regenerate-tags`;
export const getTTSConvertSummaryEndpoint = (videoId: string) => `${API_BASE_URL}/tts/convert-summary/${videoId}`;
export const getVoiceNoteEndpoint = (noteId: string) => `${API_BASE_URL}/voice-notes/${noteId}`;
export const getNoteEndpoint = (noteId: string) => `${API_BASE_URL}/notes/${noteId}`;

// For audio URLs (these don't include /api prefix)
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
export const getAudioUrl = (audioPath: string) => `${BASE_URL}${audioPath}`;
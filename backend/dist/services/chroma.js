// import { ChromaClient } from 'chromadb';
export class ChromaService {
    constructor() {
        // this.client = new ChromaClient({
        //   path: process.env.CHROMA_URL || 'http://localhost:8000'
        // });
        // this.initCollection();
    }
    async initCollection() {
        // try {
        //   this.collection = await this.client.getOrCreateCollection({
        //     name: 'video_transcripts',
        //     metadata: { description: 'YouTube video transcripts for semantic search' }
        //   });
        // } catch (error) {
        //   console.error('Failed to initialize Chroma collection:', error);
        // }
    }
    async addTranscript(videoId, transcript, metadata = {}) {
        // if (!this.collection) {
        //   await this.initCollection();
        // }
        // try {
        //   // Split transcript into chunks for better embedding
        //   const chunks = this.chunkText(transcript, 500);
        //   const ids = chunks.map((_, index) => `${videoId}_chunk_${index}`);
        //   await this.collection.add({
        //     ids,
        //     documents: chunks,
        //     metadatas: chunks.map(() => ({ videoId, ...metadata }))
        //   });
        // } catch (error) {
        //   console.error('Failed to add transcript to Chroma:', error);
        // }
    }
    async searchTranscripts(query, limit = 5) {
        // if (!this.collection) {
        //   await this.initCollection();
        // }
        // try {
        //   const results = await this.collection.query({
        //     queryTexts: [query],
        //     nResults: limit
        //   });
        //   return results;
        // } catch (error) {
        //   console.error('Failed to search transcripts:', error);
        //   return null;
        // }
        return null;
    }
    chunkText(text, chunkSize) {
        const words = text.split(' ');
        const chunks = [];
        for (let i = 0; i < words.length; i += chunkSize) {
            chunks.push(words.slice(i, i + chunkSize).join(' '));
        }
        return chunks;
    }
}
//# sourceMappingURL=chroma.js.map
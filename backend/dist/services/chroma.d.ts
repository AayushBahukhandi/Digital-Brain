export declare class ChromaService {
    private collection;
    constructor();
    private initCollection;
    addTranscript(videoId: string, transcript: string, metadata?: any): Promise<void>;
    searchTranscripts(query: string, limit?: number): Promise<null>;
    private chunkText;
}
//# sourceMappingURL=chroma.d.ts.map
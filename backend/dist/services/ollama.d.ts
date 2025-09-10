export declare class OllamaService {
    private baseUrl;
    private model;
    constructor(baseUrl?: string, model?: string);
    /**
     * Generate a response using Ollama LLM
     */
    generateResponse(prompt: string): Promise<string>;
    /**
     * Check if Ollama service is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get available models
     */
    getAvailableModels(): Promise<string[]>;
}
//# sourceMappingURL=ollama.d.ts.map
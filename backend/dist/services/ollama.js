import axios from 'axios';
export class OllamaService {
    constructor(baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434', model = process.env.OLLAMA_MODEL || 'llama3.2:latest') {
        this.baseUrl = baseUrl;
        this.model = model;
    }
    /**
     * Generate a response using Ollama LLM
     */
    async generateResponse(prompt) {
        try {
            console.log(`Generating response with Ollama model: ${this.model}`);
            const response = await axios.post(`${this.baseUrl}/api/generate`, {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 1000
                }
            }, {
                timeout: 30000 // 30 second timeout
            });
            if (response.data && response.data.response) {
                const responseText = response.data.response;
                console.log(`✓ Generated response: ${responseText.length} chars`);
                return responseText.trim();
            }
            else {
                throw new Error('No response generated from Ollama');
            }
        }
        catch (error) {
            console.error('Ollama API error:', error);
            throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if Ollama service is available
     */
    async isAvailable() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, {
                timeout: 5000
            });
            return response.status === 200;
        }
        catch (error) {
            console.warn('Ollama service not available:', error);
            return false;
        }
    }
    /**
     * Get available models
     */
    async getAvailableModels() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/tags`, {
                timeout: 5000
            });
            if (response.data && response.data.models) {
                return response.data.models.map((model) => model.name);
            }
            return [];
        }
        catch (error) {
            console.error('Failed to get Ollama models:', error);
            return [];
        }
    }
}
//# sourceMappingURL=ollama.js.map
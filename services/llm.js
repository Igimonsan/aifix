const axios = require('axios');
const config = require('../config/config');
const prompts = require('../utils/prompts');

class LLMService {
    constructor() {
        this.apiKey = config.OPENROUTER.API_KEY;
        this.baseUrl = config.OPENROUTER.BASE_URL;
        this.modelName = config.OPENROUTER.MODEL_NAME;
        
        // Validasi API key
        if (!this.apiKey) {
            console.warn('⚠️ OpenRouter API key not found. Please set OPENROUTER_API_KEY in .env');
        }
    }
    
    // Generate response dari LLM
    async generateResponse(userPrompt, conversationHistory = []) {
        try {
            // Jika tidak ada API key, return dummy response
            if (!this.apiKey) {
                return this.getDummyResponse(userPrompt);
            }
            
            // Prepare messages untuk API
            const messages = this.prepareMessages(userPrompt, conversationHistory);
            
            console.log(`🤖 Sending request to OpenRouter API...`);
            
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: this.modelName,
                    messages: messages,
                    max_tokens: 1000,
                    temperature: 0.7,
                    top_p: 0.9
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:3000',
                        'X-Title': 'igimonAi'
                    },
                    timeout: 30000 // 30 detik timeout
                }
            );
            
            const aiResponse = response.data.choices[0].message.content;
            console.log(`✅ Received response from OpenRouter`);
            
            return aiResponse;
            
        } catch (error) {
            console.error('❌ Error calling OpenRouter API:', error.message);
            
            // Handle different error types
            if (error.response) {
                console.error('Response error:', error.response.data);
            }
            
            // Fallback ke dummy response
            return this.getDummyResponse(userPrompt);
        }
    }
    
    // Prepare messages array untuk API
    prepareMessages(userPrompt, conversationHistory) {
        const messages = [];
        
        // Tambahkan system prompt
        messages.push({
            role: 'system',
            content: prompts.getSystemPrompt()
        });
        
        // Tambahkan riwayat percakapan (batasi untuk efisiensi)
        const recentHistory = conversationHistory.slice(-10); // Ambil 10 pesan terakhir
        
        for (const message of recentHistory) {
            messages.push({
                role: message.role,
                content: message.content
            });
        }
        
        // Tambahkan prompt user saat ini
        messages.push({
            role: 'user',
            content: userPrompt
        });
        
        return messages;
    }
    
    // Dummy response untuk testing tanpa API key
    getDummyResponse(userPrompt) {
        const responses = [
            "Halo! Saya igimonAi. Saat ini saya berjalan dalam mode demo karena belum ada API key. Pesan Anda: \"" + userPrompt + "\" sudah saya terima!",
            "Wah, pertanyaan yang menarik! Meskipun saya sedang dalam mode demo, saya senang bisa berinteraksi dengan Anda. Coba setup API key untuk pengalaman yang lebih baik ya!",
            "Sebagai igimonAi, saya ingin membantu Anda! Saat ini saya menggunakan respons demo. Silakan tambahkan OPENROUTER_API_KEY di file .env untuk fitur penuh.",
            "Terima kasih sudah mencoba igimonAi! Respons ini adalah demo. Untuk pengalaman AI yang sebenarnya, mohon setup API key OpenRouter ya!"
        ];
        
        // Pilih respons random
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        console.log(`🎭 Generated dummy response`);
        return randomResponse;
    }
}

module.exports = new LLMService();
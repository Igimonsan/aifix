// File ini berisi semua konfigurasi aplikasi
// Menggunakan environment variables untuk keamanan

module.exports = {
    // Port server
    PORT: process.env.PORT || 3000,
    
    // Konfigurasi OpenRouter API
    OPENROUTER: {
        API_KEY: process.env.OPENROUTER_API_KEY,
        BASE_URL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        MODEL_NAME: process.env.MODEL_NAME || 'google/gemini-2.0-flash-exp:free'
    },
    
    // Konfigurasi memory
    MEMORY: {
        MAX_MESSAGES_PER_USER: 50, // Batas maksimal pesan per user
        CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 jam dalam milliseconds
        DATA_FILE: './data/conversations.json'
    }
};
const express = require('express');
const router = express.Router();
const llmService = require('../services/llm');
const memoryService = require('../services/memory');

// POST /ask - Endpoint utama untuk chat dengan AI
router.post('/', async (req, res) => {
    try {
        const { userId, prompt } = req.body;
        
        // Validasi input
        if (!userId || !prompt) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId and prompt are required'
            });
        }
        
        // Validasi tipe data
        if (typeof userId !== 'string' || typeof prompt !== 'string') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId and prompt must be strings'
            });
        }
        
        // Validasi panjang prompt
        if (prompt.trim().length === 0) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'prompt cannot be empty'
            });
        }
        
        console.log(`📨 Received request from user: ${userId}`);
        console.log(`💬 Prompt: ${prompt.substring(0, 100)}...`);
        
        // Ambil riwayat percakapan user
        const conversationHistory = memoryService.getConversation(userId);
        console.log(`📚 Found ${conversationHistory.length} previous messages`);
        
        // Kirim ke LLM dengan konteks
        const aiResponse = await llmService.generateResponse(prompt, conversationHistory);
        
        // Simpan percakapan baru
        memoryService.saveMessage(userId, 'user', prompt);
        memoryService.saveMessage(userId, 'assistant', aiResponse);
        
        console.log(`✅ Response generated successfully`);
        
        // Kirim response
        res.json({
            success: true,
            userId: userId,
            prompt: prompt,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error in /ask endpoint:', error.message);
        
        // Handle different types of errors
        if (error.message.includes('API key')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API configuration'
            });
        }
        
        if (error.message.includes('rate limit')) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.'
            });
        }
        
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate AI response'
        });
    }
});

// GET /ask/history/:userId - Ambil riwayat percakapan user
router.get('/history/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId is required'
            });
        }
        
        const history = memoryService.getConversation(userId);
        
        res.json({
            success: true,
            userId: userId,
            history: history,
            totalMessages: history.length
        });
        
    } catch (error) {
        console.error('❌ Error getting history:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve conversation history'
        });
    }
});

// DELETE /ask/history/:userId - Hapus riwayat percakapan user
router.delete('/history/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId is required'
            });
        }
        
        memoryService.clearUserConversation(userId);
        
        res.json({
            success: true,
            message: `Conversation history for user ${userId} has been cleared`
        });
        
    } catch (error) {
        console.error('❌ Error clearing history:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to clear conversation history'
        });
    }
});

module.exports = router;
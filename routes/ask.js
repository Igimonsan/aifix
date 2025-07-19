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

        // 🆕 FITUR BARU: Cek jika prompt adalah perintah reset
        const resetCommands = ['/reset', '/clear', '/hapus', 'reset memori', 'hapus riwayat'];
        const isResetCommand = resetCommands.some(cmd => 
            prompt.toLowerCase().trim().includes(cmd.toLowerCase())
        );

        if (isResetCommand) {
            memoryService.clearUserConversation(userId);
            return res.json({
                success: true,
                userId: userId,
                response: "Riwayat percakapan Anda telah dihapus! Mari mulai percakapan baru.",
                action: "memory_reset",
                timestamp: new Date().toISOString()
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
        
        const hadHistory = memoryService.getConversation(userId).length > 0;
        memoryService.clearUserConversation(userId);
        
        res.json({
            success: true,
            message: `Conversation history for user ${userId} has been cleared`,
            previousMessages: hadHistory ? 'existed' : 'none'
        });
        
    } catch (error) {
        console.error('❌ Error clearing history:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to clear conversation history'
        });
    }
});

// 🆕 DELETE /ask/history - Hapus SEMUA riwayat percakapan (admin only)
router.delete('/history', (req, res) => {
    try {
        const { adminKey } = req.body;
        
        // Simple admin protection - ganti dengan sistem auth yang proper
        if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'admin123') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }
        
        const stats = memoryService.getStats();
        memoryService.clearAllConversations();
        
        res.json({
            success: true,
            message: 'All conversation histories have been cleared',
            clearedStats: stats
        });
        
    } catch (error) {
        console.error('❌ Error clearing all histories:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to clear all conversation histories'
        });
    }
});

// 🆕 GET /ask/stats - Statistik memory usage
router.get('/stats', (req, res) => {
    try {
        const stats = memoryService.getStats();
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error('❌ Error getting stats:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve statistics'
        });
    }
});

// 🆕 POST /ask/reset - Alternative reset endpoint (lebih user-friendly)
router.post('/reset', (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId is required'
            });
        }
        
        const hadHistory = memoryService.getConversation(userId).length > 0;
        memoryService.clearUserConversation(userId);
        
        res.json({
            success: true,
            userId: userId,
            message: hadHistory 
                ? "Riwayat percakapan berhasil dihapus. Mari mulai dari awal!" 
                : "Belum ada riwayat untuk dihapus. Siap memulai percakapan baru!",
            action: "memory_reset",
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error in reset endpoint:', error.message);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to reset conversation'
        });
    }
});

module.exports = router;
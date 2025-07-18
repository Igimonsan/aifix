const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class MemoryService {
    constructor() {
        this.dataFile = config.MEMORY.DATA_FILE;
        this.maxMessages = config.MEMORY.MAX_MESSAGES_PER_USER;
        this.conversations = new Map(); // In-memory storage
        
        // Pastikan folder data exist
        this.ensureDataDirectory();
        
        // Load existing conversations dari file
        this.loadConversations();
        
        // Setup auto-save setiap 30 detik
        this.setupAutoSave();
    }
    
    // Pastikan folder data ada
    ensureDataDirectory() {
        const dataDir = path.dirname(this.dataFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`📁 Created data directory: ${dataDir}`);
        }
    }
    
    // Load conversations dari file JSON
    loadConversations() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                const conversations = JSON.parse(data);
                
                // Convert object ke Map untuk performa lebih baik
                this.conversations = new Map(Object.entries(conversations));
                console.log(`📚 Loaded ${this.conversations.size} user conversations`);
            }
        } catch (error) {
            console.error('❌ Error loading conversations:', error.message);
            this.conversations = new Map();
        }
    }
    
    // Save conversations ke file JSON
    saveConversations() {
        try {
            // Convert Map ke object untuk JSON
            const conversationsObj = Object.fromEntries(this.conversations);
            
            fs.writeFileSync(
                this.dataFile, 
                JSON.stringify(conversationsObj, null, 2), 
                'utf8'
            );
            
            console.log(`💾 Saved conversations to ${this.dataFile}`);
        } catch (error) {
            console.error('❌ Error saving conversations:', error.message);
        }
    }
    
    // Setup auto-save setiap 30 detik
    setupAutoSave() {
        setInterval(() => {
            this.saveConversations();
        }, 30000); // 30 detik
    }
    
    // Ambil riwayat percakapan user
    getConversation(userId) {
        return this.conversations.get(userId) || [];
    }
    
    // Simpan pesan baru
    saveMessage(userId, role, content) {
        // Ambil riwayat existing atau buat array baru
        let userConversation = this.conversations.get(userId) || [];
        
        // Tambah pesan baru
        const newMessage = {
            role: role, // 'user' atau 'assistant'
            content: content,
            timestamp: new Date().toISOString()
        };
        
        userConversation.push(newMessage);
        
        // Batasi jumlah pesan untuk menghemat memory
        if (userConversation.length > this.maxMessages) {
            userConversation = userConversation.slice(-this.maxMessages);
        }
        
        // Simpan kembali ke Map
        this.conversations.set(userId, userConversation);
        
        console.log(`💬 Saved message for user ${userId} (${role})`);
    }
    
    // Hapus semua percakapan user
    clearUserConversation(userId) {
        this.conversations.delete(userId);
        console.log(`🗑️ Cleared conversation for user ${userId}`);
    }
    
    // Hapus semua data
    clearAllConversations() {
        this.conversations.clear();
        console.log('🗑️ Cleared all conversations');
    }
    
    // Get statistik
    getStats() {
        const totalUsers = this.conversations.size;
        let totalMessages = 0;
        
        for (const conversation of this.conversations.values()) {
            totalMessages += conversation.length;
        }
        
        return {
            totalUsers,
            totalMessages,
            averageMessagesPerUser: totalUsers > 0 ? totalMessages / totalUsers : 0
        };
    }
}

// Export singleton instance
module.exports = new MemoryService();
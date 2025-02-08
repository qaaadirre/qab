const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, channelLink) {
    const helpMessage = `
╔═══════════════════╗
   *${settings.botName || 'ReviewPlus'}*  
   Version: *${settings.version || '1.0.0'}*
   by ${settings.botOwner || 'Khadr'}
   YT : ${global.ytch || 'ReviewPLus'}
╚═══════════════════╝
*Available Commands:*
╔═══════════════════╗
🌐 *Commands*:
║ ➤ .help or .menu
║ ➤ .ping
║ ➤ .alive
║ ➤ .owner
║ ➤ .vv
╚═══════════════════╝
Join our channel for updates:`;

    // Template for buttons
    const templateButtons = [
        {index: 1, urlButton: {displayText: '👥 Group Info', url: 'https://chat.whatsapp.com/your-group-link'}},
        {index: 2, callButton: {displayText: '📜 Commands', phoneNumber: '+1234567890'}},
        {index: 3, quickReplyButton: {displayText: '👤 Owner', id: '.owner'}}
    ];

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            const templateMessage = {
                image: imageBuffer,
                caption: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                templateButtons: templateButtons
            };
            
            await sock.sendMessage(chatId, templateMessage);
        } else {
            console.error('Bot image not found at:', imagePath);
            const templateMessage = {
                text: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                templateButtons: templateButtons
            };
            
            await sock.sendMessage(chatId, templateMessage);
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;

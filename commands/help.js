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

    const buttons = [
        {buttonId: 'groupinfo', buttonText: {displayText: '👥 GROUP INFO'}, type: 1},
        {buttonId: 'commands', buttonText: {displayText: '📜 COMMANDS'}, type: 1},
        {buttonId: 'owner', buttonText: {displayText: '👤 OWNER'}, type: 1}
    ];

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            const buttonMessage = {
                image: imageBuffer,
                caption: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                buttons: buttons,
                headerType: 4
            };
            
            await sock.sendMessage(chatId, buttonMessage);
        } else {
            console.error('Bot image not found at:', imagePath);
            const buttonMessage = {
                text: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                buttons: buttons,
                headerType: 1
            };
            
            await sock.sendMessage(chatId, buttonMessage);
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;

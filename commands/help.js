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

    // Define the buttons with more descriptive text
    const buttons = [
        { buttonId: 'id1', buttonText: { displayText: '👥 Group Info' }, type: 1 },
        { buttonId: 'id2', buttonText: { displayText: '📜 Commands' }, type: 1 },
        { buttonId: 'id3', buttonText: { displayText: '👤 Owner' }, type: 1 }
    ];

    const buttonMessage = {
        image: { url: 'https://example.com/bot.jpg' },  // Replace with your image URL
        caption: helpMessage,
        footer: '© ReviewPlus Bot 2024',
        buttons: buttons,
        headerType: 4,
        viewOnce: true,
        mentions: ['120363186063399611@g.us']  // Replace with your group ID
    };

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                buttons: buttons,
                headerType: 4,
                viewOnce: true
            });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                buttons: buttons,
                headerType: 1,
                viewOnce: true
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;

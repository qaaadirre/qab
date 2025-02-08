const settings = require('../settings');
const fs = require('fs');
const path = require('path');
async function helpCommand(sock, chatId, channelLink) {
    const helpMessage = '
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
Join our channel for updates:';
    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);

            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363397497383483@newsletter',
                        newsletterName: 'ReviewPLus',
                        serverMessageId: -1
                    }
                }
            });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363397497383483@newsletter',
                        newsletterName: 'REviewPlus',
                        serverMessageId: -1
                    } 
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}
module.exports = helpCommand;   

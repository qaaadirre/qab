const settings = require('../settings');
const fs = require('fs');
const path = require('path');

// Define menu categories and their commands
const menuCategories = {
    '1': {
        name: '📱 Main Menu',
        commands: {
            '1': { cmd: '.help', desc: 'Show this menu' },
            '2': { cmd: '.ping', desc: 'Check bot response time' },
            '3': { cmd: '.alive', desc: 'Check bot status' }
        }
    },
    '2': {
        name: '⚙️ Bot Settings',
        commands: {
            '1': { cmd: '.owner', desc: 'Show bot owner info' },
            '2': { cmd: '.vv', desc: 'Show bot version' }
        }
    },
    '3': {
        name: '🎮 Games',
        commands: {
            '1': { cmd: '.ttt', desc: 'Play Tic Tac Toe' },
            '2': { cmd: '.quiz', desc: 'Start a quiz game' }
        }
    },
    '4': {
        name: '📥 Downloads',
        commands: {
            '1': { cmd: '.yt', desc: 'Download YouTube video' },
            '2': { cmd: '.song', desc: 'Download music' }
        }
    }
};

async function helpCommand(sock, chatId, arg = '') {
    // Ensure arg is a string and trim it
    const cleanArg = String(arg).trim();
    
    if (!cleanArg) {
        // Show main help menu when no argument or just .help
        const helpMessage = `
┏━━━ *${settings.botName || 'ReviewPlus'}* ━━━┓
┃ Version: *${settings.version || '1.0.0'}*
┃ Creator: ${settings.botOwner || 'Khadr'}
┗━━━━━━━━━━━━━━━━━━━━┛

*Available Categories:*

${Object.entries(menuCategories).map(([key, category]) => {
    const commandList = Object.values(category.commands)
        .map(cmd => `  ╰➽ ${cmd.cmd}`).join('\n');
    return `${category.name}\n${commandList}`;
}).join('\n\n')}

💡 *How to use:*
• Send .help <category_number> to view specific category
• Example: .help 1 for Main Menu

📢 Join our channel for updates!`;

        try {
            const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
            const messageOptions = {
                caption: helpMessage,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363397497383483@newsletter',
                        newsletterName: 'ReviewPlus',
                        serverMessageId: -1
                    }
                }
            };

            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    ...messageOptions
                });
            } else {
                console.error('Bot image not found at:', imagePath);
                await sock.sendMessage(chatId, { 
                    text: helpMessage,
                    ...messageOptions
                });
            }
        } catch (error) {
            console.error('Error in help command:', error);
            await sock.sendMessage(chatId, { text: helpMessage });
        }
    } else {
        // Show specific category
        const category = menuCategories[cleanArg];
        if (category) {
            const categoryMessage = `
┏━━━ *${category.name}* ━━━┓

${Object.entries(category.commands).map(([key, cmd]) => 
    `╰➽ ${cmd.cmd} - ${cmd.desc}`
).join('\n')}

💡 Use these commands directly
📢 Example: ${Object.values(category.commands)[0].cmd}`;

            await sock.sendMessage(chatId, { text: categoryMessage });
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ Invalid category. Use .help to see all categories.' 
            });
        }
    }
}

module.exports = helpCommand;

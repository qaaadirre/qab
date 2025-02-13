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

async function sendMessageWithRetry(sock, chatId, content, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await sock.sendMessage(chatId, content);
            return true;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
    }
}

async function helpCommand(sock, chatId, arg = '') {
    try {
        console.log('Help command called with arg:', arg);
        const mainHelpMessage = `
┏━━━ *${settings.botName || 'ReviewPlus Bot'}* ━━━┓
┃ Version: *${settings.version || '1.0.0'}*
┃ Creator: ${settings.botOwner || 'Khadr'}
┗━━━━━━━━━━━━━━━━━━━━┛

*Available Categories:*

${Object.entries(menuCategories).map(([key, category]) => {
    const commandList = Object.values(category.commands)
        .map(cmd => `  ╰➽ ${cmd.cmd}`).join('\n');
    return `${key}. ${category.name}\n${commandList}`;
}).join('\n\n')}

💡 *How to use:*
• Send .help <category_number> to view specific category
• Example: .help 1 for Main Menu

📢 Join our channel for updates!`;

        const messageOptions = {
            text: mainHelpMessage,
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

        // Try to send with image first, fallback to text
        try {
            const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
            if (fs.existsSync(imagePath)) {
                const imageBuffer = fs.readFileSync(imagePath);
                messageOptions.image = imageBuffer;
                messageOptions.caption = mainHelpMessage;
                delete messageOptions.text;
            }
        } catch (error) {
            console.error('Error loading image:', error);
            // Continue with text-only message
        }

        // Send the message with retry mechanism
        await sendMessageWithRetry(sock, chatId, messageOptions);

    } catch (error) {
        console.error('Error in help command:', error);
        // Fallback to simple text message
        const fallbackMessage = {
            text: '⚠️ An error occurred. Please try again later or contact the bot owner.'
        };
        try {
            await sendMessageWithRetry(sock, chatId, fallbackMessage);
        } catch (finalError) {
            console.error('Critical error in help command:', finalError);
        }
    }
}

module.exports = helpCommand;

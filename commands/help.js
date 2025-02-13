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

async function handleMenuSelection(sock, chatId, selection) {
    const [category, command] = selection.split('.');
    
    if (!command) {
        // Show commands for selected category
        if (menuCategories[category]) {
            return await showCategoryCommands(sock, chatId, category);
        }
    } else {
        // Execute selected command
        const categoryData = menuCategories[category];
        const commandData = categoryData?.commands[command];
        if (commandData) {
            return await sock.sendMessage(chatId, { 
                text: `Executing command: ${commandData.cmd}\n${commandData.desc}` 
            });
        }
    }
    
    // Invalid selection, show main menu
    return await showMainMenu(sock, chatId);
}

async function showCategoryCommands(sock, chatId, category) {
    const categoryData = menuCategories[category];
    let message = `
┏━━━ *${categoryData.name}* ━━━┓\n\n`;

    Object.entries(categoryData.commands).forEach(([key, value]) => {
        message += `${category}.${key}. ${value.cmd} - ${value.desc}\n`;
    });

    message += `\n0. Return to main menu\n\nReply with number to select (e.g., "${category}.1")`;

    await sock.sendMessage(chatId, { text: message });
}

async function showMainMenu(sock, chatId) {
    const mainMessage = `
┏━━━ *${settings.botName || 'ReviewPlus'}* ━━━┓
┃ Version: *${settings.version || '1.0.0'}*
┃ Creator: ${settings.botOwner || 'Khadr'}
┗━━━━━━━━━━━━━━━━━━━━┛

*Select a Category:*

${Object.entries(menuCategories).map(([key, category]) => 
    `${key}. ${category.name}`
).join('\n')}

Reply with number to select (e.g., "1")`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        const messageOptions = {
            caption: mainMessage,
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
            await sock.sendMessage(chatId, { 
                text: mainMessage,
                ...messageOptions
            });
        }
    } catch (error) {
        console.error('Error in menu command:', error);
        await sock.sendMessage(chatId, { text: mainMessage });
    }
}

async function menuCommand(sock, chatId, arg) {
    if (arg && arg.trim()) {
        // Handle menu selection
        await handleMenuSelection(sock, chatId, arg.trim());
    } else {
        // Show main menu
        await showMainMenu(sock, chatId);
    }
}

module.exports = helpCommand;   

const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, channelLink) {
    // Message template with formatting
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

    try {
        const sections = [
            {
                title: "Bot Commands",
                rows: [
                    {title: "All Commands", rowId: "list_commands", description: "View all available commands"},
                    {title: "Owner Info", rowId: "owner_info", description: "Contact bot owner"},
                    {title: "Group Rules", rowId: "group_rules", description: "View group guidelines"}
                ]
            }
        ];

        const listMessage = {
            text: helpMessage,
            footer: "© ReviewPlus Bot 2024",
            title: "Bot Menu",
            buttonText: "Click Here!",
            sections,
            // List message specific options
            listType: 1
        };

        const templateButtons = [
            {
                index: 1,
                quickReplyButton: {
                    displayText: '👥 Group Info',
                    id: 'group_info'
                }
            },
            {
                index: 2,
                quickReplyButton: {
                    displayText: '📜 Commands',
                    id: 'commands'
                }
            },
            {
                index: 3,
                quickReplyButton: {
                    displayText: '👤 Owner',
                    id: 'owner'
                }
            }
        ];

        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);

            // First, send the image with template buttons
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                templateButtons: templateButtons,
                mimetype: 'image/jpeg'
            });

            // Then send the list message
            await sock.sendMessage(chatId, listMessage);
        } else {
            // If no image, send both messages without image
            await sock.sendMessage(chatId, {
                text: helpMessage,
                footer: '© ReviewPlus Bot 2024',
                templateButtons: templateButtons
            });

            await sock.sendMessage(chatId, listMessage);
        }

    } catch (error) {
        console.error('Error in help command:', error);
        
        // Fallback message without any buttons
        await sock.sendMessage(chatId, { 
            text: helpMessage + "\n\nNote: Interactive buttons are currently unavailable." 
        });
    }
}

// Button response handler
async function handleButtonResponse(sock, chatId, selectedButtonId) {
    const responses = {
        'group_info': 'ℹ️ *Group Information*\nWelcome to our group! Here you can...',
        'commands': '📜 *Available Commands*\nHere are all the commands you can use...',
        'owner': '👤 *Owner Contact*\nYou can reach out to the owner at...',
        'list_commands': '📋 *Detailed Command List*\nHere is a complete list of commands...',
        'owner_info': '💌 *Owner Details*\nContact the owner for support...',
        'group_rules': '📢 *Group Rules*\nPlease follow these guidelines...'
    };

    const response = responses[selectedButtonId] || 'Invalid button selection';
    await sock.sendMessage(chatId, { text: response });
}

module.exports = {
    helpCommand,
    handleButtonResponse
};

/* const { appendData } = require('./googleSheets');

// Google Sheet ID and range
const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/17-VrmiZQ7lcM7lIwS9LJ2kgTGiNs2qm4NpPlMA1jbF8/edit';
const RANGE = 'Sheet1!A1';

// Define available tests/services
const labServices = {
    '1': { name: 'Blood Test', price: '500', duration: '30 mins' },
    '2': { name: 'X-Ray', price: '1000', duration: '15 mins' },
    '3': { name: 'MRI Scan', price: '5000', duration: '45 mins' },
    '4': { name: 'CT Scan', price: '3000', duration: '30 mins' },
    '5': { name: 'ECG', price: '800', duration: '20 mins' },
};

// Time slots available
const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
    '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
];

// User booking states
const userStates = new Map();

async function labBookingCommand(sock, chatId, arg = '', sender) {
    const userId = sender.split('@')[0];

    if (!userStates.has(userId)) {
        userStates.set(userId, { step: 'start' });
    }

    const state = userStates.get(userId);
    console.log(`Current step: ${state.step}, User input: ${arg}`);

    try {
        switch (state.step) {
            case 'start':
                await showMainMenu(sock, chatId);
                state.step = 'select_service';
                break;

            case 'select_service':
                if (labServices[arg]) {
                    state.service = labServices[arg];
                    await showDateSelection(sock, chatId);
                    state.step = 'select_date';
                } else {
                    await sock.sendMessage(chatId, { 
                        text: '❌ Invalid service. Please select from the menu below:',
                        footer: 'Select a service',
                        buttons: createServiceButtons()
                    });
                }
                break;

            case 'select_date':
                if (isValidDate(arg)) {
                    state.date = arg;
                    await showTimeSlots(sock, chatId);
                    state.step = 'select_time';
                } else {
                    await sock.sendMessage(chatId, { text: '❌ Invalid date format. Please use DD-MM-YYYY' });
                }
                break;

            case 'select_time':
                if (timeSlots.includes(arg)) {
                    state.time = arg;
                    await requestContactInfo(sock, chatId);
                    state.step = 'provide_contact';
                } else {
                    await sock.sendMessage(chatId, {
                        text: '❌ Invalid time slot. Please select from available slots:',
                        footer: 'Select a time slot',
                        buttons: createTimeButtons()
                    });
                }
                break;

            case 'provide_contact':
                state.contact = arg;
                await confirmBooking(sock, chatId, state);
                state.step = 'confirm';
                break;

            case 'confirm':
                if (arg.toLowerCase() === 'yes') {
                    await saveBooking(sock, chatId, state);
                    userStates.delete(userId);
                } else {
                    await sock.sendMessage(chatId, { 
                        text: '❌ Booking cancelled. Press the button below to start again.',
                        footer: 'Book Again',
                        buttons: [{ buttonId: '.book', buttonText: { displayText: 'Book New Appointment' }, type: 1 }]
                    });
                    userStates.delete(userId);
                }
                break;
        }
    } catch (error) {
        console.error('Error in lab booking:', error);
        await sock.sendMessage(chatId, { 
            text: '⚠️ An error occurred. Press the button below to try again.',
            footer: 'Try Again',
            buttons: [{ buttonId: '.book', buttonText: { displayText: 'Book New Appointment' }, type: 1 }]
        });
        userStates.delete(userId);
    }
}

function createServiceButtons() {
    return Object.entries(labServices).map(([key, service]) => ({
        buttonId: key,
        buttonText: { displayText: `${service.name} - ₹${service.price}` },
        type: 1
    }));
}

function createTimeButtons() {
    return timeSlots.map((slot, index) => ({
        buttonId: slot,
        buttonText: { displayText: slot },
        type: 1
    }));
}

async function showMainMenu(sock, chatId) {
    const message = {
        text: `*📋 Lab Booking System*\n\nPlease select a service:`,
        footer: 'Select a service',
        buttons: createServiceButtons()
    };

    await sock.sendMessage(chatId, message);
}

async function showDateSelection(sock, chatId) {
    const message = {
        text: `📅 *Select Appointment Date*\n\nPlease enter your preferred date (DD-MM-YYYY)\nExample: 14-02-2025\n\nNote: You can book appointments for the next 30 days only.`,
        footer: 'Enter date in DD-MM-YYYY format'
    };

    await sock.sendMessage(chatId, message);
}

async function showTimeSlots(sock, chatId) {
    const message = {
        text: `⌚ *Select Time Slot*\n\nPlease choose your preferred time:`,
        footer: 'Select a time slot',
        buttons: createTimeButtons()
    };

    await sock.sendMessage(chatId, message);
}

async function requestContactInfo(sock, chatId) {
    const message = {
        text: `👤 *Enter Contact Information*\n\nPlease provide the following details in this format:\nName, Age, Phone Number\n\nExample: John Doe, 30, 9876543210`,
        footer: 'Enter your details'
    };

    await sock.sendMessage(chatId, message);
}

async function confirmBooking(sock, chatId, state) {
    const message = {
        text: `*📝 Confirm Booking Details*\n\nService: ${state.service.name}\nDate: ${state.date}\nTime: ${state.time}\nPrice: ₹${state.service.price}\nContact: ${state.contact}\n\nPress Yes to confirm or No to cancel.`,
        footer: 'Confirm booking',
        buttons: [
            { buttonId: 'yes', buttonText: { displayText: 'Yes' }, type: 1 },
            { buttonId: 'no', buttonText: { displayText: 'No' }, type: 1 }
        ]
    };

    await sock.sendMessage(chatId, message);
}

async function saveBooking(sock, chatId, state) {
    const [name, age, phone] = state.contact.split(',').map(item => item.trim());
    const bookingId = `BK${Date.now()}`;
    const bookingData = [
        [
            bookingId,
            state.date,
            state.time,
            state.service.name,
            state.service.price,
            name,
            age,
            phone,
            new Date().toISOString(),
        ],
    ];

    try {
        await appendData(SPREADSHEET_ID, RANGE, bookingData);

        const message = {
            text: `🎉 *Booking Confirmed!*\n\nBooking ID: ${bookingId}\nService: ${state.service.name}\nDate: ${state.date}\nTime: ${state.time}\n\nPlease arrive 15 minutes before your appointment.\nFor cancellation, contact our helpdesk.\n\nThank you for choosing our services! 🙏`,
            footer: 'Book another appointment',
            buttons: [{ buttonId: '.book', buttonText: { displayText: 'Book New Appointment' }, type: 1 }]
        };

        await sock.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error saving booking:', error);
        await sock.sendMessage(chatId, { 
            text: '⚠️ Failed to save booking. Please try again.',
            footer: 'Try Again',
            buttons: [{ buttonId: '.book', buttonText: { displayText: 'Book New Appointment' }, type: 1 }]
        });
    }
}

function isValidDate(dateStr) {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(dateStr)) return false;

    const [day, month, year] = dateStr.split('-').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return date >= today && date <= thirtyDaysFromNow;
}

module.exports = labBookingCommand;


*/
const { appendData } = require('./googleSheets');

// Google Sheet ID and range
const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/17-VrmiZQ7lcM7lIwS9LJ2kgTGiNs2qm4NpPlMA1jbF8/edit';
const RANGE = 'Sheet1!A1';

// Define available tests/services
const labServices = {
    '1': { name: 'Blood Test', price: '500', duration: '30 mins' },
    '2': { name: 'X-Ray', price: '1000', duration: '15 mins' },
    '3': { name: 'MRI Scan', price: '5000', duration: '45 mins' },
    '4': { name: 'CT Scan', price: '3000', duration: '30 mins' },
    '5': { name: 'ECG', price: '800', duration: '20 mins' },
};

// Time slots available
const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
    '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
];

// User booking states
const userStates = new Map();

async function labBookingCommand(sock, msg, arg = '') {
    const userId = msg.key.remoteJid;
    
    if (!userStates.has(userId)) {
        userStates.set(userId, { step: 'start' });
    }

    const state = userStates.get(userId);
    console.log(`Current step: ${state.step}, User input: ${arg}`);

    try {
        switch (state.step) {
            case 'start':
                await showMainMenu(sock, msg);
                state.step = 'select_service';
                break;

            case 'select_service':
                if (labServices[arg]) {
                    state.service = labServices[arg];
                    await showDateSelection(sock, msg);
                    state.step = 'select_date';
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { text: '❌ Invalid service. Please select a number from 1-5.' });
                    await showMainMenu(sock, msg);
                }
                break;

            case 'select_date':
                if (isValidDate(arg)) {
                    state.date = arg;
                    await showTimeSlots(sock, msg);
                    state.step = 'select_time';
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { text: '❌ Invalid date format. Please use DD-MM-YYYY' });
                }
                break;

            case 'select_time':
                const timeIndex = parseInt(arg) - 1;
                if (timeIndex >= 0 && timeIndex < timeSlots.length) {
                    state.time = timeSlots[timeIndex];
                    await requestContactInfo(sock, msg);
                    state.step = 'provide_contact';
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { text: '❌ Invalid selection. Please choose a number from 1-12.' });
                    await showTimeSlots(sock, msg);
                }
                break;

            case 'provide_contact':
                state.contact = arg;
                await confirmBooking(sock, msg, state);
                state.step = 'confirm';
                break;

            case 'confirm':
                if (arg.toLowerCase() === 'yes') {
                    await saveBooking(sock, msg, state);
                    userStates.delete(userId);
                } else if (arg.toLowerCase() === 'no') {
                    await sock.sendMessage(msg.key.remoteJid, { text: '❌ Booking cancelled. Type *.book* to start again.' });
                    userStates.delete(userId);
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { text: '❌ Please reply with *yes* or *no*' });
                }
                break;
        }
    } catch (error) {
        console.error('Error in lab booking:', error);
        await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ An error occurred. Type *.book* to try again.' });
        userStates.delete(userId);
    }
}

async function showMainMenu(sock, msg) {
    const menuText = `
📋 *Lab Booking System*

*Available Services:*
${Object.entries(labServices).map(([key, service]) =>
        `${key}. ${service.name}
   💰 Price: ₹${service.price}
   ⌚ Duration: ${service.duration}`
    ).join('\n\n')}

Reply with the service number (1-5) to proceed.`;

    await sock.sendMessage(msg.key.remoteJid, { text: menuText });
}

async function showDateSelection(sock, msg) {
    const message = `
📅 *Select Appointment Date*

Please enter your preferred date in DD-MM-YYYY format
Example: 14-02-2025

Note: You can book appointments for the next 30 days only.`;

    await sock.sendMessage(msg.key.remoteJid, { text: message });
}

async function showTimeSlots(sock, msg) {
    const slotsText = `
⌚ *Available Time Slots*

${timeSlots.map((slot, index) => `${index + 1}. ${slot}`).join('\n')}

Reply with the slot number (1-${timeSlots.length}) to proceed.`;

    await sock.sendMessage(msg.key.remoteJid, { text: slotsText });
}

async function requestContactInfo(sock, msg) {
    const message = `
👤 *Enter Contact Information*

Please provide the following details in this format:
Name, Age, Phone Number

Example: John Doe, 30, 9876543210`;

    await sock.sendMessage(msg.key.remoteJid, { text: message });
}

async function confirmBooking(sock, msg, state) {
    const message = `
📝 *Confirm Booking Details*

Service: ${state.service.name}
Date: ${state.date}
Time: ${state.time}
Price: ₹${state.service.price}
Contact: ${state.contact}

Reply *yes* to confirm or *no* to cancel.`;

    await sock.sendMessage(msg.key.remoteJid, { text: message });
}

async function saveBooking(sock, msg, state) {
    const [name, age, phone] = state.contact.split(',').map(item => item.trim());
    const bookingId = `BK${Date.now()}`;
    const bookingData = [
        [
            bookingId,
            state.date,
            state.time,
            state.service.name,
            state.service.price,
            name,
            age,
            phone,
            new Date().toISOString(),
        ],
    ];

    try {
        await appendData(SPREADSHEET_ID, RANGE, bookingData);

        const message = `
🎉 *Booking Confirmed!*

Booking ID: ${bookingId}
Service: ${state.service.name}
Date: ${state.date}
Time: ${state.time}

Please arrive 15 minutes before your appointment.
For cancellation, contact our helpdesk.

Thank you for choosing our services! 🙏

Type *.book* to make another booking.`;

        await sock.sendMessage(msg.key.remoteJid, { text: message });
    } catch (error) {
        console.error('Error saving booking:', error);
        await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Failed to save booking. Type *.book* to try again.' });
    }
}

function isValidDate(dateStr) {
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (!regex.test(dateStr)) return false;

    const [day, month, year] = dateStr.split('-').map(num => parseInt(num, 10));
    const date = new Date(year, month - 1, day);

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return date >= today && date <= thirtyDaysFromNow;
}

module.exports = labBookingCommand;

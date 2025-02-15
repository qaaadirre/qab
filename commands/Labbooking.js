const { appendData } = require('./googleSheets'); // Ensure this is your Google Sheets integration
const { makeWASocket, useMultiFileAuthState , MessageType } = require('@whiskeysockets/baileys');

// Google Sheet ID and range
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Replace with your actual ID
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
                if (arg.startsWith('service_')) {
                    const serviceIndex = parseInt(arg.split('_')[1]);
                    state.service = labServices[serviceIndex + 1]; // Adjust for 1-based index
                    await showDateSelection(sock, chatId);
                    state.step = 'select_date';
                } else {
                    await showMainMenu(sock, chatId);
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
                if (arg.startsWith('time_')) {
                    const timeIndex = parseInt(arg.split('_')[1]);
                    state.time = timeSlots[timeIndex];
                    await requestContactInfo(sock, chatId);
                    state.step = 'provide_contact';
                } else {
                    await showTimeSlots(sock, chatId);
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
                    await sock.sendMessage(chatId, { text: '❌ Booking cancelled. Type ".book" to start again.' });
                    userStates.delete(userId);
                }
                break;
        }
    } catch (error) {
        console.error('Error in lab booking:', error);
        await sock.sendMessage(chatId, { text: '⚠️ An error occurred. Type ".book" to try again.' });
        userStates.delete(userId);
    }
}

function createServiceButtons() {
    return Object.entries(labServices).map(([key, service]) => ({
        buttonId: `service_${key - 1}`, // Adjust for 0-based index
        buttonText: { displayText: `${service.name} - ₹${service.price}` },
        type: 1,
    }));
}

function createTimeButtons() {
    return timeSlots.map((slot, index) => ({
        buttonId: `time_${index}`,
        buttonText: { displayText: slot },
        type: 1,
    }));
}

async function showMainMenu(sock, chatId) {
    const message = {
        text: `*📋 Lab Booking System*\n\nPlease select a service by clicking the button below:`,
        buttons: createServiceButtons(),
        headerType: 1,
    };

    await sock.sendMessage(chatId, message, MessageType.buttonsMessage);
}

async function showDateSelection(sock, chatId) {
    const message = {
        text: `📅 *Select Appointment Date*\n\nPlease enter your preferred date (DD-MM-YYYY)\nExample: 14-02-2025\n\nNote: You can book appointments for the next 30 days only.`,
    };

    await sock.sendMessage(chatId, message);
}

async function showTimeSlots(sock, chatId) {
    const message = {
        text: `⌚ *Select Time Slot*\n\nPlease choose your preferred time by clicking the button below:`,
        buttons: createTimeButtons(),
        headerType: 1,
    };

    await sock.sendMessage(chatId, message, MessageType.buttonsMessage);
}

async function requestContactInfo(sock, chatId) {
    const message = {
        text: `👤 *Enter Contact Information*\n\nPlease provide the following details in this format:\nName, Age, Phone Number\n\nExample: John Doe, 30, 9876543210`,
    };

    await sock.sendMessage(chatId, message);
}

async function confirmBooking(sock, chatId, state) {
    const message = {
        text: `*📝 Confirm Booking Details*\n\nService: ${state.service.name}\nDate: ${state.date}\nTime: ${state.time}\nPrice: ₹${state.service.price}\nContact: ${state.contact}\n\nType "yes" to confirm or "no" to cancel.`,
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
        };

        await sock.sendMessage(chatId, message);
    } catch (error) {
        console.error('Error saving booking:', error);
        await sock.sendMessage(chatId, { text: '⚠️ Failed to save booking. Please try again.' });
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

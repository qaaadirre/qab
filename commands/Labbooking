const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Define available tests/services
const labServices = {
    '1': { name: 'Blood Test', price: '500', duration: '30 mins' },
    '2': { name: 'X-Ray', price: '1000', duration: '15 mins' },
    '3': { name: 'MRI Scan', price: '5000', duration: '45 mins' },
    '4': { name: 'CT Scan', price: '3000', duration: '30 mins' },
    '5': { name: 'ECG', price: '800', duration: '20 mins' }
};

// Time slots available
const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
    '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
];

// User booking states
const userStates = new Map();

async function labBookingCommand(sock, chatId, arg = '', sender) {
    const userId = sender.split('@')[0];
    
    // Initialize booking state if doesn't exist
    if (!userStates.has(userId)) {
        userStates.set(userId, { step: 'start' });
    }
    
    const state = userStates.get(userId);

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
                    await sock.sendMessage(chatId, { text: '❌ Invalid service. Please select from the menu.' });
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
                    await sock.sendMessage(chatId, { text: '❌ Invalid time slot. Please select from available slots.' });
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
                    userStates.delete(userId); // Clear state after successful booking
                } else {
                    await sock.sendMessage(chatId, { text: '❌ Booking cancelled. Type .book to start again.' });
                    userStates.delete(userId);
                }
                break;
        }
    } catch (error) {
        console.error('Error in lab booking:', error);
        await sock.sendMessage(chatId, { text: '⚠️ An error occurred. Please try again by typing .book' });
        userStates.delete(userId);
    }
}

async function showMainMenu(sock, chatId) {
    const message = `
┏━━━ *Lab Booking System* ━━━┓

*Available Services:*
${Object.entries(labServices).map(([key, service]) => 
    `${key}. ${service.name} - ₹${service.price}
   ⌚ Duration: ${service.duration}`
).join('\n\n')}

Please reply with the service number to book.`;

    await sock.sendMessage(chatId, { text: message });
}

async function showDateSelection(sock, chatId) {
    const message = `
Please enter your preferred date (DD-MM-YYYY)
Example: 14-02-2025

Note: You can book appointments for next 30 days only.`;

    await sock.sendMessage(chatId, { text: message });
}

async function showTimeSlots(sock, chatId) {
    const message = `
*Available Time Slots:*

${timeSlots.map(slot => `• ${slot}`).join('\n')}

Please reply with your preferred time slot.
Example: 09:00 AM`;

    await sock.sendMessage(chatId, { text: message });
}

async function requestContactInfo(sock, chatId) {
    const message = `
Please provide the following information:
Name, Age, Phone Number

Example: John Doe, 30, 9876543210`;

    await sock.sendMessage(chatId, { text: message });
}

async function confirmBooking(sock, chatId, state) {
    const message = `
*Please confirm your booking details:*

Service: ${state.service.name}
Date: ${state.date}
Time: ${state.time}
Price: ₹${state.service.price}
Contact: ${state.contact}

Reply 'yes' to confirm or 'no' to cancel.`;

    await sock.sendMessage(chatId, { text: message });
}

async function saveBooking(sock, chatId, state) {
    const excelPath = path.join(__dirname, '../data/bookings.xlsx');
    let workbook;
    
    // Create or load workbook
    if (fs.existsSync(excelPath)) {
        workbook = XLSX.readFile(excelPath);
    } else {
        workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'Bookings');
    }

    const ws = workbook.Sheets['Bookings'];
    const bookings = XLSX.utils.sheet_to_json(ws);

    // Add new booking
    const [name, age, phone] = state.contact.split(',').map(item => item.trim());
    const newBooking = {
        'Booking ID': `BK${Date.now()}`,
        'Date': state.date,
        'Time': state.time,
        'Service': state.service.name,
        'Price': state.service.price,
        'Patient Name': name,
        'Age': age,
        'Phone': phone,
        'Booking Date': new Date().toISOString()
    };

    bookings.push(newBooking);

    // Save to Excel
    const newWs = XLSX.utils.json_to_sheet(bookings);
    workbook.Sheets['Bookings'] = newWs;
    XLSX.writeFile(workbook, excelPath);

    const confirmMessage = `
🎉 *Booking Confirmed!*

Booking ID: ${newBooking['Booking ID']}
Service: ${state.service.name}
Date: ${state.date}
Time: ${state.time}

Please arrive 15 minutes before your appointment.
For cancellation, contact our helpdesk.

Thank you for choosing our services! 🙏`;

    await sock.sendMessage(chatId, { text: confirmMessage });
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

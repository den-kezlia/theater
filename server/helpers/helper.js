let Table = require('../models/Table');
let Bot = require('../models/Bot');
const CST = require('../../config/CST.json');

let getTickets = () => {
    let promise = async (resolve, reject) => {
        try {
            let records = await Table.getRecords(CST.TABLES.SEATS);
            let tickets = records.map(item => {
                return {
                    position: {
                        col: item.get('Col'),
                        row: item.get('Row'),
                    },
                    price: item.get('Price'),
                    status: item.get('Status').toLowerCase()
                }
            });

            resolve(tickets);
        } catch (error) {
            reject(error);
        }
    };

    return new Promise(promise);
}

let holdTickets = (data) => {
    // TODO: check if fields are not empty and valid
    let promise = async (resolve, reject) => {
        let query = _getTicketsSearchQuery(data.tickets);

        try {
            let records = await Table.getRecords(CST.TABLES.SEATS, {filterByFormula: query});

            records.forEach(ticket => {
                if (ticket.get('Status') !== CST.TICKET_STATUSES.FREE) {
                    reject({
                        error: true,
                        message: `Билет ${ticket.get('Row')} - ${ticket.get('Col')} занят`
                    })
                }
            });

            let guestID = await _getGuestID(data.guest);
            resolve(await _holdTickets({
                tickets: records,
                guestID: guestID,
                data: data
            }));
        } catch (error) {
            reject(error);
        }
    }

    return new Promise(promise);
}

module.exports = {
    getTickets: getTickets,
    holdTickets: holdTickets
}

let _holdTickets = async (data) => {
    for (let ticket of data.tickets) {
        try {
            await ticket.updateFields({
                'Status': CST.TICKET_STATUSES.HOLD,
                'Guest': [data.guestID]
            })
        } catch (error) {
            console.log(error);
        }
    };
    // TODO: sync guest with main Guests Table
    let ticketIDs = data.tickets.map(ticket => {
        return ticket.getId()
    });

    let order = await Table.createOrder({
        ticketIDs: ticketIDs,
        guestID: data.guestID
    });

    Bot.sendNewTicketHold({
        data: data.data,
        orderID: order.getId()
    });
}

let _getTicketsSearchQuery = (tickets) => {
    return 'OR(' + tickets.map(ticket => {
        return `AND(Row = "${ticket.position.row}", Col = "${ticket.position.col}")`
    }).join(',') + ')'
}

let _getGuestID = async (data) => {
    let promise = async (resolve, reject) => {
        // TODO: Resolve issue with phone search
        let query = `Email = "${data.email}"`;

        try {
            let records = await Table.getRecords(CST.TABLES.GUESTS, {
                filterByFormula: query
            })

            if (records && records.length > 0) {
                resolve(records[0].getId())
            } else {
                try {
                    let guest = await Table.createGuest(data);
                    resolve(guest.getId());
                } catch (error) {
                    reject(error);
                }
            }
        } catch (error) {
            reject(error)
        }
    }

    return new Promise(promise);
}

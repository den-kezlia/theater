let Cryptr = require('cryptr');
let config = require('../../config/config.json');
let cryptr = new Cryptr(config.secretKey);
let Table = require('../models/Table');
let logger = require('./logger')('helper');
const CST = require('../../config/CST.json');

let getTickets = (data) => {
    let promise = async (resolve, reject) => {
        try {
            let records = await Table.getRecords(decryptID(data.id), CST.TABLES.SEATS);
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
        let tableID = decryptID(data.id);

        try {
            let records = await Table.getRecords(tableID, CST.TABLES.SEATS, { filterByFormula: query });

            records.forEach(ticket => {
                if (ticket.get('Status') !== CST.TICKET_STATUSES.FREE) {
                    reject({
                        error: true,
                        message: `Билет ${ticket.get('Row')} - ${ticket.get('Col')} занят`
                    })
                }
            });

            let guestID = await _getGuestID(tableID, data.guest);
            let orderRecord = await _holdTickets(tableID, {
                ticketRecords: records,
                guestID: guestID
            });

            resolve({
                tableID: tableID,
                orderID: orderRecord.getId(),
                tickets: data.tickets,
                guest: data.guest
            });
        } catch (error) {
            reject(error);
        }
    }

    return new Promise(promise);
}

let getOrderDetails = async (tableID, order) => {
    let tickets = []
    for (let id of order.get('Seats')) {
        let ticketRecord = await Table.getRecord(tableID, CST.TABLES.SEATS, id);
        tickets.push({
            position: {
                row: ticketRecord.get('Row'),
                col: ticketRecord.get('Col')
            },
            price: ticketRecord.get('Price'),
            status: ticketRecord.get('Status')
        });
    }

    let guestRecord = await Table.getRecord(tableID, CST.TABLES.GUESTS, order.get('Guest'));
    let guest = {
        name: guestRecord.get('Name'),
        phone: guestRecord.get('Phone'),
        email: guestRecord.get('Email')
    }

    return {
        tickets: tickets,
        guest: guest,
        status: order.get('Status')
    };
}

let getOrders = async (options, tableID) => {
    let promise = (resolve, reject) => {
        let query;

        switch (options.type) {
            case 'active':
                query = `OR(Status = "${CST.ORDER_STATUSES.NEW}", Status = "${CST.ORDER_STATUSES.IN_PROGRESS}")`;
                break;
            case 'inProgress':
                query = `Status = "${CST.ORDER_STATUSES.IN_PROGRESS}"`;
                break;
            case 'mineInProgress':
                query = `AND(Status = "${CST.ORDER_STATUSES.IN_PROGRESS}", Name = "${options.userID}")`;
                break;
            default:
                break;
        }

        Table.getRecords(tableID, CST.TABLES.ORDERS, { filterByFormula: query }).then(records => {
            resolve(records);
        }).catch(error => {
            reject(error);
        })
    }

    return new Promise(promise);
}

let updateOrderStatus = async (tableID, data, orderStatus) => {
    try {
        let orderRecord = await Table.getRecord(tableID, CST.TABLES.ORDERS, data.orderID);
        let json = [{
            "id": orderRecord.getId(),
            "fields": {
                "Status": orderStatus,
                "Name": `${data.userID}`
            }
        }];
        try {
            let updatedOrderRecord = await Table.updateRecords(tableID, CST.TABLES.ORDERS, json);
            let nextTicketStatus;

            switch (orderStatus) {
                case CST.ORDER_STATUSES.REJECT:
                    nextTicketStatus = CST.TICKET_STATUSES.FREE;
                    break;
                case CST.ORDER_STATUSES.DONE:
                    nextTicketStatus = CST.TICKET_STATUSES.SOLD;
                    break;
                default:
                    break;
            }

            if (nextTicketStatus) {
                let ticketIDs = await updatedOrderRecord[0].get('Seats');
                let ticketsJSON = ticketIDs.map(ticketID => {
                    let json = {
                        "id": ticketID,
                        "fields": {
                            "Status": nextTicketStatus
                        }
                    }

                    if (orderStatus === CST.ORDER_STATUSES.REJECT) {
                        json.fields.Guest = [];
                    }

                    return json;
                })
                await Table.updateRecords(tableID, CST.TABLES.SEATS, ticketsJSON);
            }

            return updatedOrderRecord[0];
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
}

let getEvents = async () => {
    logger.info('----- start getEvents -> -----');

    logger.info('getting performance record ->');
    let performanceRecords = await Table.getRecords(config.ID, CST.TABLES.LIST);
    let eventTableIDs = [];
    let events = [];
    logger.info(`<- got performance record ${performanceRecords}`);

    performanceRecords.forEach(record => {
        let events = record.get('Events');

        if (events) {
            eventTableIDs = eventTableIDs.concat(events.split('|'));
        }
    });

    for (let id of eventTableIDs) {
        logger.info(`getting event record ${id} ->`);
        let eventRecord = await Table.getRecords(id, CST.TABLES.DETAILS);
        let event = {
            id: id,
            date: eventRecord[0].get('Date'),
            name: eventRecord[0].get('Name'),
            status: eventRecord[0].get('Status')
        }
        logger.info(`<- getting event record ${eventRecord}`);

        events.push(event);
    }

    logger.info('----- <- end getEvents -----');

    return events;
}

let formatTicketsMsg = (tickets) => {
    return tickets.map(ticket => {
        return `Ряд ${ticket.position.row} Место ${ticket.position.col}. Цена ${ticket.price} грн.`;
    }).join('\n');
}

let formatGuestMsg = (guest) => {
    return `Гость:\n${guest.name}. Телефон: ${guest.phone}. Email: ${guest.email}`
}

let decryptID = (id) => {
    return cryptr.decrypt(id);
}

module.exports = {
    getTickets: getTickets,
    holdTickets: holdTickets,
    getOrderDetails: getOrderDetails,
    getOrders: getOrders,
    updateOrderStatus: updateOrderStatus,
    getEvents: getEvents,
    formatTicketsMsg: formatTicketsMsg,
    formatGuestMsg: formatGuestMsg,
    decryptID: decryptID
}

let _holdTickets = async (tableID, data) => {
    let ticketIDs = [];

    for (let ticketRecord of data.ticketRecords) {
        try {
            await ticketRecord.updateFields({
                'Status': CST.TICKET_STATUSES.HOLD,
                'Guest': [data.guestID]
            });
            ticketIDs.push(ticketRecord.getId());
        } catch (error) {
            console.log(error);
        }
    };
    // TODO: sync guest with main Guests Table

    let orderRecord = await Table.createOrder(tableID, {
        ticketIDs: ticketIDs,
        guestID: data.guestID
    });

    return orderRecord;
}

let _getTicketsSearchQuery = (tickets) => {
    return 'OR(' + tickets.map(ticket => {
        return `AND(Row = "${ticket.position.row}", Col = "${ticket.position.col}")`
    }).join(',') + ')'
}

let _getGuestID = async (tableID, data) => {
    let promise = async (resolve, reject) => {
        // TODO: Resolve issue with phone search
        let query = `Email = "${data.email}"`;

        try {
            let records = await Table.getRecords(tableID, CST.TABLES.GUESTS, { filterByFormula: query });

            if (records && records.length > 0) {
                resolve(records[0].getId())
            } else {
                try {
                    let guest = await Table.createGuest(tableID, data);
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

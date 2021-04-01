let Table = require('../models/Table');
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
            let orderRecord = await _holdTickets({
                ticketRecords: records,
                guestID: guestID
            });

            resolve({
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

let getOrderDetails = async (order) => {
    let tickets = []
    for (let id of order.get('Seats')) {
        let ticketRecord = await Table.getRecord(CST.TABLES.SEATS, id);
        tickets.push({
            position: {
                row: ticketRecord.get('Row'),
                col: ticketRecord.get('Col')
            },
            price: ticketRecord.get('Price'),
            status: ticketRecord.get('Status')
        });
    }

    let guestRecord = await Table.getRecord(CST.TABLES.GUESTS, order.get('Guest'));
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

let getActiveOrders = async () => {
    let promise = (resolve, reject) => {
        let query = `OR(Status = "${CST.ORDER_STATUSES.NEW}", Status = "${CST.ORDER_STATUSES.IN_PROGRESS}")`;

        Table.getRecords(CST.TABLES.ORDERS, { filterByFormula: query }).then(records => {
            resolve(records);
        }).catch(error => {
            reject(error);
        })
    }

    return new Promise(promise);
}

let updateOrderStatus = async (data, orderStatus) => {
    try {
        let orderRecord = await Table.getRecord(CST.TABLES.ORDERS, data.orderID);
        let json = [{
            "id": orderRecord.getId(),
            "fields": {
                "Status": orderStatus,
                "Name": `${data.userID}`
            }
        }];
        try {
            let updatedOrderRecord = await Table.updateRecords(CST.TABLES.ORDERS, json);
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
                await Table.updateRecords(CST.TABLES.SEATS, ticketsJSON);
            }

            return updatedOrderRecord[0];
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
}

let formatTicketsMsg = (tickets) => {
    return tickets.map(ticket => {
        return `Ряд ${ticket.position.row} Место ${ticket.position.col}. Цена ${ticket.price} грн.`;
    }).join('\n');
}

let formatGuestMsg = (guest) => {
    return `Гость:\n${guest.name}. Телефон: ${guest.phone}. Email: ${guest.email}`
}

module.exports = {
    getTickets: getTickets,
    holdTickets: holdTickets,
    getOrderDetails: getOrderDetails,
    getActiveOrders: getActiveOrders,
    updateOrderStatus: updateOrderStatus,
    formatTicketsMsg: formatTicketsMsg,
    formatGuestMsg: formatGuestMsg
}

let _holdTickets = async (data) => {
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

    let orderRecord = await Table.createOrder({
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

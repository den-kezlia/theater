let config = require('../../config/config.json');
let Airtable = require('airtable');
let bot = require('./bot');

const KANBAN = 'Kanban';
const TICKET_STATUSES = {
    FREE: 'Free',
    HOLD: 'Hold',
    SOLD: 'Sold'
}

const ORDER_STATUSES = {
    NEW: 'New',
    IN_PROGRESS: 'In Progress',
    REJECT: 'Reject',
    Done: 'Done'
}

// TODO: resolve issue with table ID
const TABLE_TICKETS_ID = '';
const TABLE_GUESTS_ID = '';

Airtable.configure({
    endpointUrl: config.apiUrl,
    apiKey: config.apiKey
});

let getTickets = () => {
    let promise = (resolve, reject) => {
        let Table = Airtable.base(TABLE_TICKETS_ID);
        Table('Seats').select({ view: KANBAN }).firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            let tickets = records.map(item => {
                return {
                    position: {
                        col: item.get('Col'),
                        row: item.get('Row'),
                    },
                    price: item.get('Price'),
                    status: item.get('Status').toLowerCase()
                }
            })
            resolve(tickets);
        });
    };

    return new Promise(promise);
}

let holdTickets = (data) => {
    // TODO: check if fields are not empty and valid

    let promise = (resolve, reject) => {
        let Table = Airtable.base(TABLE_TICKETS_ID);
        let query = _getTicketsSearchQuery(data.tickets);

        Table('Seats').select({
            filterByFormula: query
        }).firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            records.forEach(ticket => {
                if (ticket.get('Status') !== TICKET_STATUSES.FREE) {
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
        })
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
                'Status': TICKET_STATUSES.HOLD,
                'Guest': [data.guestID]
            })
        } catch (error) {
            console.log(error);
        }
    };
    // TODO: sync guest with main Guests Table
    let order = await _createOrder(data);
    bot.sendNewTicketHold({
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
    let promise = (resolve, reject) => {
        let Table = Airtable.base(TABLE_TICKETS_ID);
        // TODO: Resolve issue with phone search
        let query = `Email = "${data.email}"`;

        Table('Guests').select({
            filterByFormula: query
        }).firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            if (records && records.length > 0) {
                resolve(records[0].getId())
            } else {
                try {
                    try {
                        let guest = await _createGuest(data);
                        resolve(guest.getId());
                    } catch (error) {
                        reject(error);
                    }
                } catch (error) {
                    reject(error);
                }
            }
        })
    }

    return new Promise(promise);
}

let _createGuest = async (data) => {
    let promise = (resolve, reject) => {
        let Table = Airtable.base(TABLE_TICKETS_ID);

        Table('Guests').create([
            {
                'fields': {
                    'Name': data.name,
                    'Phone': data.phone,
                    'Email': data.email
                }
            }
        ], (err, records) => {
            if (err) { reject(err); return; }

            resolve(records[0]);
        })
    }

    return new Promise(promise);
}

let _createOrder = async (data) => {
    let promise = (resolve, reject) => {
        let Table = Airtable.base(TABLE_TICKETS_ID);
        let seatsIDs = data.tickets.map(ticket => {
            return ticket.getId()
        })

        Table('Orders').create([
            {
                'fields': {
                    'Name': '',
                    'Status': ORDER_STATUSES.NEW,
                    'Guest': [data.guestID],
                    'Seats': seatsIDs
                }
            }
        ], (err, records) => {
            if (err) { reject(err); return; }

            resolve(records[0]);
        })
    }

    return new Promise(promise);
}
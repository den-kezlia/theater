let config = require('../../config/config.json');
let Airtable = require('airtable');

const KANBAN = 'Kanban';
const TICKET_STATUSES = {
    FREE: 'Free',
    HOLD: 'Hold',
    SOLD: 'Sold'
}
// TODO: resolve issue with table ID
const TABLE_ID = '';

Airtable.configure({
    endpointUrl: config.apiUrl,
    apiKey: config.apiKey
});

let getTickets = () => {
    let promise = (resolve, reject) => {
        let TicketsTable = Airtable.base(TABLE_ID);
        TicketsTable('Seats').select({ view: KANBAN }).firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            let tickets = records.map(item => {
                return {
                    coll: item.get('Coll'),
                    row: item.get('Row'),
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
        let TicketsTable = Airtable.base(TABLE_ID);
        let query = _getTicketsSearchQuery(data.tickets);

        TicketsTable('Seats').select({
            filterByFormula: query
        }).firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            records.forEach(ticket => {
                if (ticket.get('Status') !== TICKET_STATUSES.FREE) {
                    reject({
                        error: true,
                        message: `Билет ${ticket.get('Row')} - ${ticket.get('Coll')} занят`
                    })
                }
            });

            let guestID = await _getGuestID(data.guest);
            resolve(await _holdTickets({
                tickets: records,
                guestID: guestID
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
}

let _getTicketsSearchQuery = (tickets) => {
    return 'OR(' + tickets.map(ticket => {
        let position = ticket.position.split('-');
        return `AND(Row = "${position[0]}", Coll = "${position[1]}")`
    }).join(',') + ')'
}

let _getGuestID = async (data) => {
    let promise = (resolve, reject) => {
        let TicketsTable = Airtable.base(TABLE_ID);
        let query = `Phone = "${data.phone}"`;

        TicketsTable('Guests').select({
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
        let TicketsTable = Airtable.base(TABLE_ID);

        TicketsTable('Guests').create([
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

        // TODO: sync new guest with main Guests Table
    }

    return new Promise(promise);
}
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
    let promise = ((resolve, reject) => {
        let TicketsTable = Airtable.base(TABLE_ID);
        TicketsTable('Seats').select({ view: KANBAN }).firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            let tickets = records.map(item => {
                return {
                    coll: item.get('Coll'),
                    row: item.get('Row'),
                    price: item.get('Price'),
                    status: item.get('Status')
                }
            })
            resolve(tickets);
        });
    });

    return new Promise(promise);
}

module.exports = {
    getTickets: getTickets
}
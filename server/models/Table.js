let config = require('../../config/config.json');
let Airtable = require('airtable');
const CST = require('../../config/CST.json');

// TODO: resolve issue with table ID
const TABLE_TICKETS_ID = config.TABLE_TICKETS_ID;
const TABLE_GUESTS_ID = config.TABLE_GUESTS_ID;

class Table {
    constructor() {
        this.Airtable = Airtable;
        this.Airtable.configure({
            endpointUrl: config.apiUrl,
            apiKey: config.apiKey
        });
    }

    getRecords(table, selectOptions) {
        let promise = (resolve, reject) => {
            let SeatsTable = this.Airtable.base(TABLE_TICKETS_ID);
            let options = {};

            if (selectOptions) {
                options = Object.assign(options, selectOptions)
            }

            SeatsTable(table).select(options).firstPage(async (err, records) => {
                if (err) { reject(err); return; }

                resolve(records);
            });
        }

        return new Promise(promise);
    }

    createOrder(data) {
        let promise = (resolve, reject) => {
            let SeatsTable = this.Airtable.base(TABLE_TICKETS_ID);

            SeatsTable(CST.TABLES.ORDERS).create([
                {
                    'fields': {
                        'Name': '',
                        'Status': CST.ORDER_STATUSES.NEW,
                        'Guest': [data.guestID],
                        'Seats': data.ticketIDs
                    }
                }
            ], (err, records) => {
                if (err) { reject(err); return; }

                resolve(records[0]);
            })
        }

        return new Promise(promise);
    }

    createGuest(data) {
        let promise = (resolve, reject) => {
            let SeatsTable = this.Airtable.base(TABLE_TICKETS_ID);

            SeatsTable(CST.TABLES.GUESTS).create([
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
}

module.exports = new Table();

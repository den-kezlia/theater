let Airtable = require('airtable');
let config = require('../../config/config.json');
const CST = require('../../config/CST.json');

class Table {
    constructor() {
        this.Airtable = Airtable;
        this.Airtable.configure({
            endpointUrl: config.apiUrl,
            apiKey: config.apiKey
        });
    }

    getRecords(tableID, tableType, selectOptions) {
        let promise = (resolve, reject) => {
            let table = this.Airtable.base(tableID);
            let options = {};

            if (selectOptions) {
                options = Object.assign(options, selectOptions)
            }

            table(tableType).select(options).firstPage(async (err, records) => {
                if (err) { reject(err); return; }

                resolve(records);
            });
        }

        return new Promise(promise);
    }

    getRecord(tableID, tableType, RecordID) {
        let promise = (resolve, reject) => {
            let table = this.Airtable.base(tableID);

            table(tableType).find(RecordID, (err, record) => {
                if (err) { reject(err); return; }

                resolve(record);
            });
        }

        return new Promise(promise);
    }

    updateRecords(tableID, tableType, data) {
        let promise = (resolve, reject) => {
            let table = this.Airtable.base(tableID);

            table(tableType).update(data, (err, records) => {
                if (err) { reject(err); return; }

                resolve(records);
            });
        }

        return new Promise(promise);
    }

    createOrder(tableID, data) {
        let promise = (resolve, reject) => {
            let SeatsTable = this.Airtable.base(tableID);

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

    createGuest(tableID, data) {
        let promise = (resolve, reject) => {
            let SeatsTable = this.Airtable.base(tableID);

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

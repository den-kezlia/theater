let config = require('../../config/config.json');
let Airtable = require('airtable');
let Cryptr = require('cryptr');
let cryptr = new Cryptr(config.secretKey);

Airtable.configure({
    endpointUrl: config.apiUrl,
    apiKey: config.apiKey
});

async function _parsePerformanceRecords(records) {
    let performances = [];

    for (let record of records) {
        if (record.get('Name')) {
            let performance = {
                name: record.get('Name'),
                description: record.get('Description'),
                image: record.get('Image'),
                address: record.get('Address'),
                duration: record.get('Duration'),
                events: []
            }

            if (record.get('Events')) {
                let events = await _getEvents(record.get('Events').split('|'));
                performance.events = events;
            }

            performances.push(performance)
        }
    }

    return performances;
}

let _getEvents = (IDs) => {
    return Promise.all(IDs.map(_getEvent));
}

let _getEvent = (id) => {
    let promise = (resolve, reject) => {
        let eventTable = Airtable.base(id);

        eventTable('Details').select().firstPage((err, records) => {
            if (err) { reject(err); return; }

            resolve({
                date: records[0].get('Date'),
                name: records[0].get('Name'),
                id: cryptr.encrypt(id),
                arrangement: records[0].get('Arrangement')
            });
        });
    }

    return new Promise(promise);
}

let getPerformances = () => {
    let promise = ((resolve, reject) => {
        let PerformancesTable = Airtable.base(config.ID);
        PerformancesTable('List').select().firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            resolve(await _parsePerformanceRecords(records));
        });
    });

    return new Promise(promise);
}

module.exports = {
    getPerformances: getPerformances
}

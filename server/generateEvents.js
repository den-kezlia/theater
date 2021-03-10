const config = require('../config/config.json');
const Airtable = require('airtable');
const fs = require('fs');
const path = require('path');

Airtable.configure({
    endpointUrl: config.apiUrl,
    apiKey: config.apiKey
});
const IDTable = Airtable.base(config.ID);

const getIDs = () => {
    const promise = (resolve, reject) => {
        const IDs = [];

        IDTable('IDs').select({
            view: config.view
        }).eachPage(function page(records) {
            records.forEach(function(record) {
                IDs.push(record.get('ID'))
            });

            resolve(IDs)
        }, function done(err) {
            if (err) { console.error(err); reject(); return; }
        });
    }

    return new Promise(promise);
}

const getEvent = (id) => {
    const promise = (resolve, reject) => {
        const eventTable = Airtable.base(id);

        eventTable('Description').select({
            view: config.view
        }).eachPage(function page(records) {
            records.forEach(function(record) {
                const eventData = {};
                eventData.date = record.get('Date');
                eventData.address = record.get('Address');
                eventData.description = record.get('Description');

                resolve(eventData);
            });
        }, function done(err) {
            if (err) { console.error(err); reject(err); return; }
        });
    }

    return new Promise(promise);
}

const generateEventHTML = (data) => {
    return `---
    title: Спектакль "Гавриилиада"
    eventTitle: Гавриилиада
    description: ${data.description}
    date: ${data.date}
    address: ${data.address}
    images:
        main: images/main.jpg
    ---`;
}

const generateEventFile = (html) => {
    let filename = path.resolve(__dirname, `../src/events/test/index.html`);

    fs.appendFile(filename, html, function (err) {
        if (err) return console.log(err);
    });
}

getIDs().then(IDs => {
    return Promise.all(IDs.map(getEvent))
}).then(events => {
    console.log(events)
}).catch(err => {
    console.log(err)
})
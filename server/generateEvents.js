const config = require('../config/config.json');
const Airtable = require('airtable');
const tr = require('transliteration');
const fs = require('fs');
const path = require('path');
const http = require('https');

Airtable.configure({
    endpointUrl: config.apiUrl,
    apiKey: config.apiKey
});

const generateFolderName = (name) => {
    return tr.transliterate(name, config.transliterationOptions).toLocaleLowerCase().split(' ').join('_')
}

async function parsePerformanceRecords(records) {
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
                let events = await getEvents(record.get('Events').split(','));
                performance.events = events;
            }

            performances.push(performance)
        }
    }

    return performances;
}

const getPerformances = () => {
    let promise = ((resolve, reject) => {
        let PerformancesTable = Airtable.base(config.ID);
        PerformancesTable('List').select().firstPage(async (err, records) => {
            if (err) { reject(err); return; }

            resolve(await parsePerformanceRecords(records));
        });
    });

    return new Promise(promise);
}

const getEvents = (IDs) => {
    return Promise.all(IDs.map(getEvent));
}

const getEvent = (id) => {
    let promise = (resolve, reject) => {
        let eventTable = Airtable.base(id);

        eventTable('Details').select().firstPage((err, records) => {
            if (err) { reject(err); return; }

            resolve({
                date: records[0].get('Date'),
                name: records[0].get('Name')
            });
        });
    }

    return new Promise(promise);
}

const generateFolders = (folders) => {
    folders.map(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    })
}

const generateImages = (folder, image) => {
    // TODO: implement webp images
    let mainImage = {
        path: path.resolve(folder, 'main.jpg'),
        url: image.url
    };
    let thumbImage = {
        path: path.resolve(folder, 'thumb.jpg'),
        url: image.thumbnails.large.url
    };
    let images = [mainImage, thumbImage];

    images.map(img => {
        let imgFile = fs.createWriteStream(img.path);

        http.get(img.url, data => {
            data.pipe(imgFile);
        });
    })
}

const generatePerformance = (performance) => {
    let html = generatePerformanceHTML(performance);
    let folderName = generateFolderName(performance.name);
    let src = path.resolve(__dirname, `../${config.srcPerformancePath}`);
    let folderPath = path.resolve(src, folderName);
    let imagePath = path.resolve(folderPath, 'images');

    generateFolders([src, folderPath, imagePath]);
    generateHTMLFile(folderPath, html);
    generateImages(imagePath, performance.image[0]);
}

const generateHTMLFile = (folder, html) => {
    let filePath = path.resolve(folder, 'index.html');

    fs.writeFileSync(filePath, html, { flag: 'w+' }, function (err) {
        if (err) return console.log(err);
    });
}

const getPerformanceDates = (events) => {
    let dates = [];

    events.forEach(event => {
        dates.push(event.date);
    })

    return dates
}

const getPerformanceEventsHTML = (events) => {
    let dates = getPerformanceDates(events);

    return dates.map(date => {
        return `  - date: ${date}\n`
    })
}

const generatePerformanceHTML = (data) => {
    let html = `---
title: ${data.name}
name: ${data.name}
description: ${data.description}
address: ${data.address}
duration: ${data.duration}
events:
${getPerformanceEventsHTML(data.events)}
images:
    main: images/main.jpg,
    thumb: images/thumb.jpg
---`;

    return html;
}

getPerformances().then(performances => {
    performances.map(generatePerformance)
}).catch(err => {
    console.log(err)
});

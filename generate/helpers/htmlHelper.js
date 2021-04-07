let tr = require('transliteration');
let fs = require('fs');
let path = require('path');
let http = require('https');
let config = require('../../config/config');

let generatePerformance = (performance) => {
    let html = _generatePerformanceHTML(performance);
    let folderName = _generateFolderName(performance.name);
    let src = path.resolve(__dirname, `../../${config.srcPerformancePath}`);
    let folderPath = path.resolve(src, folderName);
    let imagePath = path.resolve(folderPath, 'images');
    let eventsPath = path.resolve(folderPath, 'events');
    let foldersToCreate = [src, folderPath, imagePath, eventsPath];

    performance.events.forEach(event => {
        let date = new Date(event.date);
        let folderName = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        foldersToCreate.push(path.resolve(eventsPath, folderName));
    });

    _generateFolders(foldersToCreate);
    _generateHTMLFile(folderPath, html);
    _generateImages(imagePath, performance.image[0]);
    _generateEvents(performance, eventsPath);
}

module.exports = {
    generatePerformance: generatePerformance
}

let _generateFolderName = (name) => {
    return tr.transliterate(name, config.transliterationOptions).toLocaleLowerCase().split(' ').join('_')
}

let _generateFolders = (folders) => {
    folders.map(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    })
}

let _generateImages = (folder, image) => {
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

let _generateHTMLFile = (folder, html) => {
    let filePath = path.resolve(folder, 'index.html');

    fs.writeFileSync(filePath, html, { flag: 'w+' }, function (err) {
        if (err) return console.log(err);
    });
}

let _getPerformanceEvents = (events) => {
    let eventsFormatted = [];

    events.forEach(event => {
        eventsFormatted.push({
            id: event.id,
            date: event.date
        });
    })

    return eventsFormatted
}


let _getPerformanceEventsHTML = (events) => {
    let eventsFormatted = _getPerformanceEvents(events);

    return eventsFormatted.map(event => {
        let date = new Date(event.date);
        let dateShort = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        return `  -\n    id: ${event.id}\n    date: ${event.date}\n    dateShort: ${dateShort}\n`
    }).join('');
}

let _generateEvents = (performance, eventsPath) => {
    let events = performance.events;
    let description = _generatePerformanceDescription(performance);

    events.forEach(event => {
        let date = new Date(event.date);
        let dateShort = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        let filePath = path.resolve(eventsPath, dateShort, 'index.html');
        let html = `---
id: ${event.id}
date: ${event.date}
dateShort: ${dateShort}
${description}
layout: events/${event.arrangement.split(' ').join('-').toLowerCase()}.liquid
---`;

        fs.writeFileSync(filePath, html, { flag: 'w+' }, function (err) {
            if (err) return console.log(err);
        });
    });
}

let _generatePerformanceHTML = (performance) => {
    let description = _generatePerformanceDescription(performance);
    let html = `---
${description}
events:
${_getPerformanceEventsHTML(performance.events)}
---`;

    return html;
}

let _generatePerformanceDescription = (performance) => {
    return `title: ${performance.name}
name: ${performance.name}
description: ${performance.description}
address: ${performance.address}
duration: ${performance.duration}
images:
    main: images/main.jpg,
    thumb: images/thumb.jpg`;
}
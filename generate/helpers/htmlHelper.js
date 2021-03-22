const tr = require('transliteration');
const fs = require('fs');
const path = require('path');
const http = require('https');

const config = require('../../config/config');

const _generateFolderName = (name) => {
    return tr.transliterate(name, config.transliterationOptions).toLocaleLowerCase().split(' ').join('_')
}

const _generateFolders = (folders) => {
    folders.map(folder => {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    })
}

const _generateImages = (folder, image) => {
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

const _generateHTMLFile = (folder, html) => {
    let filePath = path.resolve(folder, 'index.html');

    fs.writeFileSync(filePath, html, { flag: 'w+' }, function (err) {
        if (err) return console.log(err);
    });
}

const _getPerformanceDates = (events) => {
    let dates = [];

    events.forEach(event => {
        dates.push(event.date);
    })

    return dates
}


const _getPerformanceEventsHTML = (events) => {
    let dates = _getPerformanceDates(events);

    return dates.map(date => {
        return `  - date: ${date}\n`
    })
}

const _generatePerformanceHTML = (data) => {
    let html = `---
title: ${data.name}
name: ${data.name}
description: ${data.description}
address: ${data.address}
duration: ${data.duration}
events:
${_getPerformanceEventsHTML(data.events)}
images:
    main: images/main.jpg,
    thumb: images/thumb.jpg
---`;

    return html;
}

const generatePerformance = (performance) => {
    let html = _generatePerformanceHTML(performance);
    let folderName = _generateFolderName(performance.name);
    let src = path.resolve(__dirname, `../../${config.srcPerformancePath}`);
    let folderPath = path.resolve(src, folderName);
    let imagePath = path.resolve(folderPath, 'images');

    _generateFolders([src, folderPath, imagePath]);
    _generateHTMLFile(folderPath, html);
    _generateImages(imagePath, performance.image[0]);
}

module.exports = {
    generatePerformance: generatePerformance
}
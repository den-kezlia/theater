const htmlHelper = require('./helpers/htmlHelper');
const airtableHelper = require('./helpers/airtableHelper');

airtableHelper.getPerformances().then(performances => {
    performances.map(htmlHelper.generatePerformance)
}).catch(err => {
    console.log(err)
});

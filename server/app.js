let express = require('express');
let cors = require('cors');
let helper = require('./helpers/helper');
let Bot = require('./models/Bot');
let logger = require('./helpers/logger')('app');

let app = express();
// TODO: Find solution for cors
app.use(cors({origin: 'http://localhost:8080'}));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.post('/api/getTickets', async (req, res) => {
    logger.info('----- APP Start api/getTickets -----');
    let error = false;
    let message = '';
    let tickets = [];

    try {
        logger.info('getting tickets');
        tickets = await helper.getTickets(req.body);
        logger.info('got tickets');
    } catch (err) {
        error = true;
        message = err.message;
        logger.log({
            level: 'error',
            message: err.message
        })
    }

    logger.info('----- APP End api/getTickets -----');
    res.json({
        error: error,
        message: message,
        tickets: tickets
    });
});

app.post('/api/holdTickets', async (req, res) => {
    let error = false;
    let message = '';

    try {
        let result = await helper.holdTickets(req.body);
        await Bot.sendNewTicketHold(result);
        message = result;
    } catch (err) {
        error = true;
        message = err.message;
    }

    // TODO: Remove tableID from response
    res.json({
        error: error,
        message: message
    });
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
let express = require('express');
let cors = require('cors');
let airtableHelper = require('./helpers/airtableHelper');

let app = express();
app.use(cors({origin: 'http://localhost:8080'}));
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.get('/api/getTickets', async (req, res) => {
    let error = false;
    let message = '';
    let tickets = [];

    try {
        tickets = await airtableHelper.getTickets();
    } catch (err) {
        error = true;
        message = err.message;
    }

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
        let result = await airtableHelper.holdTickets(req.body);
        message = result;
    } catch (err) {
        error = true;
        message = err.message;
    }

    res.json({
        error: error,
        message: message
    });
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
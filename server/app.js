let express = require('express');
let cors = require('cors');

let app = express();
app.use(cors({
    origin: 'http://localhost:8080'
  }));

app.get('/api/getTickets', (req, res) => {
    res.json({
        error: false,
        tickets: {
            me: 'hey you',
            you: 'hey me'
        }
    });
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
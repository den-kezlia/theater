let TeleBot = require('telebot');
let config = require('../../config/config.json');

// TODO: improve this config
const ID_LIST = config.TELEGRAM_ID_LIST;

class Bot {
    constructor() {
        let buttons = {
            getAllOrders: {
                label: 'Все заказы',
                command: '/getAllOrders'
            },
            getInProgressOrders: {
                label: 'В обработке',
                command: '/getInProgressOrders'
            },
            getMineIProgressOrders: {
                label: 'Мои обработке',
                command: '/getMineIProgressOrders'
            }
        };

        this.bot = new TeleBot({
            token: config.TELEGRAM_TOKEN,
            usePlugins: ['namedButtons', 'commandButton'],
            pluginConfig: {
                namedButtons: {
                    buttons: buttons
                }
            }
        });

        this.bot.on('callbackQuery', msg => {
            let id = msg.from.id;
            let replyOptions = {};
            let data = JSON.parse(msg.data);
            let message;

            switch (data.type) {
                case 'inProgress':
                    _updateOrderStatus({
                        orderID: data.orderID,
                        userID: id
                    });
                    message = 'Взял в обработку';
                    break;
                default:
                    break;
            }

            return this.bot.sendMessage(id, message, replyOptions);
        });

        this.bot.start();
    }

    sendNewTicketHold(data) {
        let ticketsMsg = _formatTicketsMsg(data.data.tickets);
        let guestMsg = _formatGuestMsg(data.data.guest);
        let message = ticketsMsg + '\n\n' + guestMsg;

        let replyMarkup = this.bot.inlineKeyboard([
            [
                // First row with command callback button
                this.bot.inlineButton('Беру в обработку', {callback: JSON.stringify({
                    type: 'inProgress',
                    orderID: data.orderID
                })})
            ]
        ]);

        ID_LIST.forEach(id => {
            this.bot.sendMessage(id, message, {replyMarkup});
        })
    }
}

module.exports = new Bot();

let _formatTicketsMsg = (tickets) => {
    return tickets.map(ticket => {
        return `Ряд ${ticket.position.row} Место ${ticket.position.col}. Цена ${ticket.price} грн.`;
    }).join('\n');
}

let _formatGuestMsg = (guest) => {
    return `Гость:\n${guest.name}. Телефон: ${guest.phone}. Email: ${guest.email}`
}

let _updateOrderStatus = (data) => {

}

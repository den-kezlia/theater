let TeleBot = require('telebot');
let config = require('../../config/config.json');
let Table = require('./Table');
const CST = require('../../config/CST.json');

// TODO: improve this config
const ID_LIST = config.TELEGRAM_ID_LIST;

let _getButtons = () => {
    return {
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
    }
}

class Bot {
    constructor() {
        let buttons = _getButtons();

        this.bot = new TeleBot({
            token: config.TELEGRAM_TOKEN,
            usePlugins: ['namedButtons', 'commandButton'],
            pluginConfig: {
                namedButtons: {
                    buttons: buttons
                }
            }
        });

        this.bot.on('/start', msg => {
            let id = msg.from.id;
            let replyOptions = {
                replyMarkup: this.bot.keyboard([
                    [
                        buttons.getAllOrders.label,
                        buttons.getInProgressOrders.label,
                        buttons.getMineIProgressOrders.label
                    ]
                ], { resize: true }),
                parseMode: 'markdown'
            };

            return this.bot.sendMessage(id, 'Выберите одну из команд', replyOptions);
        });

        this.bot.on('/getAllOrders', msg => {
            let id = msg.from.id;
            let query = `OR(Status = "${CST.ORDER_STATUSES.NEW}", Status = "${CST.ORDER_STATUSES.IN_PROGRESS}")`;

            Table.getRecords(CST.TABLES.ORDERS, { filterByFormula: query }).then(async records => {
                for (let order of records) {
                    try {
                        await this._sendOrderCard(id, order);
                    } catch (error) {
                        console.log(error);
                    }
                }

            }).catch(error => {
                console.log(error);
            })
        });

        this.bot.on('callbackQuery', msg => {
            let id = msg.from.id;
            let replyOptions = {};
            let data = JSON.parse(msg.data);
            let message;
            let status;

            switch (data.type) {
                case 'inProgress':
                    status = CST.ORDER_STATUSES.IN_PROGRESS;
                    message = 'Беру в обработку';
                    break;
                case 'cancel':
                    status = CST.ORDER_STATUSES.REJECT;
                    message = 'Отмена заказа';
                    break;
                case 'done':
                    status = CST.ORDER_STATUSES.DONE;
                    message = 'Продано';
                    break;
                default:
                    break;
            }

            _updateOrderStatus({
                orderID: data.orderID,
                userID: id
            }, status).then(updatedOrder => {
                return this.bot.sendMessage(id, message, replyOptions);
            }).catch(error => {
                console.log(error);
            });
        });

        this.bot.start();
    }

    sendNewTicketHold(data) {
        let ticketsMsg = _formatTicketsMsg(data.data.tickets);
        let guestMsg = _formatGuestMsg(data.data.guest);
        let message = ticketsMsg + '\n\n' + guestMsg;

        let replyMarkup = this.bot.inlineKeyboard([
            [
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

    async _sendOrderCard (id, orderRecord) {
        let replyMarkup;
        let orderDetails = await _getOrderDetails(orderRecord);
        let ticketsMsg = _formatTicketsMsg(orderDetails.tickets);
        let guestMsg = _formatGuestMsg(orderDetails.guest);
        let message = ticketsMsg + '\n\n' + guestMsg;

        switch (orderDetails.status) {
            case CST.ORDER_STATUSES.NEW:
                replyMarkup = this.bot.inlineKeyboard([
                    [
                        this.bot.inlineButton('Беру в обработку', {
                            callback: JSON.stringify({
                                type: 'inProgress',
                                orderID: orderRecord.getId()
                            }
                        )})
                    ]
                ]);
                break;
            case CST.ORDER_STATUSES.IN_PROGRESS:
                replyMarkup = this.bot.inlineKeyboard([
                    [
                        this.bot.inlineButton('Отмена', {callback: JSON.stringify(
                            {
                                type: 'cancel',
                                orderID: orderRecord.getId()
                            }
                        )})
                    ], [
                        this.bot.inlineButton('Продано', {callback: JSON.stringify(
                            {
                                type: 'done',
                                orderID: orderRecord.getId()
                            }
                        )})
                    ]
                ]);

                break;
            default:
                break;
        }

        this.bot.sendMessage(id, message, { replyMarkup })
    }
}

module.exports = new Bot();

let _getOrderDetails = async (order) => {
    let tickets = []
    for (let id of order.get('Seats')) {
        let ticketRecord = await Table.getRecord(CST.TABLES.SEATS, id);
        tickets.push({
            position: {
                row: ticketRecord.get('Row'),
                col: ticketRecord.get('Col')
            },
            price: ticketRecord.get('Price'),
            status: ticketRecord.get('Status')
        });
    }

    let guestRecord = await Table.getRecord(CST.TABLES.GUESTS, order.get('Guest'));
    let guest = {
        name: guestRecord.get('Name'),
        phone: guestRecord.get('Phone'),
        email: guestRecord.get('Email')
    }

    return {
        tickets: tickets,
        guest: guest,
        status: order.get('Status')
    };
}

let _formatTicketsMsg = (tickets) => {
    return tickets.map(ticket => {
        return `Ряд ${ticket.position.row} Место ${ticket.position.col}. Цена ${ticket.price} грн.`;
    }).join('\n');
}

let _formatGuestMsg = (guest) => {
    return `Гость:\n${guest.name}. Телефон: ${guest.phone}. Email: ${guest.email}`
}

let _updateOrderStatus = async (data, orderStatus) => {
    try {
        let orderRecord = await Table.getRecord(CST.TABLES.ORDERS, data.orderID);
        let json = [{
            "id": orderRecord.getId(),
            "fields": {
                "Status": orderStatus,
                "Name": `${data.userID}`
            }
        }];
        try {
            let updatedOrderRecord = await Table.updateRecords(CST.TABLES.ORDERS, json);
            let nextTicketStatus;

            switch (orderStatus) {
                case CST.ORDER_STATUSES.REJECT:
                    nextTicketStatus = CST.TICKET_STATUSES.FREE;
                    break;
                case CST.ORDER_STATUSES.DONE:
                    nextTicketStatus = CST.TICKET_STATUSES.SOLD;
                    break;
                default:
                    break;
            }

            if (nextTicketStatus) {
                let ticketIDs = await updatedOrderRecord[0].get('Seats');
                let ticketsJSON = ticketIDs.map(ticketID => {
                    let json = {
                        "id": ticketID,
                        "fields": {
                            "Status": nextTicketStatus
                        }
                    }

                    if (orderStatus === CST.ORDER_STATUSES.REJECT) {
                        json.fields.Guest = [];
                    }

                    return json;
                })
                await Table.updateRecords(CST.TABLES.SEATS, ticketsJSON);
            }

            return updatedOrderRecord[0];
        } catch (error) {
            console.log(error)
        }
    } catch (error) {
        console.log(error)
    }
}

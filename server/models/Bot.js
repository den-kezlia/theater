let TeleBot = require('telebot');
let config = require('../../config/config.json');
let helper = require('../helpers/helper');
const CST = require('../../config/CST.json');

// TODO: improve this config
const ID_LIST = config.TELEGRAM_ID_LIST;

let _getButtons = () => {
    return {
        getActiveOrders: {
            label: 'Все заказы',
            command: '/getActiveOrders'
        },
        getInProgressOrders: {
            label: 'В обработке',
            command: '/getInProgressOrders'
        },
        getMineInProgressOrders: {
            label: 'Мои обработке',
            command: '/getMineInProgressOrders'
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
                        buttons.getActiveOrders.label,
                        buttons.getInProgressOrders.label,
                        buttons.getMineInProgressOrders.label
                    ]
                ], { resize: true }),
                parseMode: 'markdown'
            };

            return this.bot.sendMessage(id, 'Выберите одну из команд', replyOptions);
        });

        this.bot.on('/getActiveOrders', msg => {
            let id = msg.from.id;

            helper.getActiveOrders().then(async orderRecords => {
                for (let orderRecord of orderRecords) {
                    try {
                        await this._sendOrderCard(id, orderRecord);
                    } catch (error) {
                        console.log(error);
                    }
                }
            }).catch(error => {
                console.log(error);
            });
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

            helper.updateOrderStatus({
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
        let ticketsMsg = helper.formatTicketsMsg(data.tickets);
        let guestMsg = helper.formatGuestMsg(data.guest);
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
        let orderDetails = await helper.getOrderDetails(orderRecord);
        let ticketsMsg = helper.formatTicketsMsg(orderDetails.tickets);
        let guestMsg = helper.formatGuestMsg(orderDetails.guest);
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
                        this.bot.inlineButton('Отмена', {
                            callback: JSON.stringify({
                                type: 'cancel',
                                orderID: orderRecord.getId()
                        })})
                    ], [
                        this.bot.inlineButton('Продано', {
                            callback: JSON.stringify({
                                type: 'done',
                                orderID: orderRecord.getId()
                        })})
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

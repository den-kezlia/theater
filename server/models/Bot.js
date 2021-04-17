let TeleBot = require('telebot');
let config = require('../../config/config.json');
let helper = require('../helpers/helper');
let logger = require('../helpers/logger')('bot');
const CST = require('../../config/CST.json');

let ACTIONS = {};

// TODO: improve this config
const ID_LIST = config.TELEGRAM_ID_LIST;

let _getButtons = () => {
    return {
        selectPerformance: {
            label: 'Выбрать спектакль',
            command: '/getEvents'
        },
        getActiveOrders: {
            label: 'Все заказы',
            command: '/getActiveOrders'
        },
        getInProgressOrders: {
            label: 'В обработке',
            command: '/getInProgressOrders'
        },
        getMineInProgressOrders: {
            label: 'Мои в обработке',
            command: '/getMineInProgressOrders'
        }
    }
}

class Bot {
    constructor() {
        let buttons = _getButtons();

        logger.info('----- Starting -----');
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
            logger.info('----- on /start -> -----');

            let id = msg.from.id;
            let replyOptions = {
                replyMarkup: this.bot.keyboard([
                    [
                        buttons.selectPerformance.label
                    ]
                ], { resize: true }),
                parseMode: 'markdown'
            };

            this.bot.sendMessage(id, 'Выберать спектакль', replyOptions);
            logger.info('----- <- end /start -----');
        });

        this.bot.on('/getEvents', msg => {
            logger.info('----- on /getEvents -> -----');

            let id = msg.from.id;

            logger.info('getting events');
            helper.getEvents().then(async events => {
                for (let event of events) {
                    try {
                        await this._sendEventCard(id, event);
                    } catch (error) {
                        console.log(error);
                    }
                }
                logger.info('----- <- end /getEvents -----');
            }).catch(error => {
                console.log(error);
                logger.log({
                    level: 'error',
                    message: error
                })
            })
        });

        this.bot.on('/getActiveOrders', msg => {
            logger.info('----- on /getActiveOrders -> -----');
            let id = msg.from.id;

            if (!ACTIONS[id] || !ACTIONS[id].tableID) {
                this.bot.sendMessage(id, 'бляя...');

                return false;
            }

            helper.getOrders({ type: 'active' }, ACTIONS[id].tableID).then(async orderRecords => {
                // TODO: show message if no orders
                if (!orderRecords.length) {
                    this.bot.sendMessage(id, 'Нет еще заказов у этого спектакля. Нужно поднажать');

                    return;
                }

                for (let orderRecord of orderRecords) {
                    try {
                        await this._sendOrderCard(id, orderRecord);
                    } catch (error) {
                        console.log(error);
                    }
                }
                logger.info('----- <- end /getActiveOrders -----');
            }).catch(error => {
                console.log(error);

                logger.log({
                    level: 'error',
                    message: error
                })
            });
        });

        this.bot.on('/getInProgressOrders', msg => {
            logger.info('----- on /getInProgressOrders -> -----');
            let id = msg.from.id;

            if (!ACTIONS[id] || !ACTIONS[id].tableID) {
                this.bot.sendMessage(id, 'бляя...');

                return false;
            }

            helper.getOrders({ type: 'inProgress' }, ACTIONS[id].tableID).then(async orderRecords => {
                // TODO: show message if no orders
                if (!orderRecords.length) {
                    this.bot.sendMessage(id, 'Нет еще заказов у этого спектакля. Нужно поднажать');

                    return;
                }

                for (let orderRecord of orderRecords) {
                    try {
                        await this._sendOrderCard(id, orderRecord);
                    } catch (error) {
                        console.log(error);
                    }
                }
                logger.info('----- <- end /getInProgressOrders -----');
            }).catch(error => {
                console.log(error);

                logger.log({
                    level: 'error',
                    message: error
                })
            });
        });

        this.bot.on('/getMineInProgressOrders', msg => {
            logger.info('----- on /getMineInProgressOrders -> -----');
            let id = msg.from.id;

            if (!ACTIONS[id] || !ACTIONS[id].tableID) {
                this.bot.sendMessage(id, 'бляя...');

                return false;
            }

            helper.getOrders({ type: 'mineInProgress', userID: id }, ACTIONS[id].tableID).then(async orderRecords => {
                // TODO: show message if no orders
                if (!orderRecords.length) {
                    this.bot.sendMessage(id, 'Нет еще заказов у этого спектакля. Нужно поднажать');

                    return;
                }

                for (let orderRecord of orderRecords) {
                    try {
                        await this._sendOrderCard(id, orderRecord);
                    } catch (error) {
                        console.log(error);
                    }
                }
                logger.info('----- <- end /getMineInProgressOrders -----');
            }).catch(error => {
                console.log(error);

                logger.log({
                    level: 'error',
                    message: error
                })
            });
        });

        this.bot.on('callbackQuery', msg => {
            logger.info('----- on /callbackQuery -> -----');

            let id = msg.from.id;
            let data = JSON.parse(msg.data);

            logger.info(`action ${data.action} ->`);

            switch (data.action) {
                case CST.ACTIONS.UPDATE_ORDER:
                    this.orderAction(id, data);
                    break;
                case CST.ACTIONS.SELECT_EVENT:
                    this.eventAction(id, data);
                    break;
            }
        });

        this.bot.start();
    }

    orderAction(id, data) {
        logger.info(`sending order action cards ->`);

        let replyOptions = {};
        let message;
        let status;

        if (!ACTIONS[id] || !ACTIONS[id].tableID) {
            this.bot.sendMessage(id, 'да бляя...');

            return false;
        }

        switch (data.type) {
            case CST.ACTION_TYPE.IN_PROGRESS:
                status = CST.ORDER_STATUSES.IN_PROGRESS;
                message = 'Беру в обработку';
                break;
            case CST.ACTION_TYPE.CANCEL:
                status = CST.ORDER_STATUSES.REJECT;
                message = 'Отмена заказа';
                break;
            case CST.ACTION_TYPE.DONE:
                status = CST.ORDER_STATUSES.DONE;
                message = 'Продано';
                break;
            default:
                break;
        }

        logger.info(`getting order data ->`);
        helper.updateOrderStatus(ACTIONS[id].tableID, {
            orderID: data.orderID,
            userID: id
        }, status).then(updatedOrder => {
            logger.info(`<- got order data ${updatedOrder}`);

            logger.info(`sending order action card ${data.orderID} ->`);
            this.bot.sendMessage(id, message, replyOptions);
            logger.info(`<- sent order action card ${data.orderID}`);

            logger.info('----- <- end /callbackQuery -----');
        }).catch(error => {
            console.log(error);

            logger.log({
                level: 'error',
                message: error
            })
        });
    }

    eventAction(id, data) {
        logger.info(`sending event action card ->`);

        let message = 'Выбрать действие:';
        let buttons = _getButtons();
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

        ACTIONS[id] = {
            tableID: data.tableID
        }

        this.bot.sendMessage(id, message, replyOptions);
        logger.info('----- <- end /callbackQuery -----');
    }

    async sendNewTicketHold(data) {
        let ticketsMsg = helper.formatTicketsMsg(data.tickets);
        let guestMsg = helper.formatGuestMsg(data.guest);
        let message = ticketsMsg + '\n\n' + guestMsg;

        let replyMarkup = this.bot.inlineKeyboard([
            [
                this.bot.inlineButton('Беру в обработку', {callback: JSON.stringify({
                    action: CST.ACTIONS.UPDATE_ORDER,
                    type: CST.ACTION_TYPE.IN_PROGRESS,
                    orderID: data.orderID
                })})
            ]
        ]);

        for (let id of ID_LIST) {
            ACTIONS[id] = {
                tableID: data.tableID
            };
            this.bot.sendMessage(id, message, {replyMarkup});
        }
    }

    async _sendOrderCard (id, orderRecord) {
        logger.info(`sending order card ${orderRecord} ->`);

        let replyMarkup;
        let orderDetails = await helper.getOrderDetails(ACTIONS[id].tableID, orderRecord);
        let ticketsMsg = helper.formatTicketsMsg(orderDetails.tickets);
        let guestMsg = helper.formatGuestMsg(orderDetails.guest);
        let message = ticketsMsg + '\n\n' + guestMsg;

        switch (orderDetails.status) {
            case CST.ORDER_STATUSES.NEW:
                replyMarkup = this.bot.inlineKeyboard([
                    [
                        this.bot.inlineButton('Беру в обработку', {
                            callback: JSON.stringify({
                                action: CST.ACTIONS.UPDATE_ORDER,
                                type: CST.ACTION_TYPE.IN_PROGRESS,
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
                                action: CST.ACTIONS.UPDATE_ORDER,
                                type: CST.ACTION_TYPE.CANCEL,
                                orderID: orderRecord.getId()
                        })})
                    ], [
                        this.bot.inlineButton('Продано', {
                            callback: JSON.stringify({
                                action: CST.ACTIONS.UPDATE_ORDER,
                                type: CST.ACTION_TYPE.DONE,
                                orderID: orderRecord.getId()
                        })})
                    ]
                ]);
                break;
            default:
                break;
        }

        this.bot.sendMessage(id, message, { replyMarkup });
        logger.info(`<- sent order card ${orderRecord}`);
    }

    async _sendEventCard (id, event) {
        logger.info(`sending event card - ${event.id} ->`);
        let replyMarkup = this.bot.inlineKeyboard([
            [
                this.bot.inlineButton('Выбрать', {
                    callback: JSON.stringify({
                        action: CST.ACTIONS.SELECT_EVENT,
                        tableID: event.id
                    }
                )})
            ]
        ]);
        let message = `${event.name} - ${event.date}`;

        this.bot.sendMessage(id, message, { replyMarkup });
        logger.info(`<- sent event card - ${event.id}`);
    }
}

module.exports = new Bot();

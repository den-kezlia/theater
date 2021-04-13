let initEvents = () => {
    _initChairEvent();
    _initGoToCheckoutEvent();
    _initPlaceOrderEvent();
}

let updateTicketsStatus = () => {
    let promise = (resolve, reject) => {
        _getTickets().then(tickets => {
            tickets.forEach(ticket => {
                _updateChairStatus(ticket);
            });

            resolve();
        }).catch(error => {
            console.log(error);
            reject(error);
        })
    }

    return new Promise(promise);
}

export default {
    initEvents: initEvents,
    updateTicketsStatus: updateTicketsStatus
};

let _initChairEvent = () => {
    let chairsEl = document.getElementsByClassName('js-chair chair--free');

    if (chairsEl) {
        for (let i = 0; i < chairsEl.length; i++) {
            chairsEl[i].addEventListener('click', e => {
                e.preventDefault();
                let chairEl = e.currentTarget;

                chairEl.classList.toggle('chair--active');
                _calculateTickets();
            });
        }
    }
}

let _initGoToCheckoutEvent = () => {
    let buttonEl = document.getElementById('js-selection__btn');

    if (buttonEl) {
        buttonEl.addEventListener('click', e => {
            e.preventDefault();
            let detailsEl = document.getElementById('js-selection__details');

            detailsEl.classList.remove('selection__details--hidden');
            buttonEl.classList.add('selection__btn--hidden');
        });
    }
}

let _initPlaceOrderEvent = () => {
    let buttonEl = document.getElementById('js-checkout__submit');

    if (buttonEl) {
        buttonEl.addEventListener('click', e => {
            e.preventDefault();
            let nameEl = document.getElementById('js-checkout__name');
            let emailEl = document.getElementById('js-checkout__email');
            let phoneEl = document.getElementById('js-checkout__phone');
            let tickets = _getSelectedTickets();

            // TODO: commented while BED part in dev
            if (!nameEl.value || !emailEl.value || !phoneEl.value || tickets.length === 0) {
                return
            }

            let data = {
                id: document.getElementById('js-checkout__id').value,
                guest: {
                    name: nameEl.value,
                    email: emailEl.value,
                    phone: phoneEl.value,
                },
                tickets: tickets
            };

            // TODO: fetch tickets data
            fetch('http://localhost:1337/api/holdTickets', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                response.json().then(data => {
                    if (data.error) {

                    } else {
                        let notificationEl = document.getElementById('js-notification');
                        let notificationMessageEl = document.getElementById('js-notification__message');

                        notificationMessageEl.innerText = 'Спасибо. Мы с вами свяжемся';
                        notificationEl.classList.remove('notification--hidden');
                        console.log(data);
                    }
                });
            });
        });
    }
}

let _getTickets = () => {
    let promise = (resolve, reject) => {
        try {
            let data = {
                id: document.getElementById('js-chairs').dataset.id
            };

            fetch('http://localhost:1337/api/getTickets', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => {
                    response.json().then(data => {
                        if (data.error) {
                            // TODO: implement error notifications
                            reject({
                                error: data.message,
                                msg: 'Проблема с сервером. Свяжитесь по телефону'
                            })
                        } else {
                            resolve(data.tickets);
                        }
                    });
                });
        } catch (error) {
            reject(error)
        }
    }

    return new Promise(promise);
}

let _updateChairStatus = (ticket) => {
    let chairEl = document.querySelectorAll(`[data-position="${ticket.position.row}-${ticket.position.col}"]`)[0];

    if (chairEl) {
        chairEl.classList.add(`chair--${ticket.status}`);
        chairEl.dataset.price = ticket.price;
    }
}

let _calculateTickets = () => {
    let sum = 0;
    let tickets = _getSelectedTickets();

    for (let i = 0; i < tickets.length; i++) {
        sum += parseFloat(tickets[i].price);
    }

    _updateSelection(tickets.length, sum);
    _updateSelectedTicketsList(tickets);
}

let _getSelectedTickets = () => {
    let tickets = [];
    let ticketsEl = document.getElementsByClassName('chair--active');

    for (let i = 0; i < ticketsEl.length; i++) {
        let position = ticketsEl[i].dataset.position.split('-');

        tickets.push({
            position: {
                row: position[0],
                col: position[1]
            },
            price: ticketsEl[i].dataset.price,
        });
    }

    return tickets;
}

let _getTicketsCountText = (count) => {
    let msg = '';

    // TODO: adde tag (span/div) wrappers for messages
    switch (true) {
        case count === 1:
            msg = `${count} билет`
            break;
        case count > 1 && count < 5:
            msg = `${count} билета`
            break;
        case count >= 5:
            msg = `${count} билетов`
            break;
        default:
            break;
    }

    return msg;
}

let _updateSelection = (count, sum) => {
    let selectionEl = document.getElementById('js-selection');
    let countEl = document.getElementById('js-selection__tickets__count');
    let priceEl = document.getElementById('js-selection__tickets__price');

    if (sum > 0) {
        selectionEl.classList.remove('selection--hidden');
        countEl.innerText = _getTicketsCountText(count);
        // TODO: add util function
        priceEl.innerText = `${sum} грн`;
    } else {
        selectionEl.classList.add('selection--hidden');
    }
}

let _updateSelectedTicketsList = (tickets) => {
    let ticketsListEl = document.getElementById('js-selection__tickets__list');
    let html = '';

    tickets.forEach(ticket => {
        // TODO: add and use util functions for text
        html += `
            <li class="selection__tickets__item">
                <div class="selection__tickets__item__position">${ticket.position.row} ряд, ${ticket.position.col} место</div>
                <div class="selection__tickets__item__price">${ticket.price} грн</div>
            </li>
        `;
    });

    ticketsListEl.innerHTML = html;
}

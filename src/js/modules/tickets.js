let tickets = () => {
    let ticketsEl = document.getElementsByClassName('js-chair');
    let nextEl = document.getElementById('js-selection__btn');
    let checkoutEl = document.getElementById('js-checkout__submit');

    if (!nextEl) {
        return
    }

    for (let i = 0; i < ticketsEl.length; i++) {
        ticketsEl[i].addEventListener('click', e => {
            e.preventDefault();
            let ticketEl = e.currentTarget;

            ticketEl.classList.toggle('chair--active');
            _calculateTickets();
        });
    }

    nextEl.addEventListener('click', e => {
        e.preventDefault();
        let detailsEl = document.getElementById('js-selection__details');

        detailsEl.classList.remove('selection__details--hidden');
        nextEl.classList.add('selection__btn--hidden');
    });

    checkoutEl.addEventListener('click', e => {
        e.preventDefault();
        let notificationEl = document.getElementById('js-notification');
        let notificationMessageEl = document.getElementById('js-notification__message');
        let nameEl = document.getElementById('js-checkout__name');
        let emailEl = document.getElementById('js-checkout__email');
        let phoneEl = document.getElementById('js-checkout__phone');
        let tickets = _getSelectedTickets();

        // TODO: commented while BED part in dev
        // if (!nameEl.value || !emailEl.value || !phoneEl.value || tickets.length === 0) {
        //     return
        // }

        let formData = {
            name: nameEl.value,
            email: emailEl.value,
            phone: phoneEl.value,
            tickets: tickets
        };

        // TODO: fetch tickets data
        fetch('http://localhost:1337/api/getTickets')
            .then(response => {
                response.json().then(data => {
                    if (data.error) {

                    } else {
                        notificationMessageEl.innerText = 'Спасибо. Мы с вами свяжемся';
                        notificationEl.classList.remove('notification--hidden');

                        console.log(data);
                    }
                });
            });
    });
}

module.exports = tickets;

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
        tickets.push({
            position: ticketsEl[i].dataset.position,
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
        let position = ticket.position.split('-');
        // TODO: add and use util functions for text
        html += `
            <li class="selection__tickets__item">
                <div class="selection__tickets__item__position">${position[0]} ряд, ${position[1]} место</div>
                <div class="selection__tickets__item__price">${ticket.price} грн</div>
            </li>
        `;
    });

    ticketsListEl.innerHTML = html;
}
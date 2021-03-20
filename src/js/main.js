let performanceToggle = () => {
    let performancesToggle = document.getElementById('js-performances__toggle');

    if (performancesToggle) {
        performancesToggle.addEventListener('click', function() {
            let block = document.getElementById('js-performances');
            block.classList.toggle('performances--collapsed');
        });
    }
}

let _getChairSpace = () => {
    let windowSize = document.getElementById('js-chairs').offsetWidth;
    let chairSpace;

    switch (true) {
        case windowSize < 700:
            chairSpace = 5;
            break;
        case windowSize >= 700 && windowSize < 1024:
            chairSpace = 15;
            break;
        default:
            chairSpace = 20;
            break;
    }

    return chairSpace;
}

let sceneSize = () => {
    let calculateSceneSize = () => {
        let windowSize = document.getElementById('js-chairs').offsetWidth;
        let ellipseSize = (windowSize / 2) + 'px';
        let chairSize = ((windowSize / 18) - _getChairSpace()) + 'px';

        document.documentElement.style.setProperty('--scene-size', ellipseSize);
        document.documentElement.style.setProperty('--chair-size', chairSize);
    };

    calculateSceneSize();
    window.addEventListener('resize', calculateSceneSize);
}

let _calculateTickets = () => {
    let sum = 0;
    let tickets = [];
    let ticketsEl = document.getElementsByClassName('chair--active');

    for (let i = 0; i < ticketsEl.length; i++) {
        sum += parseFloat(ticketsEl[i].dataset.price);
        tickets.push({
            position: ticketsEl[i].dataset.position,
            price: ticketsEl[i].dataset.price,
        });
    }

    _updateSelection(tickets.length, sum);
    _updateSelectedTicketsList(tickets);
}

let _getTicketsCountText = (count) => {
    let msg = '';

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
        priceEl.innerText = `${sum} грн`;
    } else {
        selectionEl.classList.add('selection--hidden');
    }
}

let _updateSelectedTicketsList = (tickets) => {
    let ticketsListEl = document.getElementById('js-selection__tickets');
    let html = '';

    tickets.forEach(ticket => {
        let position = ticket.position.split('-');
        html += `<li><div>${position[0]} ряд, ${position[1]} место</div><div>${ticket.price} грн</div></li>`;
    });

    ticketsListEl.innerHTML = html;
}

let tickets = () => {
    let ticketsEl = document.getElementsByClassName('js-chair');
    let nextEl = document.getElementById('js-selection__btn');

    for (let i = 0; i < ticketsEl.length; i++) {
        ticketsEl[i].addEventListener('click', e => {
            let ticketEl = e.currentTarget;

            e.preventDefault();
            ticketEl.classList.toggle('chair--active');
            _calculateTickets();
        });
    }

    nextEl.addEventListener('click', e => {
        e.preventDefault();

        let detailsEl = document.getElementById('js-selection__details');
        detailsEl.classList.toggle('selection__details--hidden');
    });
}

let App = {
    init: () => {
        performanceToggle();
        sceneSize();
        tickets();
    }
};

App.init();
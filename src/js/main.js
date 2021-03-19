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
            chairSpace = 7;
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

let tickets = () => {
    let tickets = document.getElementsByClassName('js-chair');

    for (let i = 0; i < tickets.length; i++) {
        tickets[i].addEventListener('click', (e) => {
            let ticket = e.currentTarget;

            e.preventDefault();
            ticket.classList.toggle('chair--active');
        });
    }

}

let App = {
    init: () => {
        performanceToggle();
        sceneSize();
        tickets();
    }
};

App.init();
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
            chairSpace = 10;
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

        document.documentElement.style.setProperty('--ellipse-size', ellipseSize);
        document.documentElement.style.setProperty('--chair-size', chairSize);
    };

    calculateSceneSize();
    window.addEventListener('resize', calculateSceneSize);
}

let App = {
    init: () => {
        performanceToggle();
        sceneSize();
    }
};

App.init();
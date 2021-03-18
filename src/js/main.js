let performanceToggle = () => {
    let performancesToggle = document.getElementById('js-performances__toggle');

    performancesToggle.addEventListener('click', function() {
        let block = document.getElementById('js-performances');
        block.classList.toggle('performances--collapsed');
    });
}

let sceneSize = () => {
    let calculateSceneSize = () => {
        let windowSize = window.window.innerWidth;
        let ellipseSize = windowSize / 2;
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
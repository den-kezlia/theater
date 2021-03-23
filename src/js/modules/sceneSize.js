let sceneSize = () => {
    let chairsEl = document.getElementById('js-chairs');

    if (!chairsEl) {
        return;
    }

    // TODO: use different functions depends on scene type
    let calculateSceneSize = () => {
        let chairsSize = chairsEl.offsetWidth;
        let ellipseSize = (chairsSize / 2) + 'px';
        let oneChairSize = ((chairsSize / 18) - _getChairSpace()) + 'px';

        document.documentElement.style.setProperty('--scene-size', ellipseSize);
        document.documentElement.style.setProperty('--chair-size', oneChairSize);
    };

    calculateSceneSize();
    window.addEventListener('resize', calculateSceneSize);
}

module.exports = sceneSize;

let _getChairSpace = () => {
    let chairsSize = document.getElementById('js-chairs').offsetWidth;
    let chairSpace = 0;

    // TODO: Update viewports
    switch (true) {
        case chairsSize < 700:
            chairSpace = 5;
            break;
        case chairsSize >= 700 && chairsSize < 1024:
            chairSpace = 15;
            break;
        default:
            chairSpace = 20;
            break;
    }

    return chairSpace;
}

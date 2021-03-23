import performanceToggle from './modules/performanceToggle';
import sceneSize from './modules/sceneSize';
import tickets from './modules/tickets';
import notification from './modules/notification';

let App = {
    init: () => {
        performanceToggle();
        sceneSize();
        tickets();
        notification();
    }
};

App.init();
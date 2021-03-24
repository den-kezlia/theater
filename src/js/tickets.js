import tickets from './modules/tickets';
import sceneSize from './modules/sceneSize';

sceneSize();

tickets.updateTicketsStatus().then(e => {
    tickets.initEvents();
}
).catch(error => {
    console.log(error);
})

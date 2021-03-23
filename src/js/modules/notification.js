let notification = () => {
    // TODO: Add function to close on Esc key or background click
    let closeEl = document.getElementById('js_notification__close');

    if (!closeEl) {
        return
    }

    closeEl.addEventListener('click', e => {
        e.preventDefault();
        //document.location = '/';
    });
}

export default notification;

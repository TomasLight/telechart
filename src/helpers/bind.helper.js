function BindGlobalEvent(eventName, callback) {
    const attachToEvent = (targetEvent) => {
        if (window.attachEvent) {
            window.attachEvent(`on${targetEvent}`, function (ev) {
                callback(ev);
            });
        }
        else if (window.addEventListener) {
            window.addEventListener(targetEvent, function (ev) {
                callback(ev);
            }, false);
        }
    }

    if (Array.isArray(eventName)) {
        eventName.forEach(event => attachToEvent(event));
    } else {
        attachToEvent(eventName);
    }
}

module.exports = { BindGlobalEvent };
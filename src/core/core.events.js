/**
 * Enum for default side-events
 * @enum {Symbol}
 */
const SupportedEvents = Object.freeze({
    MouseMove: Symbol('mouseMove'),
    MousePress: Symbol('mousePress'),
    MouseUp: Symbol('mouseUp')
});

const eventsFactory = function () {
    const eventAggregator = {
        _events: []
    };

    eventAggregator.on = function (eventName, callback) {
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }

        this._events[eventName].push(callback);

        return this._events[eventName].filter(f => f != callback);
    };

    eventAggregator.fire = function (eventName, args) {
        if (this._events[eventName]) {
            this._events[eventName].forEach(listner => listner(args))
        }
    }

    return eventAggregator;
}

module.exports = { eventsFactory, SupportedEvents };
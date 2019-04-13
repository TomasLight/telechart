/**
 * Enum for supported cursors types
 * @enum {Symbol}
 */
const Cursors = Object.freeze({
    Default: Symbol('default'),
    WResize: Symbol('w-resize'),
    HResize: Symbol('n-resize'),
    Pointer: Symbol('pointer')
});

function getValue(symbol) {
    switch (symbol) {
        case Cursors.Default:
            return 'default';
        case Cursors.HResize:
            return 'n-resize';
        case Cursors.WResize:
            return 'w-resize';
        case Cursors.Pointer:
            return 'pointer';
        default:
            throw new Error(`not implemented type ${symbol}`);
    }
}

function setCursor(element, cursorType) {
    const newCursorState = getValue(cursorType);
    if (newCursorState != element.style.cursor) {
        element.style.cursor = newCursorState;
    }
}

module.exports = { Cursors, setCursor };
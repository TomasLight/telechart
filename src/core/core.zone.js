
/**
 * Enum for zone position on canvas
 * @enum {Symbol}
 */
const ZonesPosition = Object.freeze({
    TOP: Symbol('top'),
    MIDDLE: Symbol('middle'),
    BOTTOM: Symbol('bottom')
});

const chartZone = function (zoneName = 'unkn', render, params) {
    if (!render)
        throw new Error(`Zone ${zoneName} without render method!`);

    const self = this;
    this.name = zoneName;
    this.isDirty = true;
    this._render = render;
    this.width = 0;
    this.canChangeWidth = true;
    this.height = 0;
    this.canChangeHeight = true;

    this.draw = () => this._render.call(self);

    this.setSize = (newSize) => {
        if (this.canChangeWidth)
            this.width = newSize.width;
        if (this.canChangeHeight)
            this.height = newSize.height;

        if (this._lastSize == null ||
            (this._lastSize.w != this.width || this._lastSize.h != this.height)) {
            this._lastSize = { w: this.width, h: this.height };
            if (this._prepare) {
                this._prepare();
            }
        }
    }

    this.merge = (params) => {
        const keys = Object.keys(params);
        for (var i = 0; i < keys.length; i++) {
            self[keys[i]] = params[keys[i]];
        }
    };

    this.setGlobalZonePos = (zoneSize) => {
        this.rectZone = zoneSize;
    };

    if (params) {
        this.merge(params);
    }
}

module.exports = { ZonesPosition, chartZone };
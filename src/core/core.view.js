const allowedKeys = ['x', 'minX', 'maxX', 'minY', 'maxY', 'ranges', 'viewPointWidth', 'viewPointHeight', 'maxWidth', 'maxHeight', 'pointsCount'];

const minViewportWidth = 50;

const createView = (initialProps) => {
    const view = {
        x: 0,                   //offset in pixels
        minX: 0,                //x data values
        maxX: 0,
        minY: 0,                //y data values
        maxY: 0,
        viewPointWidth: 270,    //minimap width
        viewPointHeight: 270,   //chart height
        pixelForXtick: 0,
        pixelForYtick: 0,

        startAtX: 0,            //start from x data value
        endAtX: 0,              //end at x data value
        maxWidth: 0,            //canvas width
        maxHeight: 0,           //canvas height

        pointsCount: 0,         //total x/y poits count
        scale: 0                //scale factor
    };

    view.set = function (props) {
        let propsKeys = Object.keys(props);

        const invalidParams = propsKeys.filter((obj) => allowedKeys.indexOf(obj) == -1);
        if (invalidParams.length > 0)
            throw new Error(`View props has invalide parameters: ${invalidParams.join(', ')}`);

        propsKeys.forEach(key => this[key] = props[key]);

        this.recalc();
    }

    view.recalc = function () {
        const aspectRation = this.viewPointWidth / this.maxWidth;
        const totalWorkValues = this.maxX - this.minX;

        if (!Number.isNaN(aspectRation) && Number.isFinite(aspectRation)) {
            this.viewPointWidth = Math.max(minViewportWidth, this.viewPointWidth);

            this.x = Math.max(this.x, this.x - this.viewPointWidth);

            if (this.maxWidth < this.x + this.viewPointWidth) {
                this.x = this.maxWidth - this.viewPointWidth;
            }

            this.x = Math.max(0, this.x);

            if (this.maxWidth < this.x + this.viewPointWidth) {
                this.viewPointWidth = this.maxWidth;
            }

            const getValueByPixelX = (x) => {
                const xPart = x / this.maxWidth;
                return this.minX + (xPart * totalWorkValues);
            };

            this.startAtX = getValueByPixelX(this.x);
            this.endAtX = getValueByPixelX(this.x + this.viewPointWidth);
            const actualWorkValues = this.endAtX - this.startAtX;

            this.pixelForXtick = actualWorkValues / this.maxWidth;
            this.pixelForYtick = this.maxY / this.viewPointHeight;
            this.scale = (this.maxX - this.minX) / actualWorkValues;
        }
    }

    if (initialProps) {
        view.set(initialProps);
    }

    return view;
}

module.exports = { createView, minViewportWidth };
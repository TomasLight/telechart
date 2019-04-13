const canvasHelper = require('../helpers/canvas.helper');

const factory = (core) => {
    const tooltipContainer = {
        ctx: core.Context2D
    };

    tooltipContainer.draw = function (opt) {
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = core.chartSettings.styles.tooltipBackgroundColor;
        this.ctx.strokeStyle = core.chartSettings.styles.chartLineColor;

        this.ctx.shadowColor = core.chartSettings.styles.shadowColor;
        this.ctx.shadowBlur = 15;

        canvasHelper.roundRect(this.ctx, opt.pos.x, opt.pos.y, opt.size.width, opt.size.height, 15, true);

        canvasHelper.disableShadow(this.ctx);
    };

    return tooltipContainer;
};

module.exports = factory;
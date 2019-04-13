const ZoneImport = require('../core/core.zone');
const { textMetrics, fillFullArea } = require('../helpers/canvas.helper');

const legendZoneFactory = (core, params) => {
    const legendZone = new ZoneImport.chartZone('legend', render, params);

    function render() {

        fillFullArea(this.ctx, core.chartSettings.styles.backgroundColor, this.width, this.height);

        this.ctx.fillStyle = core.chartSettings.styles.legendColor;
        this.ctx.fillText(this.text, core.chartSettings.layout.sidePadding + 10, core.chartSettings.layout.contentPadding * 2);

        this.isDirty = false;
    };

    legendZone._prepare = function () {
        if (!this.ctx) this.ctx = core.Context2D;
        if (core.chartSettings.legend) {
            this.text = core.chartSettings.legend;
        }

        this.fontSize = core.chartSettings.fonts.legendFontSize;

        this.ctx.font = `${core.chartSettings.fonts.legendFontAddon} ${this.fontSize}px ${core.chartSettings.fonts.legendFont}`;

        const fontSize = textMetrics(this.ctx, this.text);
        this.height = core.chartSettings.layout.contentPadding * 2 + fontSize.height;
    };

    legendZone.canChangeHeight = false;
    legendZone._prepare();

    return legendZone;
};

module.exports = legendZoneFactory;
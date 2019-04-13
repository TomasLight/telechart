const ZoneImport = require('../core/core.zone');
const lineDataService = require('../render/chart.line');

const { SupportedEvents } = require('../core/core.events');
const { drawTooltipForLineChart } = require('../helpers/tooltip.helper');
const { monthNames, daysNames } = require('../helpers/date.helper');
const { textMetrics, fillFullArea, getMousePos, hoverPoint } = require('../helpers/canvas.helper');

const ChartZoneFactory = (core, params) => {
    const chartZone = new ZoneImport.chartZone('chart', render, params);

    function render() {
        if (this._cache.chartImageData && this.cursorInZone && this.cursorWasRendered) {
            this.ctx.putImageData(this._cache.chartImageData, 0, this.rectZone.top);
        }
        else {
            this.ctx.font = `${core.chartSettings.fonts.xLineFontSize}px ${core.chartSettings.fonts.xLineFont}`;

            fillFullArea(this.ctx, core.chartSettings.styles.backgroundColor, this.width, this.height);

            this.ctx.fillStyle = core.chartSettings.styles.chartFontColor;
            this.ctx.strokeStyle = core.chartSettings.styles.chartLineColor;

            this._prepareContent();
            this._drawBottomLegend();
            this._drawGrid();
            this._drawContentData();
            this._drawGridValues();

            this._cache.chartImageData = this.ctx.getImageData(0, this.rectZone.top, this.width, this.height);
        }

        this.cursorWasRendered = false;
        if (this.cursorInZone) {
            this._drawTooltip();
        }
    }

    chartZone._prepareContent = function () {
        const { charts } = core.Dataset;

        const ranges = { pointsCount: 0, minX: Number.MAX_SAFE_INTEGER, maxX: 0, maxY: 0 };

        charts.forEach(targetChart => {
            if (!targetChart.isReady) {
                lineDataService.prepare(targetChart);
            }
            ranges.pointsCount = targetChart.x.points.length;
            ranges.minX = Math.min(ranges.minX, targetChart.minX);
            ranges.maxX = Math.max(ranges.maxX, targetChart.maxX);
            ranges.maxY = Math.max(ranges.maxY, targetChart.maxY);
        });

        core.View.set(ranges);
        this._cache.grid.yNames = lineDataService.getYValues(core.View, this._cache.grid.allowedYLinesElements);

        //bottom values
        const minPerBottomElementWidth = 168;
        const rawAllowedElements = (this.width - (core.chartSettings.layout.sidePadding * 2)) / minPerBottomElementWidth;
        const allowedElements = Math.floor((this.width - (core.chartSettings.layout.sidePadding * 2)) / minPerBottomElementWidth);
        const calcedPerBottomElementWidth = (this.width - (core.chartSettings.layout.sidePadding * 2)) / allowedElements;

        core.View.set({
            maxWidth: this.width,
            maxHeight: this.height,
            viewPointHeight: this._cache.chart.height
        });

        const xNames = lineDataService.getXDateNames(core.View, allowedElements);
        this._cache.bottomValues = {
            minPerBottomElementWidth,
            allowedElements,
            calcedPerBottomElementWidth,
            xNames,
            allowElementOffset: Math.abs(allowedElements - rawAllowedElements)
        };
    };

    chartZone._drawBottomLegend = function () {
        //bottom line
        this.ctx.lineWidth = core.chartSettings.layout.chart.lineWidth;

        this.ctx.beginPath();
        this.ctx.moveTo(this._cache.bottomLine.startBottomLineFromX, this._cache.bottomLine.bottomLineY);
        this.ctx.lineTo(this._cache.bottomLine.endBottomLineToX, this._cache.bottomLine.bottomLineY);
        this.ctx.stroke();
        this.ctx.moveTo(0, 0);

        //bottom values
        const startFromY = this.height - core.chartSettings.layout.chart.bottomContentVerticalPadding * 2;

        for (var xNameIndex = 0; xNameIndex < this._cache.bottomValues.allowedElements; xNameIndex++) {
            const startFromX =
                core.chartSettings.layout.chart.bottomContentPadding +
                (this._cache.bottomValues.calcedPerBottomElementWidth * xNameIndex);

            this.ctx.fillText(this._cache.bottomValues.xNames[xNameIndex], startFromX, startFromY, this._cache.bottomValues.calcedPerBottomElementWidth);
        }
    };

    chartZone._drawGrid = function () {
        //chart lines
        this.ctx.lineWidth = core.chartSettings.layout.chart.lineWidth;
        for (var yInd = 0; yInd <= this._cache.grid.allowedYLinesElements; yInd++) {
            const yLineXFrom = core.chartSettings.layout.sidePadding;
            const yLineXTo = this.width - core.chartSettings.layout.sidePadding;
            const yLineYPos = this.height - this._bottomLegendHeight - (this._cache.grid.yLinesDistance * yInd);

            this.ctx.beginPath();
            this.ctx.moveTo(yLineXFrom, yLineYPos);
            this.ctx.lineTo(yLineXTo, yLineYPos);
            this.ctx.stroke();
            this.ctx.moveTo(0, 0);
        }
    };

    chartZone._drawGridValues = function () {
        for (var yInd = 0; yInd <= this._cache.grid.allowedYLinesElements; yInd++) {
            const yLineXFrom = core.chartSettings.layout.sidePadding;
            const yLineYPos = this.height - this._bottomLegendHeight - (this._cache.grid.yLinesDistance * yInd);

            this.ctx.fillText(this._cache.grid.yNames[yInd], yLineXFrom, yLineYPos - core.chartSettings.layout.chart.leftLegendVerticalPadding);
        }
    };

    chartZone._drawContentData = function () {
        if (lineDataService.drawToView(core, core.View)) {
            this.isDirty = false;
        }
    };

    chartZone._drawTooltip = function () {
        if (core.mousemove) {
            this.ctx.globalAlpha = 1;

            const mousePos = getMousePos(this.ctx.canvas, core.mousemove, this.rectZone);

            const nearesPoints = lineDataService.getNearestPoints(core, mousePos);
            if (nearesPoints && nearesPoints.length > 0) {
                this.cursorWasRendered = true;

                const yLineStartYPos = this.height - this._bottomLegendHeight;
                const yLineEndYPos = 0;

                let lineWasDrawn = false;
                const drawLine = (point) => {
                    this.ctx.strokeStyle = core.chartSettings.styles.chartLineColor;
                    this.ctx.beginPath();
                    this.ctx.moveTo(point.x, yLineStartYPos);
                    this.ctx.lineTo(point.x, yLineEndYPos);
                    this.ctx.stroke();
                }

                this.ctx.fillStyle = core.chartSettings.styles.backgroundColor;

                let tooltipData = [];
                let xValue = null;

                nearesPoints.forEach(nearPoint => {
                    nearPoint.chart.y.forEach(yChartLine => {
                        const xIndex = nearPoint.index + yChartLine.fromIndex;
                        if (!xValue) {
                            xValue = nearPoint.chart.x.points[xIndex]
                        }
                        let yValue = yChartLine.points[xIndex];
                        let pointPos = yChartLine.calcedPoints[nearPoint.index];

                        tooltipData.push({
                            yLine: yChartLine,
                            value: yValue
                        });

                        if (!lineWasDrawn) {
                            lineWasDrawn = true;
                            drawLine(pointPos);
                        }

                        if (this.ctx.strokeStyle != yChartLine.color)
                            this.ctx.strokeStyle = yChartLine.color;

                        hoverPoint(
                            this.ctx,
                            pointPos.x,
                            pointPos.y,
                            core.chartSettings.layout.chart.pointRadius,
                            core.chartSettings.layout.chart.lineWidth);
                    });
                });

                if (tooltipData.length > 0) {
                    const xDate = new Date(xValue);
                    const yColl = [];
                    tooltipData.map(dt =>
                        yColl.push({
                            val: dt.value,
                            name: dt.yLine.name,
                            color: dt.yLine.color
                        })
                    );
                    drawTooltipForLineChart(this.ctx, core, mousePos, {
                        title: `${daysNames[xDate.getDay()]}, ${monthNames[xDate.getMonth()]} ${xDate.getDate()}`,
                        yVals: tooltipData
                    });
                }
            };
        }
    };

    chartZone._prepare = function () {
        if (!this.ctx)
            this.ctx = core.Context2D;

        this.ctx.font = `${core.chartSettings.fonts.xLineFontSize}px ${core.chartSettings.fonts.xLineFont}`;
        this._bottomLegendTextSize = textMetrics(this.ctx, 'Jan 22');
        this._bottomLegendHeight = this._bottomLegendTextSize.height
            + (core.chartSettings.layout.chart.bottomContentVerticalPadding * 3);

        this._contentHeight = this.height - this._bottomLegendHeight;

        this._cache = {
            chartImageData: void 0,
            bottomImageData: void 0
        };

        //bottom line
        this._cache.bottomLine = {
            startBottomLineFromX: core.chartSettings.layout.sidePadding,
            endBottomLineToX: this.width - core.chartSettings.layout.sidePadding,
            bottomLineY: this.height - this._bottomLegendHeight
        };

        //grid
        const yLinesDistance = 150 + core.chartSettings.layout.chart.lineWidth;
        const allowedYLinesElements = Math.floor((this.height - this._bottomLegendHeight) / yLinesDistance);
        this._cache.grid = {
            yLinesDistance,
            allowedYLinesElements,
            yNames: lineDataService.getYValues(core.View, allowedYLinesElements)
        };

        //points data
        this._cache.chart = {
            height: this.height - this._bottomLegendHeight
        };

        if (!this._cache.subscribedOnEvents) {
            this._cache.subscribedOnEvents = true;
            core.Events.on(SupportedEvents.MouseMove, (ev) => {
                if (!this.rectZone)
                    return;

                const mousePos = getMousePos(core.Context2D.canvas, ev, this.rectZone);
                if (mousePos.x > this.rectZone.left
                    && mousePos.y > this.rectZone.top
                    && mousePos.x < this.rectZone.right
                    && mousePos.y < this.rectZone.bottom) {
                    this.isDirty = true;
                    this.cursorInZone = true;
                } else {
                    if (this.cursorWasRendered) {
                        this.isDirty = true;
                    }
                    this.cursorInZone = false;
                }
                if (this.isDirty) {
                    core.invalidateLifeCycle();
                }
            });
        }
    };

    chartZone._prepare();

    return chartZone;
};

module.exports = ChartZoneFactory;
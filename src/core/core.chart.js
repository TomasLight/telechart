//core
const animationsModule = require('./core.animations');
const datasetsModule = require('./core.dataset');
const tooltipFactory = require('./core.tooltip');
const { ZonesPosition } = require('./core.zone');
const { createView } = require('../core/core.view');

//zones
const legendZoneFactory = require('../zones/legend.zone');
const minimapZoneFactory = require('../zones/minimap.zone');
const chartZoneFactory = require('../zones/chart.zone');

//ect
const { clipArea, fillFullArea } = require('../helpers/canvas.helper');
const { BindGlobalEvent } = require('../helpers/bind.helper');
const { eventsFactory: eventsAggregatorFactory, SupportedEvents } = require('./core.events');

export default class Chart {
    //_canvas
    //_2dContext
    //_canvasSize {width, height}
    //chartSettings {layout, styles, fonts}
    //_charts - chart data = {lines + x}
    //_data - every lines
    //_chartZone - main chart zone
    //_zones - all drawable zones

    //Dataset   - global data access
    //Context2D - context accessor
    //View      - view accessor
    //Tooltip   - tooltip accessor
    //Events    - events accessor

    /**
     * A Chart class
     * @constructor
     * @param {HTMLCanvasElement} canvasElement canvas element wich will be our chart
     * @param {config} config styles configuration, custom themes, ect
     */
    constructor(canvasElement, config) {
        if (!canvasElement)
            throw new Error('Chart must be created with canvas element!');

        this._resetData();
        this._inDigest = false;
        this._canvas = canvasElement;
        this._2dContext = canvasElement.getContext('2d', { alpha: false });
        this._events = eventsAggregatorFactory();

        this._updateSizes();
        this._lastCanvasSize = Object.assign(this._canvasSize, {});

        this.chartSettings = require('./core.settings').settings();
        if (config) {
            this.chartSettings = Object.assign(this.chartSettings, config);
            if (config.theme) {
                this.setTheme(config.theme, true);
            }
        }

        Object.defineProperty(this, 'Dataset', { get: () => this._dataset });
        Object.defineProperty(this, 'Context2D', { get: () => this._2dContext });
        Object.defineProperty(this, 'View', { get: () => this._view });
        Object.defineProperty(this, 'Tooltip', { get: () => this._tooltip });
        Object.defineProperty(this, 'Events', { get: () => this._events });

        this._tooltip = tooltipFactory(this);

        this._chartZone = chartZoneFactory(this, {
            position: ZonesPosition.MIDDLE
        });

        this._zones = [
            legendZoneFactory(this, {
                position: ZonesPosition.TOP,
                text: 'Followers'
            }),
            this._chartZone,
            minimapZoneFactory(this, {
                position: ZonesPosition.BOTTOM,
                mapHeight: 115,
                padding: this.chartSettings.layout.contentPadding,
            })
        ];

        this._setupStandartEvents();

        this.invalidateLifeCycle();
    }


    load(rawData) {
        const data = Array.isArray(rawData)
            ? rawData.slice(0) :
            Object.assign({}, rawData);

        //reset
        this._resetData();

        //load data
        const loadDataLogic = (newChart) => {
            const newChartData = {
                charts: []
            };

            newChart.columns.forEach(columnOfChart => {
                const dataName = columnOfChart[0];
                const newCharLine = {
                    key: dataName,
                    name: newChart.names[dataName] || null,
                    color: newChart.colors[dataName],
                    points: columnOfChart.slice(1),
                    drawType: newChart.types[dataName]
                };

                this._dataset.data.push(newCharLine);
                newChartData.charts.push(newCharLine);
            });
            this._dataset.charts.push(newChartData);
        }

        if (Array.isArray(data)) {
            data.forEach((newChart) => loadDataLogic(newChart));
        } else {
            loadDataLogic(data);
        }

        fillFullArea(this._2dContext, this.chartSettings.styles.backgroundColor, this._canvasSize.width, this._canvasSize.height);

        this._redrawAll();
    }

    invalidateLifeCycle() {
        if (!this._inDigest) {
            const hasAnimations = this._animations.length > 0;
            const hasDirtyZones = this._zones.findIndex(f => f.isDirty) !== -1;
            if (hasAnimations || hasDirtyZones) {
                this._inDigest = true;
                requestAnimationFrame(this._drawZones.bind(this), 1000 / 60);
            } else {
                this._inDigest = false;
            }
        }
    }

    setTheme(newTheme, skipRedraw) {
        this.chartSettings.styles = newTheme;
        if (!skipRedraw) {
            this._redrawAll();
        }
    }

    _setupStandartEvents() {
        BindGlobalEvent('resize', () => {
            this._updateSizes();

            if (this._lastCanvasSize) {
                if (this._lastCanvasSize.width != this._canvasSize.width ||
                    this._lastCanvasSize.height != this._canvasSize.height) {
                    this._lastCanvasSize = Object.assign(this._canvasSize, {});
                    this._chartZone.isReady = false;
                    this._redrawAll();
                }
            }
        });

        this.mousePressed = false;
        BindGlobalEvent(['mousemove', 'touchmove'], (ev) => {
            this.mousemove = ev;
            this._events.fire(SupportedEvents.MouseMove, ev);
        });
        BindGlobalEvent(['mousedown', 'touchstart'], (ev) => {
            this.mousePressed = true;
            this._events.fire(SupportedEvents.MousePress, ev);
        });
        BindGlobalEvent(['mouseup', 'touchend'], (ev) => {
            this.mousePressed = false;
            this._events.fire(SupportedEvents.MouseUp, ev);
        });
    }

    _updateSizes() {
        this._canvasSize = {
            width: this._canvas.clientWidth,
            height: this._canvas.clientHeight
        };
        if (!this._lastCanvasSize ||
            (
                this._lastCanvasSize && (
                    this._lastCanvasSize.width != this._canvasSize.width ||
                    this._lastCanvasSize.height != this._canvasSize.height))) {
            this._canvas.width = this._canvasSize.width;
            this._canvas.height = this._canvasSize.height;
        }
    }

    _resetData() {
        this._animations = animationsModule();
        this._dataset = datasetsModule();
        this._view = createView();
    }

    _drawZones() {
        const usedZoneSizes = { top: 0, bottom: 0 };

        const drawZone = (position) => {
            const targetZones = this._zones.filter(f => f.position == position);
            if (position == ZonesPosition.MIDDLE && targetZones.length > 1)
                throw new Error(`Can't have multiple middle zones!`);

            targetZones.forEach(zone => {
                const zoneRect = {
                    left: 0,
                    top: 0,
                    right: this._canvasSize.width,
                    bottom: zone.height
                };
                switch (position) {
                    case ZonesPosition.TOP:
                        zoneRect.top = usedZoneSizes.top;
                        break;
                    case ZonesPosition.MIDDLE:
                        zoneRect.top = usedZoneSizes.top;
                        zoneRect.bottom = zone.height;
                        break;
                    case ZonesPosition.BOTTOM:
                        zoneRect.top = this._canvasSize.height - zone.height - usedZoneSizes.bottom;
                        break;
                }

                if (zone.isDirty) {
                    zone.setGlobalZonePos(zoneRect);
                    clipArea(this._2dContext, zoneRect);

                    if (position != ZonesPosition.MIDDLE) {
                        let zoneHeight = Math.max(0, zoneRect.bottom - zoneRect.top);
                        zone.setSize({ width: this._canvasSize.width, height: zoneHeight });
                    }

                    zone.draw();
                }
                this._2dContext.restore();
                switch (position) {
                    case ZonesPosition.TOP:
                        usedZoneSizes.top += zone.height;
                        break;
                    case ZonesPosition.BOTTOM:
                        usedZoneSizes.bottom += zone.height;
                        break;
                }
            });
        };

        drawZone(ZonesPosition.TOP);
        drawZone(ZonesPosition.BOTTOM);
        this._chartZone.setSize({
            width: this._canvasSize.width,
            height: this._canvasSize.height - usedZoneSizes.bottom - usedZoneSizes.top
        });
        drawZone(ZonesPosition.MIDDLE);

        this._inDigest = false;
        this.invalidateLifeCycle();
    }

    _redrawAll() {
        if (this._zones) {
            this._zones.forEach(zone => zone.isDirty = true);
            this.invalidateLifeCycle();
        }
    }
}
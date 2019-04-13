const ZoneImport = require('../core/core.zone');
const lineDataService = require('../render/chart.line');
const { createView, minViewportWidth } = require('../core/core.view');

const { SupportedEvents } = require('../core/core.events');
const { fillFullArea, clipArea, resetClip, getMousePos } = require('../helpers/canvas.helper');
const { Cursors, setCursor } = require('../helpers/cursor.helper');

/**
 * Enum for control frame side.
 * @enum {Symbol}
 */
const ViewSides = Object.freeze({
    None: Symbol('none'),
    Left: Symbol('left'),
    Right: Symbol('right'),
    Center: Symbol('center')
});

const minimapZoneFactory = (core, params) => {
    const minimapZone = new ZoneImport.chartZone('minimap', render, params);

    /**
     * @return {void} render method
     *     core.zone
     * @override
     */
    function render() {
        fillFullArea(this.ctx, core.chartSettings.styles.backgroundColor, this.width, this.height);

        this.ctx.fillStyle = core.chartSettings.styles.minimapFocusAreaColor;

        this._cache.contentRect = {
            left: this.padding,
            top: this.padding,
            right: core._canvasSize.width - this.padding,
            bottom: this.mapHeight
        };
        clipArea(this.ctx, this._cache.contentRect);
        this.ctx.fillRect(0, 0, this.width, this.height);
        resetClip(this.ctx);

        this._cache.minimapChartWidth = this.width - this.padding;
        this._cache.minimapChartHeight = this._cache.contentRect.bottom - core.chartSettings.layout.minimap.verticalContentPadding;
        clipArea(this.ctx, {
            left: this._cache.contentRect.left,
            top: this._cache.contentRect.top + core.chartSettings.layout.minimap.verticalContentPadding,
            right: this._cache.contentRect.right,
            bottom: this._cache.minimapChartHeight
        });

        this._cache.pixelToMinimapPixel = this._cache.minimapChartWidth / this.width;
        this._drawChart();
        this._makeInvisibleContentDarker();
        this._drawViewControl();
        this._updateViewInput();
    }

    minimapZone._idle = function () {
        this._updateViewInput();
    }

    minimapZone._mergeView = function (sizes) {
        this.view.set({
            minX: core.View.minX,
            maxX: core.View.maxX,
            maxY: core.View.maxY,
            maxWidth: sizes.width,
            viewPointWidth: this.view.maxWidth,
            viewPointHeight: sizes.height
        });
    };

    minimapZone._drawChart = function () {
        this._mergeView({
            width: this._cache.contentRect.right - this._cache.contentRect.left,
            height: this._cache.minimapChartHeight
        });
        if (lineDataService.drawToView(core, this.view)) {
            this.isDirty = false;
        }
        resetClip(this.ctx);
    };

    minimapZone._drawViewControl = function () {
        this.ctx.fillStyle = core.chartSettings.styles.chartFontColor;
        this.ctx.globalAlpha = 0.5;

        const sideWidth = (this.padding - core.chartSettings.layout.minimap.viewPortWidth) - 1;
        const topHeight = this._cache.contentRect.top - core.chartSettings.layout.minimap.viewPortHeight;
        const viewportWidth = Math.floor(core.View.viewPointWidth * this._cache.pixelToMinimapPixel);
        const aspectexX = core.View.x * this._cache.pixelToMinimapPixel;

        //x====x
        //|    |
        // ____
        this.ctx.fillRect(
            sideWidth + aspectexX,
            topHeight,
            viewportWidth,
            core.chartSettings.layout.minimap.viewPortHeight
        );

        // x ____
        // |     |
        // x ____|
        this._cache.viewInputRects.left = {
            x: sideWidth + aspectexX,
            y: topHeight + core.chartSettings.layout.minimap.viewPortHeight,
            width: core.chartSettings.layout.minimap.viewPortWidth,
            height: this._cache.contentRect.bottom
        };
        this.ctx.fillRect(
            this._cache.viewInputRects.left.x,
            this._cache.viewInputRects.left.y,
            this._cache.viewInputRects.left.width,
            this._cache.viewInputRects.left.height
        );

        //  ____
        // |    |
        // x====x
        this.ctx.fillRect(
            sideWidth + aspectexX,
            this.padding + this._cache.contentRect.bottom,
            viewportWidth,
            core.chartSettings.layout.minimap.viewPortHeight
        );

        //  ____x
        // |    ||
        //  ____x
        this._cache.viewInputRects.right = {
            x: aspectexX + viewportWidth,
            y: topHeight + core.chartSettings.layout.minimap.viewPortHeight,
            width: core.chartSettings.layout.minimap.viewPortWidth,
            height: this._cache.contentRect.bottom
        };
        this.ctx.fillRect(
            this._cache.viewInputRects.right.x,
            this._cache.viewInputRects.right.y,
            this._cache.viewInputRects.right.width,
            this._cache.viewInputRects.right.height
        );

        this.ctx.globalAlpha = 1.0;
    };

    minimapZone._makeInvisibleContentDarker = function () {
        clipArea(this.ctx, this._cache.contentRect);
        const fillLeftPart = core.View.x > 0;
        const fillRightPart = core.View.x + core.View.viewPointWidth < core.View.maxWidth;
        const viewportWidth = Math.floor(core.View.viewPointWidth * this._cache.pixelToMinimapPixel);
        if (fillLeftPart || fillRightPart) {
            this.ctx.fillStyle = core.chartSettings.styles.shadowColor;
            this.ctx.globalAlpha = 0.5;
            const aspectexX = core.View.x * this._cache.pixelToMinimapPixel;
            const sideWidth = core.chartSettings.layout.minimap.viewPortWidth;

            if (fillLeftPart) {
                this.ctx.fillRect(0, 0, aspectexX - sideWidth, this.height);
            }
            if (fillRightPart) {
                this.ctx.fillRect(
                    aspectexX + viewportWidth + core.chartSettings.layout.minimap.viewPortWidth - this._cache.contentRect.left,
                    0,
                    core.View.maxWidth - core.View.viewPointWidth - core.View.x - sideWidth,
                    this.height);
            }
            this.ctx.globalAlpha = 1;
        }
        resetClip(this.ctx);
    }

    minimapZone._updateViewInput = function () {
        if (this._cache.mouseHolded) {
            let changed = false;
            //left corner
            if (this._cache.sideHolded == ViewSides.Left) {
                let diff = this._cache.lastResizeFrom.x - this._cache.resizeFrom.x;
                if (diff != 0) {
                    if (core.View.x == 0 && diff > 0)
                        return;
                    if (core.View.viewPointWidth + diff < minViewportWidth)
                        return;

                    core.View.set({
                        x: core.View.x - diff,
                        viewPointWidth: core.View.viewPointWidth + diff
                    });
                    this._cache.lastResizeFrom = this._cache.resizeFrom;
                    changed = true;
                }
            }
            //right corner
            else if (this._cache.sideHolded == ViewSides.Right) {
                let diff = this._cache.lastResizeFrom.x - this._cache.resizeFrom.x;
                if (diff != 0) {
                    if (core.View.viewPointWidth - diff + core.View.x > core.View.maxWidth)
                        return;

                    core.View.set({
                        viewPointWidth: core.View.viewPointWidth - diff
                    });
                    this._cache.lastResizeFrom = this._cache.resizeFrom;
                    changed = true;
                }
                //center
            } else if (this._cache.sideHolded == ViewSides.Center) {
                let diff = this._cache.lastResizeFrom.x - this._cache.resizeFrom.x;
                if (diff != 0) {
                    core.View.set({
                        x: core.View.x - diff
                    });
                    this._cache.lastResizeFrom = this._cache.resizeFrom;
                    changed = true;
                }
            }

            if (changed) {
                this.isDirty = true;
                core._chartZone.isDirty = true;
                core.invalidateLifeCycle();
            }
        }
    };

    minimapZone._clearCursor = function () {
        if (this._cache.sideHolded != ViewSides.None) {
            this._cache.sideHolded = ViewSides.None;
            setCursor(core.Context2D.canvas, Cursors.Default);
        }
    };

    minimapZone._prepare = function () {
        if (!this.ctx)
            this.ctx = core.Context2D;

        if (!this.view)
            this.view = createView();

        this._cache = {
            sideHolded: ViewSides.None,
            mouseHolded: false,
            pixelToMinimapPixel: 1,
            minimapChartHeight: 1,
            contentRect: null,
            viewInputRects: {
                left: null,
                right: null
            }
        };

        this.height = this.mapHeight + (this.padding * 2);
        if (!this._cache.subscribedOnEvents) {
            this._cache.subscribedOnEvents = true;

            const proceedControlEvent = (ev) => {
                const mousePos = getMousePos(core.Context2D.canvas, ev, this.rectZone);
                this._cache.resizeFrom = mousePos;
                if (!this._cache.mouseHolded) {
                    if (mousePos.x > 0 && mousePos.x < this.width && mousePos.y > 0 && mousePos.y < this.height) {
                        const pointInRect = function (point, rect) {
                            const fitByWidth = point.x >= rect.x && point.x <= rect.x + rect.width;
                            const fitByHeight = point.y >= rect.y && point.y <= point.y + rect.height;
                            return fitByWidth && fitByHeight;
                        }

                        let cursorWasChanged = false;
                        if (this._cache.viewInputRects.left && pointInRect(mousePos, this._cache.viewInputRects.left)) {
                            setCursor(core.Context2D.canvas, Cursors.WResize);
                            this._cache.sideHolded = ViewSides.Left;
                            cursorWasChanged = true;
                        }
                        if (this._cache.viewInputRects.right && pointInRect(mousePos, this._cache.viewInputRects.right)
                            && !cursorWasChanged) {
                            setCursor(core.Context2D.canvas, Cursors.WResize);
                            this._cache.sideHolded = ViewSides.Right;
                            cursorWasChanged = true;
                        }
                        if (!cursorWasChanged) {
                            const nearSidesRect = {
                                x: this._cache.viewInputRects.left.x + this._cache.viewInputRects.left.width,
                                y: this._cache.viewInputRects.left.y,
                                width: this._cache.viewInputRects.right.x - this._cache.viewInputRects.left.x,
                                height: this._cache.viewInputRects.left.height
                            };
                            if (this._cache.viewInputRects.right && pointInRect(mousePos, nearSidesRect)) {
                                this._cache.sideHolded = ViewSides.Center;
                                setCursor(core.Context2D.canvas, Cursors.Pointer);
                                cursorWasChanged = true;
                            }
                        }
                        if (!cursorWasChanged) {
                            this._clearCursor();
                        }
                    }
                }
            }

            core.Events.on(SupportedEvents.MouseMove, (ev) => {
                this._idle();
                proceedControlEvent(ev);
            });

            core.Events.on(SupportedEvents.MousePress, (ev) => {
                const isTouchEvent = ev.type == 'touchstart';
                if (isTouchEvent) {
                    this._idle();
                    proceedControlEvent(ev);
                }

                if ((isTouchEvent || ev.button == 0)
                    && this._cache.sideHolded != ViewSides.None) {
                    this._cache.mouseHolded = true;
                    this._cache.lastResizeFrom = getMousePos(core.Context2D.canvas, ev, this.rectZone);
                }
            });

            core.Events.on(SupportedEvents.MouseUp, (ev) => {
                const isTouchEvent = ev.type == 'touchend';
                if (isTouchEvent) {
                    this._idle();
                    proceedControlEvent(ev);
                }

                if ((isTouchEvent || ev.button == 0)
                    && this._cache.mouseHolded) {
                    this._cache.mouseHolded = false;
                    this._clearCursor();
                }
            });
        }
    };

    minimapZone.canChangeHeight = false;
    minimapZone._prepare();

    return minimapZone;
}

module.exports = minimapZoneFactory;
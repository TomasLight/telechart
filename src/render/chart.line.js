const { monthNames } = require('../helpers/date.helper');

module.exports = {
    //calculate min/max data values
    prepare: function (chartData) {
        chartData['x'] = chartData.charts.filter(f => f.key == 'x')[0];
        chartData['y'] = chartData.charts.filter(f => f.key != 'x');

        chartData['minX'] = Math.min(...chartData['x'].points);
        chartData['maxX'] = Math.max(...chartData['x'].points);

        const allYpoints = [...new Set([].concat(...chartData['y'].map((o) => o.points)))];
        chartData['minY'] = Math.min(...allYpoints);
        chartData['maxY'] = Math.max(...allYpoints);

        chartData.isReady = true;
    },
    //get bottom area names for X values
    getXDateNames: function ({ minX, maxX, startAtX, endAtX }, allowedElements) {
        if (minX == maxX && minX == 0)
            return ['-'];

        const fromXvalue = startAtX;
        const toXvalue = endAtX;

        const diffValue = toXvalue - fromXvalue;
        const perValue = diffValue / allowedElements;

        var indArrays = [];
        for (var i = 0; i < allowedElements; i++) {
            indArrays.push(i);
        }
        const names = indArrays
            .map(val => {
                const nDate = new Date(startAtX + (val * perValue));
                return `${monthNames[nDate.getMonth()]} ${nDate.getDate()}`;
            });

        return names;
    },
    //get names for vertical values (Y)
    getYValues: function ({ maxY }, allowedElements) {
        const elementsWithOffset = allowedElements + 1;
        const perValue = maxY / elementsWithOffset;
        var values = [];
        for (var i = 0; i < elementsWithOffset; i++) {
            values.push(parseInt(i * perValue));
        }

        return values;
    },
    drawToView: function (core, view) {
        const { charts } = core.Dataset;
        const ctx = core.Context2D;
        const {
            viewPointHeight,
            pixelForXtick,
            pixelForYtick,
            startAtX,
            endAtX
        } = view;

        ctx.lineWidth = core.chartSettings.layout.chart.lineWidth;

        let allWasRendered = true;

        //render lines
        charts.forEach(targetChart => {
            if (targetChart.isReady) {
                const xPoints = targetChart.x.points;
                const yData = targetChart.y;

                yData.forEach(curDataLine => {
                    ctx.strokeStyle = curDataLine.color;
                    let isInitialPoint = true;

                    curDataLine.calcedPoints = [];

                    ctx.beginPath();
                    ctx.moveTo(0, viewPointHeight);

                    for (var i = 0; i < xPoints.length; i++) {
                        const pointData = {
                            x: xPoints[i],
                            y: curDataLine.points[i]
                        }

                        if (xPoints.length < i + 1 && xPoints[i + 1].x > endAtX)
                            break;

                        const canDraw = true || pointData.x >= startAtX;
                        const pointPos = {
                            x: (pointData.x - startAtX) / pixelForXtick,
                            y: Math.max(0, viewPointHeight - (pointData.y / pixelForYtick))
                        }

                        if (isInitialPoint) {
                            curDataLine.fromIndex = i;
                            if (canDraw) {
                                ctx.lineTo(pointPos.x, viewPointHeight);
                            }
                            isInitialPoint = false;
                        }

                        const pointX = pointPos.x;
                        curDataLine.calcedPoints.push({ x: pointX, y: pointPos.y });
                        if (canDraw) {
                            ctx.lineTo(pointX, pointPos.y);
                        }
                    }

                    ctx.stroke();
                    ctx.moveTo(0, 0);
                });
            } else {
                allWasRendered = false;
            }
        });

        //true means we done with rendering
        return allWasRendered;
    },
    getNearestPoints: function (core, targetPoint) {
        const { charts } = core.Dataset;
        const maxDistanceToPoint = 75;//TODO

        let mostNearestPoints = [];

        //get all nearest points to <targetPoint>
        charts.forEach(targetChart => {
            if (targetChart.isReady) {
                const yData = targetChart.y;
                yData.forEach(curDataLine => {
                    const cachedLine = {
                        line: curDataLine,
                        fromIndex: curDataLine.fromIndex,
                        points: []
                    };
                    const points = curDataLine.calcedPoints;
                    if (points && points.length > 0) {
                        for (var i = 0; i < points.length; i++) {
                            var distance = Math.abs(targetPoint.x - points[i].x);
                            if (distance < maxDistanceToPoint) {
                                cachedLine.points.push({
                                    point: points[i],
                                    distance: distance,
                                    xValue: targetChart.x.points[i]
                                });
                            }
                        }
                    }
                    mostNearestPoints.push(cachedLine);
                });
            }
        });

        var minDistance = null;
        if (mostNearestPoints) {
            //get most nearest point
            if (mostNearestPoints.length > 1) {
                for (var i = 0; i < mostNearestPoints.length; i++) {
                    let minDistanceInLine = mostNearestPoints[i].points
                        .sort((prev, next) => prev.distance - next.distance)[0];
                    if (!minDistance) {
                        minDistance = minDistanceInLine;
                    } else if (minDistanceInLine.distance < minDistance.distance) {
                        minDistance = minDistanceInLine;
                    }
                }
            } else if (mostNearestPoints.length > 0) {
                minDistance = mostNearestPoints[0];
            }

            //create result model
            let nearestPointsByX = [];
            if (minDistance) {
                charts.forEach(targetChart => {
                    if (targetChart.isReady) {
                        const xData = targetChart.x.points;
                        let ind = xData.indexOf(minDistance.xValue);
                        if (ind >= 0) {
                            nearestPointsByX.push({
                                chart: targetChart,
                                index: ind
                            });
                        }
                    }
                });
            }

            return nearestPointsByX;
        }

        return minDistance;
    }
};
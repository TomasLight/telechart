let measureElement = null;

const measureCache = {

};

function textMetrics(ctx, txt) {

    if (measureCache.hasOwnProperty(ctx.font) && measureCache[ctx.font].hasOwnProperty(txt)) {
        return measureCache[ctx.font][txt];
    }
    if (!measureCache.hasOwnProperty(ctx.font)) {
        measureCache[ctx.font] = {};
    }

    var tm = ctx.measureText(txt),
        w = tm.width,
        h;  // height, div element

    if (typeof tm.fontBoundingBoxAscent === "undefined") {

        // create a div element and get height from that
        if (!measureElement) {
            measureElement = document.createElement('div');
        }
        measureElement.style.cssText = "position:fixed;font:" + ctx.font +
            ";padding:0;margin:0;left:-9999px;top:-9999px";
        measureElement.innerHTML = txt;

        document.body.appendChild(measureElement);
        h = parseInt(getComputedStyle(measureElement).getPropertyValue('height'), 10);

        measureElement.innerHTML = '';
    }
    else {
        // in the future ...
        h = tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent;
    }

    const result = { width: w, height: h };
    measureCache[ctx.font][txt] = result
    return result;
}

function drawBorder(context2d, width, height, color = "#FF0000") {
    context2d.lineWidth = 2;
    context2d.strokeStyle = color;
    context2d.strokeRect(0, 0, width, height);
}

function clipArea(context2d, area) {
    context2d.save();
    context2d.beginPath();
    context2d.rect(area.left, area.top, area.right - area.left, area.bottom);
    context2d.clip();
    context2d.translate(area.left, area.top);
}

function resetClip(context2d) {
    context2d.restore();
}

function fillFullArea(context2d, color, width, height) {
    context2d.fillStyle = color;
    context2d.fillRect(0, 0, width, height)
}

function roundRect(context2d, x, y, width, height, radius, fill) {
    if (width < 2 * radius) {
        radius = width / 2;
    }
    if (height < 2 * radius) {
        radius = height / 2;
    }
    context2d.beginPath();
    context2d.moveTo(x + radius, y);
    context2d.arcTo(x + width, y, x + width, y + height, radius);
    context2d.arcTo(x + width, y + height, x, y + height, radius);
    context2d.arcTo(x, y + height, x, y, radius);
    context2d.arcTo(x, y, x + width, y, radius);
    context2d.closePath();
    if (fill) {
        context2d.fill();
    }
    context2d.stroke();
}

function hoverPoint(context2d, x, y, radius, width) {
    context2d.lineWidth = width;
    context2d.beginPath();
    context2d.arc(x, y, radius, 0, 2 * Math.PI, false);
    context2d.closePath();
    context2d.fill();
    context2d.stroke();
}

function getMousePos(canvas, evt, zone) {
    zone = zone || { left: 0, top: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches && evt.touches.length > 0
        ? evt.touches[0].clientX
        : evt.clientX;
    const clientY = evt.touches && evt.touches.length > 0
        ? evt.touches[0].clientY
        : evt.clientY;

    return {
        x: clientX - zone.left - rect.left,
        y: clientY - zone.top - rect.top
    };
}

function disableShadow(canvas) {
    canvas.shadowColor = 'rgba(0, 0, 0, 0)';
    canvas.shadowBlur = 0;
}

module.exports = {
    textMetrics,
    drawBorder,
    clipArea,
    resetClip,
    fillFullArea,
    getMousePos,
    roundRect,
    hoverPoint,
    disableShadow
};

const { textMetrics, clipArea } = require('./canvas.helper');

function drawTooltipForLineChart(ctx, core, mousePos, ops) {
    const { chartSettings, View } = core;

    const tooltipHeader = ops.title || '';
    const applyHeaderStyles = () => ctx.font = `${chartSettings.fonts.tooltipHeader}px ${chartSettings.fonts.tooltipHeaderFont}`;
    applyHeaderStyles();
    const headerSize = textMetrics(ctx, tooltipHeader);

    ctx.font = `bold ${chartSettings.fonts.tooltipValueSize}px ${chartSettings.fonts.tooltipValueFont}`;
    const allYvals = [];
    const tooltipVals = ops.yVals || [];
    tooltipVals.forEach(yVal => {
        const valString = `${yVal.value}`;
        const nameString = yVal.yLine.name;
        allYvals.push({
            valString: valString,
            valSize: textMetrics(ctx, valString),
            nameString: nameString,
            nameSize: textMetrics(ctx, nameString),
            color: yVal.yLine.color
        });
    });

    const halfWidth = View.maxWidth / 2;
    const sideWidth = chartSettings.layout.tooltip.sidePadding * 2;

    const maxTextElementWidth = allYvals.sort((c, p) => Math.max(p.valSize.width, p.nameSize.width) - Math.max(c.valSize.width, c.nameSize.width))[0];
    const perElementWidth = Math.max(maxTextElementWidth.valSize.width, maxTextElementWidth.nameSize.width)
        + chartSettings.layout.tooltip.horizontalPaddingBetweenContent;
    let elementsPerLine = allYvals.length;
    let totalWidthY = perElementWidth * elementsPerLine;

    while (totalWidthY > halfWidth && elementsPerLine >= 2) {
        elementsPerLine /= 2;
        totalWidthY = perElementWidth * elementsPerLine;
    }
    elementsPerLine = Math.ceil(elementsPerLine);

    const yLines = Math.ceil(allYvals.length / elementsPerLine);
    const maxTextElementHeight = allYvals.sort((c, p) => Math.max(p.valSize.height, p.nameSize.height) - Math.max(c.valSize.height, c.nameSize.height))[0];
    const perElementHeight = Math.max(maxTextElementHeight.valSize.height, maxTextElementHeight.nameSize.height);
    const heightPerLine = chartSettings.layout.tooltip.xyPadding
        + (perElementHeight * 2)
        + chartSettings.layout.tooltip.verticalPadding;
    const valueVerticalOffset = perElementHeight + chartSettings.layout.tooltip.verticalPadding;

    const cornerPadding = 5;//TODO
    const usedHeaderWidth = headerSize.width > totalWidthY;
    const totalSize = {
        width: sideWidth + Math.max(headerSize.width, totalWidthY),
        height: heightPerLine * yLines
            + headerSize.height
            + chartSettings.layout.tooltip.verticalPadding
            + chartSettings.fonts.tooltipHeader
            + (cornerPadding * 2)
    };

    let mouseX = mousePos.x + 40; //TODO
    const tooltipPosition = {
        x: Math.max(mouseX, cornerPadding),
        y: mousePos.y
    };
    //make tooltip in canvas bounds
    if (mouseX + totalSize.width > View.maxWidth) {
        tooltipPosition.x = mousePos.x - 40 - totalSize.width - cornerPadding;
    }
    if (mousePos.y < cornerPadding) {
        tooltipPosition.y = cornerPadding;
    }
    if (mousePos.y + totalSize.height > View.maxHeight) {
        tooltipPosition.y = View.maxHeight - totalSize.height - cornerPadding;
    }


    core.Tooltip.draw({
        pos: tooltipPosition,
        size: totalSize
    });

    clipArea(ctx, {
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        right: tooltipPosition.x + totalSize.width,
        bottom: totalSize.height
    });

    applyHeaderStyles();
    ctx.fillStyle = chartSettings.styles.tooltipHeaderColor;
    const headerY = chartSettings.layout.tooltip.verticalPadding + chartSettings.fonts.tooltipHeader;
    ctx.fillText(tooltipHeader,
        chartSettings.layout.tooltip.sidePadding,
        headerY,
        totalSize.width);

    if (allYvals.length > 0) {
        const elementWidthByHeader = headerSize.width / elementsPerLine;
        for (var curStringLine = 0; curStringLine < yLines; curStringLine++) {
            for (var elementIndex = 0; elementIndex < elementsPerLine; elementIndex++) {
                const allYindex = elementIndex + (elementsPerLine * curStringLine);
                const curElement = allYvals[allYindex];

                ctx.fillStyle = curElement.color;
                ctx.font = `${chartSettings.fonts.tooltipValueFontAddon} ${chartSettings.fonts.tooltipValueSize}px ${chartSettings.fonts.tooltipValueFont}`;

                const sidePadding = usedHeaderWidth
                    ? chartSettings.layout.tooltip.sidePadding + elementWidthByHeader * elementIndex
                    : chartSettings.layout.tooltip.sidePadding + elementIndex * perElementWidth;
                const verticalPadding = headerY + heightPerLine * (curStringLine + 1) - valueVerticalOffset;
                ctx.fillText(curElement.valString,
                    sidePadding,
                    verticalPadding,
                    perElementWidth);

                ctx.font = `${chartSettings.fonts.tooltipLineNameSize}px ${chartSettings.fonts.tooltipLineNameFont}`;
                ctx.fillText(curElement.nameString,
                    sidePadding,
                    verticalPadding + valueVerticalOffset,
                    perElementWidth);
            }
        }
    }
}

module.exports = {
    drawTooltipForLineChart
};
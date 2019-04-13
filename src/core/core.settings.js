const dayTheme = {
    backgroundColor: '#fff',
    chartLineColor: '#ccd7dd',
    chartFontColor: '#AAA296',
    tooltipBackgroundColor: '#fff',
    tooltipHeaderColor: '#222222',
    legendColor: '#222222',
    shadowColor: '#dadfe5',
    minimapFocusAreaColor: '#fff'
};

const nightTheme = {
    backgroundColor: '#242f3e',
    chartLineColor: '#293544',
    chartFontColor: '#546778',
    tooltipBackgroundColor: '#253241',
    tooltipHeaderColor: '#fff',
    legendColor: '#fff',
    shadowColor: '#1b2530',
    minimapFocusAreaColor: '#1b2530'
};

var settings = () => {
    return {
        layout: {
            sidePadding: 36,
            contentPadding: 25,
            chart: {
                bottomContentPadding: 20,
                bottomContentVerticalPadding: 12,
                leftLegendVerticalPadding: 18,
                lineWidth: 3,
                pointRadius: 10
            },
            minimap: {
                verticalContentPadding: 10,
                viewPortHeight: 4,
                viewPortWidth: 12
            },
            tooltip: {
                sidePadding: 35,
                verticalPadding: 10,
                xyPadding: 25,
                xPadding: 55,
                verticalPaddingBetweenContent: 16,
                horizontalPaddingBetweenContent: 10
            }
        },
        styles: dayTheme,
        fonts: {
            legendFontAddon: 'bold',
            legendFontSize: 40,
            legendFont: 'Arial',
            xLineFontSize: 30,
            xLineFont: 'Arial',
            tooltipHeader: 40,
            tooltipHeaderFont: 'Arial',
            tooltipValueSize: 40,
            tooltipValueFont: 'Arial',
            tooltipValueFontAddon: 'bold',
            tooltipLineNameSize: 35,
            tooltipLineNameFont: 'Arial'
        }
    }
}

module.exports = {
    settings,
    dayTheme,
    nightTheme
};
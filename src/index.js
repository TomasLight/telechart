const Chart = require('./core/core.chart');
const { dayTheme, nightTheme } = require('./core/core.settings');

module.exports = Chart.default;
if (typeof window !== 'undefined') {
    window.Chart = Chart.default;
    window.ChartThemes = { dayTheme, nightTheme }
}
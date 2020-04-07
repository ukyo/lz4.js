const { watch } = require('gulp');

function initWatchDev(task) {
    return function () {
        return watch(['src/**/*'], task);
    }
}

module.exports = {
    initWatchDev
}
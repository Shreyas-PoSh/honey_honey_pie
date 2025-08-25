const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const logsDir = path.join(__dirname, '../../logs');

// Rotate logs daily
function rotateLogs() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const logFile = path.join(logsDir, 'honeypot_activity.log');
    const splunkFile = path.join(logsDir, 'splunk_input.log');

    const rotatedLogFile = path.join(logsDir, `honeypot_activity_${today}.log`);
    const rotatedSplunkFile = path.join(logsDir, `splunk_input_${today}.log`);

    // Check if log files exist and rotate them
    if (fs.existsSync(logFile)) {
        fs.renameSync(logFile, rotatedLogFile);
        console.log(`Rotated log file to: ${rotatedLogFile}`);
    }

    if (fs.existsSync(splunkFile)) {
        fs.renameSync(splunkFile, rotatedSplunkFile);
        console.log(`Rotated Splunk file to: ${rotatedSplunkFile}`);
    }
}

// Run log rotation
if (require.main === module) {
    rotateLogs();
}

module.exports = { rotateLogs };

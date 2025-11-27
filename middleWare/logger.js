const fs = require('fs');
const path = require('path');

const logger = async (req, res, next) => {
    const logEntry = `\n${new Date().toISOString()} - ${req.method} ${req.url}\n  email: ${JSON.stringify(req.body?.email || "") }\n`;
    console.log(res.data);
    
    console.log(logEntry.trim());
    
    try {
        fs.appendFileSync(path.join(__dirname, '../logger.log'), logEntry);        
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
    
    next();
};

module.exports = logger;
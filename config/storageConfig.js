// config/storageConfig.js
require('dotenv').config();

const BASE_STORAGE_PATH = process.env.BASE_STORAGE_PATH || '/media/gestions.cloud';

module.exports = {
    BASE_STORAGE_PATH,
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const morgan_1 = __importDefault(require("morgan"));
// Custom token for response time
morgan_1.default.token('response-time-ms', (req, res) => {
    const responseTime = res.getHeader('X-Response-Time');
    return responseTime ? `${responseTime}ms` : '0ms';
});
// Custom format for development
const devFormat = ':method :url :status :response-time ms - :res[content-length]';
// Custom format for production
const prodFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';
// Create logger middleware
exports.logger = process.env.NODE_ENV === 'production'
    ? (0, morgan_1.default)(prodFormat)
    : (0, morgan_1.default)(devFormat);
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map
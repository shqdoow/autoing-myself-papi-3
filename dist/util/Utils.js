"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Util {
    async wait(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    getFormattedDate(ms = Date.now()) {
        const today = new Date(ms);
        const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
        const day = String(today.getDate()).padStart(2, '0');
        const year = today.getFullYear();
        return `${month}/${day}/${year}`;
    }
    shuffleArray(array) {
        const shuffledArray = array.slice();
        shuffledArray.sort(() => Math.random() - 0.5);
        return shuffledArray;
    }
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    chunkArray(arr, numChunks) {
        const chunkSize = Math.ceil(arr.length / numChunks);
        const chunks = [];
        for (let i = 0; i < arr.length; i += chunkSize) {
            const chunk = arr.slice(i, i + chunkSize);
            chunks.push(chunk);
        }
        return chunks;
    }
}
exports.default = Util;
//# sourceMappingURL=Utils.js.map
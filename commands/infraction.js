const fs = require("fs");
const path = require("path");

const database = path.join(__dirname, "..", "data", "infractions.json");

function loadData() {
    return JSON.parse(fs.readFileSync(database, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(database, JSON.stringify(data, null, 2));
}

module.exports = {
    loadData,
    saveData
};

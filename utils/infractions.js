const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "infractions.json");

function load() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({ nextCase: 1, infractions: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(file));
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function createInfraction(entry) {
    const db = load();

    const infraction = {
        caseId: db.nextCase++,
        ...entry,
        date: Date.now(),
        active: true
    };

    db.infractions.push(infraction);
    save(db);

    return infraction;
}

function getUserInfractions(userId) {
    const db = load();
    return db.infractions.filter(i => i.userId === userId);
}

function getCase(id) {
    const db = load();
    return db.infractions.find(i => i.caseId === id);
}

function removeCase(id) {
    const db = load();
    db.infractions = db.infractions.filter(i => i.caseId !== id);
    save(db);
}

module.exports = {
    load,
    save,
    createInfraction,
    getUserInfractions,
    getCase,
    removeCase
};

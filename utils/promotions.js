const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "promotions.json");

function load() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({ promotions: [] }, null, 2));
    }

    return JSON.parse(fs.readFileSync(file));
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function addPromotion(entry) {
    const db = load();

    db.promotions.push({
        ...entry,
        date: Date.now()
    });

    save(db);
}

function getPromotions(userId) {
    const db = load();
    return db.promotions.filter(p => p.userId === userId);
}

function removePromotion(userId) {
    const db = load();

    db.promotions = db.promotions.filter(p => p.userId !== userId);

    save(db);
}

module.exports = {
    addPromotion,
    getPromotions,
    removePromotion
};

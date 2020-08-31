var timer = 256;
var tickRate = 16;
var visualRate = 256;
var Crop;
(function (Crop) {
    Crop[Crop["Wheat"] = 0] = "Wheat";
    Crop[Crop["Barley"] = 1] = "Barley";
    Crop[Crop["Rye"] = 2] = "Rye";
})(Crop || (Crop = {}));
var crops = [Crop.Wheat, Crop.Barley, Crop.Rye];
var baseCropGrowthRate = 0.1;
var cropGrowthRate = new Map();
// TODO: Define different growth rates for crops?
crops.forEach(function (crop) { return cropGrowthRate.set(crop, baseCropGrowthRate); });
// Price per 1 unit of crop
// TODO: Randomly move the price up and down
var cropMarket = new Map([
    [Crop.Wheat, 3],
    [Crop.Barley, 2],
    [Crop.Rye, 1],
]);
// Food eaten by one person
var consumptionRate = 0.5;
// A farm
var Farm = /** @class */ (function () {
    function Farm(initalSeed) {
        this.totalFarmers = 0;
        this.stockpile = initalSeed;
        console.assert(this.stockpile > 0);
    }
    // TODO: What if stockpile hits 0 and all food is eaten by the farmers
    Farm.prototype.harvest = function (crop) {
        var amountGrown = Math.min(this.totalFarmers, this.stockpile);
        // Non-null assertion as a Map may not have every entry ready
        this.stockpile += amountGrown * cropGrowthRate.get(crop);
        this.stockpile -= this.totalFarmers * consumptionRate;
        console.assert(this.stockpile > 0);
    };
    return Farm;
}());
var baseDPSPerSoldier = 1;
var Army = /** @class */ (function () {
    function Army() {
        this.totalSoldiers = 0;
        this.dpsPerSoldier = baseDPSPerSoldier;
    }
    Army.prototype.attack = function (kingdom) {
        //TODO: How to attack a kingdom
        console.assert(false, "Attacking a Kingdom is not implemented");
        return kingdom;
    };
    return Army;
}());
// Returns a random integer inclusive on both ends
function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
var Kingdom = /** @class */ (function () {
    function Kingdom(name, initialPopulation) {
        // TODO: Better define health
        this.health = 100;
        this.gold = 0;
        this.army = new Army();
        this.farms = new Map();
        this.idlePopulation = initialPopulation;
        this.name = name;
    }
    Kingdom.prototype.orderHarvest = function () {
        this.farms.forEach(function (farm, crop) { return farm.harvest(crop); });
    };
    Kingdom.prototype.buyCrop = function (crop, amt) {
        var cost = amt * cropMarket.get(crop);
        if (cost > this.gold)
            return;
        var farm = this.farms.get(crop);
        this.gold -= cost;
        farm.stockpile += amt;
        // TODO: Increase price after purchase
    };
    Kingdom.prototype.sellCrop = function (crop, amt) {
        var farm = this.farms.get(crop);
        if (farm.stockpile < amt)
            return;
        var profit = amt * cropMarket.get(crop);
        farm.stockpile -= amt;
        this.gold += profit;
        // TODO: Decrease price after sale
    };
    return Kingdom;
}());
var minStartingRye = 50;
var maxStartingRye = 100;
var minStartingPop = 1;
var maxStartingPop = 10;
var kingdoms = [
    // TODO: Allow player to add own name
    new Kingdom(promptPlayer("Enter the name of your kingdom"), getRandInt(minStartingPop, maxStartingPop)),
];
// Init player data
var player = kingdoms[0];
player.farms.set(Crop.Rye, new Farm(getRandInt(minStartingRye, maxStartingRye)));
function promptPlayer(message) {
    var result = null;
    while (result == null)
        result = window.prompt(message, "");
    return result;
}
function updateText() {
}
function loadGUI() {
    cropMarket.forEach(function (value, key, map) {
        var button = document.createElement("button");
        button.innerHTML = Crop[key] + " " + key.toString() + "G";
        var store = document.getElementById("store-tab");
        store === null || store === void 0 ? void 0 : store.appendChild(button);
    });
}
window.setInterval(function () {
    timer += tickRate;
    if (timer > visualRate) {
        timer -= visualRate;
        updateText();
    }
}, tickRate);

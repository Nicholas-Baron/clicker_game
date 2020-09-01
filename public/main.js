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
// indicies for select fields
var selectedFarm = "Rye";
// let selectedCrop = "Rye";
// let sellAmount = "";
function promptPlayer(message) {
    var result = null;
    while (result == null)
        result = window.prompt(message, "");
    return result;
}
function handleBuy(ev) {
    var name = ev.target.id;
    var key = name.substring(0, name.indexOf("-"));
    var crop = Crop[key];
    if (player.gold >= cropMarket.get(crop)) {
        if (!player.farms.has(crop)) {
            player.farms.set(crop, new Farm(1));
            var stats = document.getElementById("gold-grain-stats");
            var grainStat = document.createElement("p");
            grainStat.innerHTML = player.farms.get(crop).stockpile.toString() + " " + Crop[crop];
            grainStat.id = Crop[crop] + "-stats";
            var farms = document.getElementById("farms");
            var farmOption = document.createElement("option");
            farmOption.id = Crop[crop] + "-farm-option";
            farmOption.innerHTML = Crop[crop];
            farms.appendChild(farmOption);
            var sellCrops = document.getElementById("crops-sale");
            var cropOption = document.createElement("option");
            cropOption.id = Crop[crop] + "-crop-option";
            cropOption.innerHTML = Crop[crop];
            sellCrops.appendChild(cropOption);
            stats === null || stats === void 0 ? void 0 : stats.appendChild(grainStat);
        }
        else {
            player.farms.get(crop).stockpile += 1;
        }
        player.gold -= cropMarket.get(crop);
    }
}
// load gui
function loadGUI() {
    cropMarket.forEach(function (value, key, map) {
        var button = document.createElement("button");
        button.innerHTML = Crop[key] + " " + value.toString() + "G";
        button.onclick = handleBuy;
        button.id = Crop[key] + "-store";
        var store = document.getElementById("store-tab");
        store === null || store === void 0 ? void 0 : store.appendChild(button);
    });
    document.getElementById("gold").innerHTML = player.gold.toString();
    player.farms.forEach(function (value, key, map) {
        var parent = document.getElementById("gold-grain-stats");
        var grain = document.createElement("p");
        grain.id = Crop[key] + "-stats";
        grain.innerHTML = value.stockpile + " " + Crop[key];
        parent.appendChild(grain);
        var farms = document.getElementById("farms");
        var farmOption = document.createElement("option");
        farmOption.id = Crop[key] + "-farm-option";
        farmOption.innerHTML = Crop[key];
        farms.appendChild(farmOption);
        var sellCrops = document.getElementById("crops-sale");
        var cropOption = document.createElement("option");
        cropOption.id = Crop[key] + "-crop-option";
        cropOption.innerHTML = Crop[key];
        sellCrops.appendChild(cropOption);
    });
    document.getElementById("people").innerHTML = player.idlePopulation.toString();
    document.getElementById("soldiers").innerHTML = player.army.totalSoldiers.toString();
    document.getElementById("farmers").innerHTML = getTotalFarmers().toString();
}
function getTotalFarmers() {
    var totalFarmers = 0;
    player.farms.forEach(function (value, key, map) {
        totalFarmers += value.totalFarmers;
    });
    return totalFarmers;
}
function updateStats() {
    document.getElementById("gold").innerHTML = player.gold.toString();
    document.getElementById("soldiers").innerHTML = player.army.totalSoldiers.toString();
    document.getElementById("farmers").innerHTML = getTotalFarmers().toString();
    document.getElementById("people").innerHTML = player.idlePopulation.toString();
    player.farms.forEach(function (value, key, map) {
        document.getElementById(Crop[key] + "-stats").innerHTML = value.stockpile.toString() + " " + Crop[key];
        document.getElementById(Crop[key] + "-farm-option").innerHTML = Crop[key];
        document.getElementById(Crop[key] + "-crop-option").innerHTML = Crop[key];
    });
}
function handleHarvest() {
}
function handleAssignFarmer() {
    if (player.idlePopulation > 0) {
        player.idlePopulation--;
        player.farms.get(Crop[selectedFarm]).totalFarmers++;
    }
}
function handleRemoveFarmer() {
    if (player.farms.get(Crop[selectedFarm]).totalFarmers > 0) {
        player.farms.get(Crop[selectedFarm]).totalFarmers--;
        player.idlePopulation++;
    }
}
function handleAssignSoldier() {
    if (player.idlePopulation > 0) {
        player.idlePopulation--;
        player.army.totalSoldiers++;
    }
}
function handleRemoveSoldier() {
    if (player.army.totalSoldiers > 0) {
        player.idlePopulation++;
        player.army.totalSoldiers--;
    }
}
function handleFarmChoice(element) {
    selectedFarm = element.value;
}
// function handleCropChoice(element: HTMLInputElement) {
//     selectedCrop = element.value;
// }
function handleSellChoice(element) {
}
// function handleSellAmount(element: HTMLInputElement) {
//     sellAmount = element.value;
// }
function sellCrop() {
    try {
        var sellAmount = document.getElementById("amount");
        var amount = sellAmount.value;
        var cropElement = document.getElementById("crops-sale");
        var selectedCrop = cropElement.value;
        console.log(selectedCrop);
        if (isNaN(Number(amount))) {
            return;
        }
        var crop = Crop[selectedCrop];
        if (player.farms.get(crop).stockpile > 0) {
            player.gold += parseInt(amount) * cropMarket.get(crop);
            player.farms.get(crop).stockpile -= parseInt(amount);
        }
    }
    catch (err) {
        console.error(err);
    }
}
window.setInterval(function () {
    timer += tickRate;
    if (timer > visualRate) {
        timer -= visualRate;
        updateStats();
    }
}, tickRate);

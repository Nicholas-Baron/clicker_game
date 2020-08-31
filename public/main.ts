let timer = 256;
const tickRate = 16;
const visualRate = 256;

enum Crop {
    Wheat,
    Barley,
    Rye,
}

const crops = [Crop.Wheat, Crop.Barley, Crop.Rye];

const baseCropGrowthRate = 0.1;
const cropGrowthRate: Map<Crop, number> = new Map();
// TODO: Define different growth rates for crops?
crops.forEach(crop => cropGrowthRate.set(crop, baseCropGrowthRate));

// Price per 1 unit of crop
// TODO: Randomly move the price up and down
const cropMarket = new Map(
    [
        [Crop.Wheat, 3],
        [Crop.Barley, 2],
        [Crop.Rye, 1],
    ]
);

// Food eaten by one person
const consumptionRate = 0.5;

// A farm
class Farm {
    totalFarmers = 0;
    stockpile: number;

    constructor(initalSeed: number){
        this.stockpile = initalSeed;
        console.assert(this.stockpile > 0);
    }

    // TODO: What if stockpile hits 0 and all food is eaten by the farmers
    harvest(crop: Crop){
        const amountGrown = Math.min(this.totalFarmers, this.stockpile);
        // Non-null assertion as a Map may not have every entry ready
        this.stockpile += amountGrown * cropGrowthRate.get(crop)!;
        this.stockpile -= this.totalFarmers * consumptionRate;
        console.assert(this.stockpile > 0);
    }
}

// Loot is an interface b/c kingdom (currently) can become a Loot object
interface Loot {
    gold: number;
    farms: Map<Crop, Farm>;
}

const baseDPSPerSoldier = 1;

class Army {
    totalSoldiers = 0;
    dpsPerSoldier = baseDPSPerSoldier;

    attack(kingdom: Kingdom): Loot {
        //TODO: How to attack a kingdom
        console.assert(false, "Attacking a Kingdom is not implemented");
        return kingdom;
    }
}

// Returns a random integer inclusive on both ends
function getRandInt(min:number, max:number):number {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}


class Kingdom {
    name: string;
    // TODO: Better define health
    health = 100;
    gold = 0;
    idlePopulation: number;
    army = new Army();
    farms: Map<Crop, Farm> = new Map();

    constructor(name: string, initialPopulation: number){
        this.idlePopulation = initialPopulation;
        this.name = name;
    }

    orderHarvest() {
        this.farms.forEach(
            (farm, crop) => farm.harvest(crop)
        );
    }

    buyCrop(crop: Crop, amt: number) {
        const cost = amt * cropMarket.get(crop)!;
        if(cost > this.gold) return;

        const farm = this.farms.get(crop)!;
        this.gold -= cost;
        farm.stockpile += amt;

        // TODO: Increase price after purchase
    }

    sellCrop(crop: Crop, amt: number){
        const farm = this.farms.get(crop)!;
        if(farm.stockpile < amt) return;

        const profit = amt * cropMarket.get(crop)!;
        farm.stockpile -= amt;
        this.gold += profit;

        // TODO: Decrease price after sale
    }
}

const minStartingRye = 50;
const maxStartingRye = 100;

const minStartingPop = 1;
const maxStartingPop = 10;

const kingdoms = [
    // TODO: Allow player to add own name
    new Kingdom(promptPlayer("Enter the name of your kingdom"), getRandInt(minStartingPop, maxStartingPop)), // player
    //TODO: Add other kingdoms
];

// Init player data
const player = kingdoms[0];
player.farms.set(Crop.Rye, new Farm(getRandInt(minStartingRye, maxStartingRye)));

function promptPlayer(message: string): string {
    let result = null;
    while(result == null)
        result = window.prompt(message, "");
    return result;
}

function updateText() {

}


function loadGUI() {
    cropMarket.forEach((value, key, map) => {
        let button = document.createElement("button");
        button.innerHTML = Crop[key] + " " + key.toString() + "G";
        let store = document.getElementById("store-tab");
        store?.appendChild(button);
    });
}


window.setInterval(() => {
    timer += tickRate;



    if (timer > visualRate){
        timer -= visualRate;
        updateText();
    }


}, tickRate);

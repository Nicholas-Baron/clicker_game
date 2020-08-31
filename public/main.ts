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
const cropMarket: Map<Crop, number> = new Map();
cropMarket.set(Crop.Wheat, 3);
cropMarket.set(Crop.Barley, 2);
cropMarket.set(Crop.Rye, 1);

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

function updateText() {

}


window.setInterval(() => {
    timer += tickRate;



    if (timer > visualRate){
        timer -= visualRate;
        updateText();
    }


}, tickRate);

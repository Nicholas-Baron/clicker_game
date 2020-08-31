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

function updateText() {

}


window.setInterval(() => {
    timer += tickRate;



    if (timer > visualRate){
        timer -= visualRate;
        updateText();
    }


}, tickRate);

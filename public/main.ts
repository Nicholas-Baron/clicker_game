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

// indicies for select fields
let selectedFarm = "Rye";
// let selectedCrop = "Rye";
// let sellAmount = "";

function promptPlayer(message: string): string {
    let result = null;
    while(result == null)
        result = window.prompt(message, "");
    return result;
}

interface Printable { toString(): string }
function setInnerHTML(id: string, content: Printable) {
  document.getElementById(id)!.innerHTML = content.toString();
}


function handleBuy(ev: MouseEvent) {
    const name = (ev.target as HTMLElement).id;
    const key = name.substring(0, name.indexOf("-"));
    const crop = Crop[key as keyof typeof Crop];

    if(player.gold >= cropMarket.get(crop)!) {

        if(!player.farms.has(crop)) {
            player.farms.set(crop, new Farm(1));
            const stats = document.getElementById("gold-grain-stats");
            const grainStat = document.createElement("p");
            grainStat.id = Crop[crop] + "-stats";
            setInnerHTML(grainStat.id, player.farms.get(crop)!.stockpile.toString() + " " + Crop[crop]);

            const farms = document.getElementById("farms");
            const farmOption = document.createElement("option");
            farmOption.id = Crop[crop] + "-farm-option";
            setInnerHTML(farmOption.id, Crop[crop]);
            farms!.appendChild(farmOption);

            const sellCrops = document.getElementById("crops-sale");
            const cropOption = document.createElement("option");
            cropOption.id = Crop[crop] + "-crop-option";
            setInnerHTML(cropOption.id, Crop[crop]);
            sellCrops!.appendChild(cropOption);

            stats?.appendChild(grainStat);
        }
        else player.farms.get(crop)!.stockpile += 1;

        player.gold-= cropMarket.get(crop)!;
    }


}

// load gui
function loadGUI() {
    cropMarket.forEach((value, key, map) => {
        const button = document.createElement("button");
        button.onclick = handleBuy;
        button.id = Crop[key] + "-store";
        setInnerHTML(button.id, Crop[key] + " " + value.toString() + "G");
        const store = document.getElementById("store-tab");
        store?.appendChild(button);
    });

    setInnerHTML("gold", player.gold.toString());

    player.farms.forEach((value: Farm, key: Crop, map: Map<Crop, Farm>) => {
        const parent = document.getElementById("gold-grain-stats");
        const grain = document.createElement("p");
        grain.id = Crop[key] + "-stats";
        setInnerHTML(grain.id, value.stockpile + " " + Crop[key]);
        parent!.appendChild(grain);

        const farms = document.getElementById("farms");
        const farmOption = document.createElement("option");
        farmOption.id = Crop[key] + "-farm-option";
        setInnerHTML(farmOption.id, Crop[key]);
        farms!.appendChild(farmOption);

        const sellCrops = document.getElementById("crops-sale");
        const cropOption = document.createElement("option");
        cropOption.id = Crop[key] + "-crop-option";
        setInnerHTML(cropOption.id, Crop[key]);
        sellCrops!.appendChild(cropOption);
    });




    setInnerHTML("people", player.idlePopulation.toString());
    setInnerHTML("soldiers", player.army.totalSoldiers.toString());
    setInnerHTML("farmers", getTotalFarmers().toString());
}
function getTotalFarmers() {
    let totalFarmers = 0;
    player.farms.forEach((value: Farm, key: Crop, map: Map<Crop, Farm>) => {
        totalFarmers += value.totalFarmers;
    });
    return totalFarmers;
}
function updateStats() {
    setInnerHTML("gold", player.gold.toString());
    setInnerHTML("soldiers", player.army.totalSoldiers.toString());
    setInnerHTML("farmers", getTotalFarmers().toString());
    setInnerHTML("people", player.idlePopulation.toString());
    player.farms.forEach((value: Farm, key: Crop, map: Map<Crop, Farm>) => {
        setInnerHTML(Crop[key] + "-stats", value.stockpile.toString() + " " + Crop[key]);
        setInnerHTML(Crop[key] + "-farm-option", Crop[key]);
        setInnerHTML(Crop[key] + "-crop-option", Crop[key]);
    });

}
// function handleHarvest() {

// }
function handleAssignFarmer() {
    if(player.idlePopulation > 0){
        player.idlePopulation--;
        player.farms.get(Crop[selectedFarm as keyof typeof Crop])!.totalFarmers++;
    }
}
function handleRemoveFarmer() {
    if(player.farms.get(Crop[selectedFarm as keyof typeof Crop])!.totalFarmers > 0) {
        player.farms.get(Crop[selectedFarm as keyof typeof Crop])!.totalFarmers--;
        player.idlePopulation++;
    }
}
function handleAssignSoldier() {
    if(player.idlePopulation > 0) {
        player.idlePopulation--;
        player.army.totalSoldiers++;
    }
}
function handleRemoveSoldier() {
    if(player.army.totalSoldiers > 0) {
        player.idlePopulation++;
        player.army.totalSoldiers--;
    }
}
function handleFarmChoice(element: HTMLInputElement) {
    selectedFarm = element.value;
}
// function handleCropChoice(element: HTMLInputElement) {
//     selectedCrop = element.value;
// }
// function handleSellChoice(element: HTMLInputElement) {

// }
// function handleSellAmount(element: HTMLInputElement) {
//     sellAmount = element.value;
// }
function sellCrop() {
    try {
        const sellAmount = document.getElementById("amount") as HTMLInputElement;
        const amount = sellAmount.value;

        const cropElement = document.getElementById("crops-sale") as HTMLInputElement;
        const selectedCrop = cropElement.value;
        console.log(selectedCrop);

        if(isNaN(Number(amount))) return;
        const crop = Crop[selectedCrop as keyof typeof Crop];
        if(player.farms.get(crop)!.stockpile > 0) {
            player.gold += parseInt(amount)*cropMarket.get(crop)!;
            player.farms.get(crop)!.stockpile -= parseInt(amount);
        }
    } catch(err) {
        console.error(err);
    }
}
window.setInterval(() => {
    timer += tickRate;



    if (timer > visualRate){
        timer -= visualRate;
        updateStats();
    }


}, tickRate);

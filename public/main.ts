let timer = 256;
const tickRate = 16;
const visualRate = 256;

enum Crop {
    Wheat,
    Barley,
    Rye,
}
enum Store {
    WheatFarm,
    BarleyFarm,
    Person
}
// FIXME: This uses autoincrementing (1,2,3,...), which may not be desireable.
const enum DefaultCropPrices {
    Rye = 1,
    Barley,
    Wheat,
}
const crops = [Crop.Wheat, Crop.Barley, Crop.Rye];

const baseCropGrowthRate = 0.1;
const clickGrowthRate = 0.5;
const cropGrowthRate: Map<Crop, number> = new Map();
// TODO: Define different growth rates for crops?
crops.forEach(crop => cropGrowthRate.set(crop, baseCropGrowthRate));

// Value per 1 unit of crop
// TODO: Randomly move the price up and down
const cropMarket = new Map(
    [
        [Crop.Wheat, DefaultCropPrices.Wheat],
        [Crop.Barley, DefaultCropPrices.Barley],
        [Crop.Rye, DefaultCropPrices.Rye],
    ]
);
const farmPrices = new Map(
    [
        [Crop.Barley, 100],
        [Crop.Wheat, 1000]
    ]
);
// Food eaten by one person
const consumptionRate = 0.07;

// A farm
class Farm {
    totalFarmers = 0;
    stockpile: number;

    constructor(initalSeed: number){
        this.stockpile = initalSeed;
        console.assert(this.stockpile > 0);
    }


    harvest(crop: Crop){
        const amountGrown = Math.min(this.totalFarmers, this.stockpile);
        // Non-null assertion as a Map may not have every entry ready
        if(this.stockpile - this.totalFarmers * consumptionRate > 0) {
            this.stockpile += amountGrown * cropGrowthRate.get(crop)!;
            this.stockpile -= this.totalFarmers * consumptionRate;
            this.stockpile = Math.ceil(this.stockpile);
        }
        console.assert(this.stockpile > 0);
    }
    playerHarvest(crop: Crop) {
        // TODO: add upgrades to click rate
        this.stockpile += Math.ceil(clickGrowthRate * (1 + this.totalFarmers));
    }
}

// Loot is an interface b/c kingdom (currently) can become a Loot object
interface Loot {
    gold: number;
    idlePopulation: number;
    farms: Map<Crop, Farm>;
}

const lootMinimum = 0.75;
const lootMaximum = 1.25;

class Army {
    totalSoldiers = 0;

    attack(opponent: Kingdom): Loot | null {
        if(this.totalSoldiers * randFloat(lootMinimum, lootMaximum) < opponent.strength) return null;

        const lootFarms = new Map();

        opponent.farms.forEach((farm, crop) => {
            const lootedFarm = new Farm(farm.stockpile * lootMinimum);
            lootedFarm.totalFarmers = farm.totalFarmers * lootMinimum;
            lootFarms.set(crop, lootedFarm);
        });

        return {
            gold: opponent.gold - this.totalSoldiers,
            idlePopulation: opponent.idlePopulation * lootMinimum,
            farms: lootFarms,
        };
    }
}

// Returns a random integer inclusive on both ends
function randInt(min:number, max:number):number {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

// Returns a random float inclusive only on min
function randFloat(min:number, max:number):number {
    return Math.random() * (max - min) + min;
}

class Kingdom {
    name: string;
    gold = 0;
    idlePopulation: number;
    army = new Army();
    farms: Map<Crop, Farm> = new Map();

    constructor(public name: string, public idlePopulation: number){}

    attack(opponent: Kingdom) {
        const waitTime = (opponent.strength + this.army.totalSoldiers) / 100;

        window.setTimeout(() => {
            const result = this.army.attack(opponent);
            // TODO: Better inform the player of the result
            if(result == null)
                alert(`The attack against ${opponent.name} failed.`);
            else{
                alert(`The attack against ${opponent.name} succeded.`);
                this.gold += result.gold;
                this.idlePopulation += result.idlePopulation;
                this.farms.forEach((farm, crop) => {
                    // Typescript should know that `result` is not null here,
                    // as we are in the `else` of an `== null` check.
                    const lootedFarm = result?.farms.get(crop);
                    if(lootedFarm != null){
                        farm.totalFarmers += lootedFarm?.totalFarmers;
                        farm.stockpile += lootedFarm?.stockpile;
                    }
                });
            }
        }, waitTime);
    }

    orderHarvest() {
        console.log(this.farms?.size);

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

    get strength() {
        return this.idlePopulation * 0.25 + this.army.totalSoldiers;
    }
}

const minStartingRye = 50;
const maxStartingRye = 100;
const minStartingPop = 4;
const maxStartingPop = 10;
const kingdoms = [
    new Kingdom(promptPlayer("Enter the name of your kingdom"), randInt(minStartingPop, maxStartingPop)), // player
    //TODO: Add other kingdoms
];

// Init player data
const player = kingdoms[0];
player.farms.set(Crop.Rye, new Farm(randInt(minStartingRye, maxStartingRye)));

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
type tag = HTMLElement | HTMLInputElement;
function setElementInnerHTML(el: tag, content: Printable) {
    el.innerHTML = content.toString();
}
function setIdInnerHTML(id: string, content: Printable) {
    setElementInnerHTML(document.getElementById(id)!, content);
}
function percise(num: number, sig: number) {
    return Number(num.toFixed(sig));
}

function handleBuy(ev: MouseEvent) {
    const element = ev.target as HTMLElement;
    const name = element.id;
    const key = name.substring(0, name.indexOf("-"));
    const crop = Crop[key as keyof typeof Crop];


    if(player.gold >= farmPrices.get(crop)!) {
        if(crop !== null || crop !== undefined) {
            if(!player.farms.has(crop)!) {
                player.farms.set(crop, new Farm(1));
                const stats = document.getElementById("gold-grain-stats");
                const grainStat = document.createElement("p");
                grainStat.id = Crop[crop] + "-stats";
                setElementInnerHTML(grainStat, player.farms.get(crop)!.stockpile.toString() + " " + Crop[crop]);

                const farms = document.getElementById("farms");
                const farmOption = document.createElement("option");
                farmOption.id = Crop[crop] + "-farm-option";
                setElementInnerHTML(farmOption, Crop[crop]);
                farms!.appendChild(farmOption);

                const sellCrops = document.getElementById("crops-sale");
                const cropOption = document.createElement("option");
                cropOption.id = Crop[crop] + "-crop-option";
                setElementInnerHTML(cropOption, Crop[crop]);
                sellCrops!.appendChild(cropOption);

                stats?.appendChild(grainStat);
            }
            player.gold -= farmPrices.get(crop)!;
        }
        document.getElementById(name)!.style.display = "none";
    }


}
// TODO: remove toStrings


// load gui
function loadGUI() {
    const store = document.getElementById("store-tab");
    cropMarket.forEach((value, key: Crop) => {
        if(key != Crop.Rye){
            const button = document.createElement("button");
            button.onclick = handleBuy;
            button.id = Crop[key] + "-store";
            button.className = "btn";
            setElementInnerHTML(button, Crop[key] + " " + farmPrices.get(key) + "G");
            store?.appendChild(button);
        }
    });

    setIdInnerHTML("gold", player.gold.toString());

    player.farms.forEach((value: Farm, key: Crop) => {
        const parent = document.getElementById("gold-grain-stats");
        const grain = document.createElement("p");
        grain.id = Crop[key] + "-stats";
        setElementInnerHTML(grain, value.stockpile + " " + Crop[key]);
        parent!.appendChild(grain);

        const farms = document.getElementById("farms");
        const farmOption = document.createElement("option");
        farmOption.id = Crop[key] + "-farm-option";
        setElementInnerHTML(farmOption, Crop[key]);
        farms!.appendChild(farmOption);

        const sellCrops = document.getElementById("crops-sale");
        const cropOption = document.createElement("option");
        cropOption.id = Crop[key] + "-crop-option";
        setElementInnerHTML(cropOption, Crop[key]);
        sellCrops!.appendChild(cropOption);
    });

    setIdInnerHTML("people", player.idlePopulation.toString());
    setIdInnerHTML("soldiers", player.army.totalSoldiers.toString());
    //setIdInnerHTML("farmers", getTotalFarmers().toString());
    selectFarmer();
}
function selectFarmer() {
    setIdInnerHTML("farmers", player.farms.get(Crop[selectedFarm as keyof typeof Crop])!.totalFarmers + " " + selectedFarm);
}

function updateStats() {
    setIdInnerHTML("gold", player.gold.toString());
    setIdInnerHTML("soldiers", player.army.totalSoldiers.toString());
    selectFarmer();
    //setIdInnerHTML("farmers", getTotalFarmers().toString());
    setIdInnerHTML("people", player.idlePopulation.toString());
    player.farms.forEach((value: Farm, key: Crop) => {
        setIdInnerHTML(Crop[key] + "-stats", value.stockpile.toString() + " " + Crop[key]);
        setIdInnerHTML(Crop[key] + "-farm-option", Crop[key]);
        setIdInnerHTML(Crop[key] + "-crop-option", Crop[key]);
    });
    if(player.farms.size > 0) player.orderHarvest();

}
function handleHarvest() {
    player.farms.forEach(value => value.playerHarvest(key));
}
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
function sellCrop() {
    try {
        const sellAmount = document.getElementById("amount") as HTMLInputElement;
        const amount = sellAmount.value;

        const cropElement = document.getElementById("crops-sale") as HTMLInputElement;
        const selectedCrop = cropElement.value;
        console.log(selectedCrop);

        if(isNaN(Number(amount))) return;
        const crop = Crop[selectedCrop as keyof typeof Crop];
        if(player.farms.get(crop)!.stockpile > 0 && parseInt(amount) <= player.farms.get(crop)!.stockpile) {
            player.gold += parseInt(amount) * cropMarket.get(crop)!;
            player.farms.get(crop)!.stockpile -= parseInt(amount);
        }
    } catch(err) {
        console.error(err);
    }
}
window.onload = () => {
    window.setInterval(() => {
        timer += tickRate;



        if (timer > visualRate){
            timer -= visualRate;
            updateStats();
        }


    }, tickRate);
    loadGUI();
};

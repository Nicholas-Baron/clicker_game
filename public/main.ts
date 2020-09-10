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
// This solution is fine
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
// const farmPrices = new Map(
//     [
//         [Crop.Barley, 100],
//         [Crop.Wheat, 1000]
//     ]
// );
const storePrices = new Map(
    [
        [Store.BarleyFarm, 100],
        [Store.WheatFarm, 1000],
        [Store.Person, 10]
    ]
);
// const storeToCrop = new Map(

// );
// Food eaten by one person
const consumptionRate = 0.07;

// A farm
class Farm {

    constructor(public stockpile: number, public totalFarmers = 0){
        console.assert(this.stockpile > 0, "Stockpile is empty");
        console.assert(this.totalFarmers >= 0, "Negative farmers?");
    }

    harvest(crop: Crop){
        const amountGrown = Math.min(this.totalFarmers, this.stockpile);
        if(this.stockpile - this.totalFarmers * consumptionRate > 0) {
            const growthRate = cropGrowthRate.get(crop) ?? baseCropGrowthRate;
            this.stockpile += amountGrown * growthRate;
            this.stockpile -= this.totalFarmers * consumptionRate;
            this.stockpile = Math.ceil(this.stockpile);
        }
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
            lootFarms.set(crop, new Farm(
                farm.stockpile * lootMinimum,
                farm.totalFarmers * lootMinimum
            ));
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
    console.assert(Number.isInteger(min) && Number.isInteger(max), "randInt should not use non-integer inputs");
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Returns a random float inclusive only on min
function randFloat(min:number, max:number):number {
    return Math.random() * (max - min) + min;
}

class Kingdom {
    gold = 0;
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

let sellAmount = "1";

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
function handleSellAmount(el: HTMLElement) {
    sellAmount = el.innerHTML;
    const parent = document.getElementById("choices");

    for(const child of parent?.children ?? [])
        if(child.innerHTML === sellAmount)
            child.className = "active";
        else
            child.className = "";

}
function handleSell(crop: Crop) {
    if(player.farms.get(crop)!.stockpile >= parseInt(sellAmount)) {
        player.farms.get(crop)!.stockpile -= parseInt(sellAmount);
        player.gold += parseInt(sellAmount);
    }
}
function handleBuy(storeItem: Store, id: string) {
    const buyFarm = (crop: Crop) => {
        player.farms.set(crop, new Farm(1));
        const stats = document.getElementById("gold-grain-stats");
        const grainStat = document.createElement("p");
        grainStat.id = Crop[crop] + "-stats";
        setElementInnerHTML(grainStat, player.farms.get(crop)!.stockpile.toString() + " " + Crop[crop]);
        stats?.appendChild(grainStat);
        // find another way to remove div
    };
    const buyPerson = () => {
        player.idlePopulation += 1;
    };
    if(player.gold >= storePrices.get(storeItem)!){
        switch(storeItem) {
        case Store.BarleyFarm:
            buyFarm(Crop.Barley);
            break;
        case Store.WheatFarm:
            buyFarm(Crop.Wheat);
            break;
        case Store.Person:
            buyPerson();
            break;
        default:
            break;
        }
        player.gold -= storePrices.get(storeItem)!;
    }
}
// TODO: remove toStrings

function personAssignment() {
    crops.map((value: Crop) => {
        const parent = document.createElement("div");
        parent.id = "assignment-container-" + Crop[value];
        document.getElementById("farmer")?.appendChild(parent);

        const farmers = document.createElement("span");
        farmers.id = "farmers-" + Crop[value];
        setElementInnerHTML(farmers, player.farms.get(value)?.totalFarmers ?? 0);
        parent.appendChild(farmers);

        const farmerType = document.createElement("span");
        farmerType.id = "farmer-type-" + Crop[value];
        setElementInnerHTML(farmerType, " " + Crop[value] + " Farmers ");
        parent.appendChild(farmerType);

        const assignButton = document.createElement("button");
        assignButton.className = "btn a-btn";
        setElementInnerHTML(assignButton, "+");
        assignButton.onclick = () =>  handleAssignFarmer(value);
        parent.appendChild(assignButton);

        const removeButton = document.createElement("button");
        removeButton.className = "btn a-btn";
        removeButton.onclick = () =>  handleRemoveFarmer(value);
        setElementInnerHTML(removeButton, "-");
        parent.appendChild(removeButton);
    });
}
const storeToCrop = new Map(
    [
        [Store.BarleyFarm, Crop.Barley],
        [Store.WheatFarm, Crop.Wheat]
    ]
);
// load gui
function loadGUI() {

    storePrices.forEach((price: number, storeItem: Store) => {
        const store = document.getElementById("store-tab");
        const button = document.createElement("button");
        button.id = Store[storeItem] + "-store";
        button.onclick = () => handleBuy(storeItem, Store[storeItem] + "-store");
        button.className = "btn";
        setElementInnerHTML(button, (Crop[storeToCrop.get(storeItem)!] ?? Store[storeItem])
                            + " " + storePrices.get(storeItem) + " Gold");
        store?.appendChild(button);
    });

    setIdInnerHTML("gold", player.gold.toString());

    player.farms.forEach((value: Farm, key: Crop) => {
        const parent = document.getElementById("gold-grain-stats");
        const grain = document.createElement("p");
        grain.id = Crop[key] + "-stats";
        setElementInnerHTML(grain, value.stockpile + " " + Crop[key]);
        parent!.appendChild(grain);


        const sellOptions = document.getElementById("sell-options");
        const sellOption = document.createElement("button");
        sellOption.innerHTML = Crop[key];
        sellOption.className = "btn my-3";
        sellOption.onclick = () => handleSell(key);
        sellOption.id = Crop[key] + "-sell-option";
        sellOptions!.appendChild(sellOption);
    });

    setIdInnerHTML("people", player.idlePopulation.toString());
    setIdInnerHTML("soldiers", player.army.totalSoldiers.toString());
    personAssignment();
}

function updateStats() {
    setIdInnerHTML("gold", player.gold.toString());
    setIdInnerHTML("soldiers", player.army.totalSoldiers.toString());
    setIdInnerHTML("people", player.idlePopulation.toString());
    player.farms.forEach((value: Farm, key: Crop) => {
        setIdInnerHTML(Crop[key] + "-stats", value.stockpile.toString() + " " + Crop[key]);
    });
    crops.map((value:Crop) => {
        setIdInnerHTML("farmers-" + Crop[value], player.farms.get(value)?.totalFarmers ?? 0);
    });
    if(player.farms.size > 0) player.orderHarvest();

}
function handleHarvest() {
    player.farms.forEach((value, key) => value.playerHarvest(key));
}
function handleAssignFarmer(crop: Crop) {
    if(player.farms.get(crop) != null && player.idlePopulation > 0){
        player.idlePopulation--;
        player.farms.get(crop)!.totalFarmers++;
    }
}
function handleRemoveFarmer(crop: Crop) {
    if(player.farms.get(crop)!.totalFarmers > 0) {
        player.farms.get(crop)!.totalFarmers--;
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
window.onload = () => {
    window.setInterval(() => {
        timer += tickRate;



        if (timer > visualRate){
            timer -= visualRate;
            // TODO: seperate out function into updateCropStats and updateStats
            // where updateStats would go outside of this if statement
            updateStats();
        }


    }, tickRate);
    loadGUI();
};

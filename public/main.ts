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
const enum DefaultCropPrices {
    Rye = 1,
    Barley,
    Wheat,
}
const crops = [Crop.Wheat, Crop.Barley, Crop.Rye];

const baseCropGrowthRate = 0.5;
const clickGrowthRate = 1;
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
const storeToCrop = new Map(
    [
        [Store.BarleyFarm, Crop.Barley],
        [Store.WheatFarm, Crop.Wheat]
    ]
);
const storePrices = new Map(
    [
        [Store.BarleyFarm, 100],
        [Store.WheatFarm, 1000],
        [Store.Person, 10]
    ]
);
enum PersonType {
    Farmer,
    Soldier
}
// const storeToCrop = new Map(

// );
// Food eaten by one person
const consumptionRate = 0.1;

// A farm
class Farm {

    constructor(public stockpile: number, public totalFarmers = 0){
        console.assert(this.stockpile > 0, "Stockpile is empty");
        console.assert(this.totalFarmers >= 0, "Negative farmers?");
    }

    harvest(crop: Crop){
        const amountGrown = Math.min(this.totalFarmers, this.stockpile);
        //this.stockpile -= this.totalFarmers * consumptionRate;
        if(this.stockpile - this.totalFarmers * consumptionRate > 0) {
            const growthRate = cropGrowthRate.get(crop) ?? baseCropGrowthRate;
            this.stockpile += amountGrown * growthRate;
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
                Math.ceil(farm.totalFarmers * lootMinimum)
            ));
        });

        return {
            gold: opponent.gold - this.totalSoldiers,
            idlePopulation: Math.ceil(opponent.idlePopulation * lootMinimum),
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
const minLoss = 0.3;
const maxLoss = 0.75;
class Kingdom {
    gold = 0;
    army = new Army();
    farms: Map<Crop, Farm> = new Map();
    constructor(public name: string, public idlePopulation: number){}

    attack(opponent: Kingdom) {
        const waitTime = (opponent.strength + this.army.totalSoldiers) / 300;
        window.setTimeout(() => {
            const result = this.army.attack(opponent);
            // TODO: Better inform the player of the result
            if(result == null){
                alert(`The attack against ${opponent.name} failed.`);
                player.army.totalSoldiers = Math.ceil(player.army.totalSoldiers * randFloat(minLoss, maxLoss));
                player.idlePopulation = Math.ceil(player.idlePopulation * randFloat(minLoss, maxLoss));
                player.gold = Math.ceil(player.gold * randFloat(minLoss, maxLoss));
                player.farms.forEach((farm, crop) => {
                    const playerFarm = player?.farms.get(crop);
                    if(playerFarm != null){
                        farm.totalFarmers = Math.ceil(playerFarm?.totalFarmers * randFloat(minLoss, maxLoss));
                        farm.stockpile = Math.ceil(playerFarm?.stockpile * randFloat(minLoss, maxLoss));
                    }
                });

            }
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
                kingdoms.pop();
                let totalFarmers = 0;
                this.farms.forEach((value: Farm) => totalFarmers += value.totalFarmers);
                kingdoms[kingdoms.length - 1].army.totalSoldiers =
                    (player.idlePopulation + player.army.totalSoldiers + totalFarmers) * 2;
                setIdInnerHTML("enemy-kingdom-name", kingdoms[kingdoms.length - 1].name);

            }
        }, waitTime);

    }

    orderHarvest() {
        let totalFarmers = 0;

        this.farms.forEach(
            (farm, crop) => {
                farm.harvest(crop);
                totalFarmers += farm.totalFarmers;
            }
        );

        if(this.farms.has(Crop.Barley)
        && this.farms.get(Crop.Barley)!.stockpile > 0)
        this.farms.get(Crop.Barley)!.stockpile -= this.army.totalSoldiers * consumptionRate;
        else
            console.assert(this.army.totalSoldiers <= 0);

        if(this.farms.get(Crop.Barley)!.stockpile > 0)
        this.farms.get(Crop.Rye)!.stockpile -= totalFarmers * consumptionRate;
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

const kingdomNames = ["Kingdom of the North", "Westros", "Iron Islands", "Mountian and the Vale", "Isles and Rivers", "The Stormlands", "Kingdom of the Reach", "Principality of Dorne"];

const minStartingRye = 50;
const maxStartingRye = 100;
const minStartingPop = 4;
const maxStartingPop = 10;
const baseEnemyPop = 10;
const baseLootGold = 100;
const kingdoms = [
    new Kingdom(promptPlayer("Enter the name of your kingdom"), randInt(minStartingPop, maxStartingPop))
];
kingdomNames.forEach((name: string) => {
    const kingdom = new Kingdom(name, baseEnemyPop);
    kingdom.gold = baseLootGold;
    kingdoms.push(kingdom);
});

// Init player data
const player = kingdoms[0];
player.farms.set(Crop.Rye, new Farm(randInt(minStartingRye, maxStartingRye)));

let sellAmount = "1";

function promptPlayer(message: string): string {
    let result = null;
    while(result == null)
        result = window.prompt(message, "");
    console.log(result);
    setIdInnerHTML("kingdom-title", result);
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
function handleSellAmount(el: HTMLElement) {
    for(const child of document.getElementsByClassName("radio-group"))
        if(child != null){
            const childNode = child.children[0] as HTMLInputElement;
            if(childNode.checked)
                sellAmount = child.children[1].innerHTML;
        }
}
async function onAttack() {
    if(player.name !== kingdoms[kingdoms.length - 1].name)
        player.attack(kingdoms[kingdoms.length - 1]);

}
function handleSell(crop: Crop) {
    if(player.farms.get(crop)!.stockpile >= parseInt(sellAmount)) {
        player.farms.get(crop)!.stockpile -= parseInt(sellAmount);
        player.gold += parseInt(sellAmount) * cropMarket.get(crop)!;
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

        const sellTab = document.getElementById("sell-options");
        const newCrop = document.createElement("button");
        newCrop.className = "btn";
        newCrop.id = Crop[crop] + "-sell-option";
        setElementInnerHTML(newCrop, Crop[crop]);
        newCrop.onclick = () => handleSell(crop);
        sellTab?.appendChild(newCrop);

        document.getElementById(id)?.remove();

        if(player.farms.size == 3) {
            alert("An enemy kingdom is attacking " + player.name);
            setIdInnerHTML("enemy-kingdom-name", kingdoms[kingdoms.length - 1].name);
            document.getElementById("war")!.style.display = "flex";
            document.getElementById("assignment-container-soldier")!.style.display = "flex";
        }
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
        parent.className = "assignment-container";
        document.getElementById("farmer")?.appendChild(parent);

        const farmers = document.createElement("span");
        farmers.id = "farmers-" + Crop[value];
        farmers.className = "total-farmers";
        setElementInnerHTML(farmers, player.farms.get(value)?.totalFarmers ?? 0);
        parent.appendChild(farmers);

        const farmerType = document.createElement("span");
        farmerType.id = "farmer-type-" + Crop[value];
        farmerType.className = "type";
        setElementInnerHTML(farmerType, "  " + Crop[value] + " Farmers ");
        parent.appendChild(farmerType);

        const assignButton = document.createElement("button");
        assignButton.className = "btn a-btn";
        setElementInnerHTML(assignButton, "+");
        assignButton.onclick = () =>  handleAssignPerson(PersonType.Farmer, value);
        parent.appendChild(assignButton);

        const removeButton = document.createElement("button");
        removeButton.className = "btn a-btn";
        removeButton.onclick = () =>  handleRemovePerson(PersonType.Farmer, value);
        setElementInnerHTML(removeButton, "-");
        parent.appendChild(removeButton);
    });
    const parent = document.createElement("div");
    parent.id = "assignment-container-soldier";
    parent.style.display = "none";
    parent.className = "assignment-container";
    document.getElementById("farmer")?.appendChild(parent);

    const soldiers = document.createElement("span");
    soldiers.id = "assignment-soldier";
    soldiers.className = "total-farmers";
    setElementInnerHTML(soldiers, player.army.totalSoldiers ?? 0);
    parent.appendChild(soldiers);

    const soldierText = document.createElement("span");
    soldierText.id = "soldier-text";
    soldierText.className = "type";
    setElementInnerHTML(soldierText, " Soldiers");
    parent.appendChild(soldierText);

    const assignButton = document.createElement("button");
    assignButton.className = "btn a-btn";
    setElementInnerHTML(assignButton, "+");
    assignButton.onclick = () =>  handleAssignPerson(PersonType.Soldier, undefined);
    parent.appendChild(assignButton);

    const removeButton = document.createElement("button");
    removeButton.className = "btn a-btn";
    removeButton.onclick = () =>  handleRemovePerson(PersonType.Soldier, undefined);
    setElementInnerHTML(removeButton, "-");
    parent.appendChild(removeButton);

}

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
        sellOption.className = "btn";
        sellOption.onclick = () => handleSell(key);
        sellOption.id = Crop[key] + "-sell-option";
        sellOptions!.appendChild(sellOption);
    });

    setIdInnerHTML("people", player.idlePopulation.toString());
    setIdInnerHTML("soldiers", player.army.totalSoldiers.toString());
    setIdInnerHTML("enemy-kingdom-name", kingdomNames[kingdomNames.length - 1]);
    console.log(kingdomNames[kingdomNames.length - 1]);

    personAssignment();
}

function updateStats() {
    setIdInnerHTML("gold", player.gold.toString());
    setIdInnerHTML("people", player.idlePopulation.toString());

    player.farms.forEach((value: Farm, key: Crop) => {
        setIdInnerHTML(Crop[key] + "-stats", value.stockpile.toString() + " " + Crop[key]);
    });
    crops.map((value:Crop) => {
        setIdInnerHTML("farmers-" + Crop[value], player.farms.get(value)?.totalFarmers ?? 0);
    });
    setIdInnerHTML("assignment-soldier", player.army.totalSoldiers ?? 0);
    if(player.farms.size > 0) player.orderHarvest();

}
function handleHarvest() {
    let totalFarmers = 0;
    player.farms.forEach((value, key) => {
        value.playerHarvest(key);
        totalFarmers += value.totalFarmers;
    });
    if(player.farms.has(Crop.Barley)
    && player.farms.get(Crop.Barley)!.stockpile > 0)
        player.farms.get(Crop.Barley)!.stockpile -= player.army.totalSoldiers * consumptionRate;
    else
        console.assert(player.army.totalSoldiers <= 0);

    if(player.farms.get(Crop.Barley)!.stockpile > 0)
        player.farms.get(Crop.Rye)!.stockpile -= totalFarmers * consumptionRate;
}

function handleAssignPerson(type: PersonType, crop?: Crop) {
    if(type == PersonType.Farmer) {
        if(player.farms.get(crop!) != null && player.idlePopulation > 0){
            player.idlePopulation--;
            player.farms.get(crop!)!.totalFarmers++;
        }
    }
    else if(type == PersonType.Soldier)
        if(player.idlePopulation > 0) {
            player.army.totalSoldiers++;
            player.idlePopulation--;
        }


}
function handleRemovePerson(type: PersonType, crop?: Crop) {
    console.log(player.army.totalSoldiers);

    if(type == PersonType.Farmer) {
        if(player.farms.get(crop!)!.totalFarmers > 0) {
            player.farms.get(crop!)!.totalFarmers--;
            player.idlePopulation++;
        }
    }
    else if(type == PersonType.Soldier)
        if(player.army.totalSoldiers > 0) {
            player.army.totalSoldiers--;
            player.idlePopulation++;
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

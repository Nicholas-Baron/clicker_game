let timer = 256;
const tickRate = 16;
const visualRate = 256;
const resources = {"gold":0,"pickaxe":1};
const costs = {"pickaxe":15,
    "miner":200,
    "miner_pickaxe":15};
const growthRate = {"pickaxe":1.25,
    "miner":1.25,
    "miner_pickaxe":1.75};

const increments = [{"input":["miner","miner_pickaxe"],
    "output":"gold"}];

const unlocks = {"pickaxe":{"gold":10},
    "miner":{"gold":100},
    "miner_pickaxe":{"miner":1}};

function mineGold(num: number){
    resources["gold"] += num * resources["pickaxe"];
    updateText();
}

function upgradeMinerPickaxe(num: number){
    if (resources["gold"] >= costs["miner_pickaxe"] * num){
        resources["miner_pickaxe"] += num;
        resources["gold"] -= num * costs["miner_pickaxe"];
    
        costs["miner_pickaxe"] *= growthRate["miner_pickaxe"];
    
        updateText();
    }
}

function upgradePickaxe(num){
    if (resources["gold"] >= costs["pickaxe"] * num){
        resources["pickaxe"] += num;
        resources["gold"] -= num * costs["pickaxe"];
    
        costs["pickaxe"] *= growthRate["pickaxe"];
    
        updateText();
    }
}
function hireMiner(num){
    if (resources["gold"] >= costs["miner"] * num){
        if (!resources["miner"]){
            resources["miner"] = 0;
        }
        if (!resources["miner_pickaxe"]){
            resources["miner_pickaxe"] = 1;
        }
        resources["miner"] += num;
        resources["gold"] -= num * costs["miner"];
    
        costs["miner"] *= growthRate["miner"];
    
        updateText();

    
    }
}

/* exported mineGold upgradeMinerPickaxe upgradePickaxe hireMiner */

function updateText(){
    for (const key in unlocks){
        let unlocked = true;
        for (const criterion in unlocks[key]){
            unlocked = unlocked && resources[criterion] >= unlocks[key][criterion];
        }
        if (unlocked){
            for (const element of document.getElementsByClassName("show_" + key)){        
                element.style.display = "block";
            }
        }
    }
    
    for (const key in resources){
        for (const element of document.getElementsByClassName(key)){
            element.innerHTML = resources[key].toFixed(2);
        }
    }
    for (const key in costs){
        for (const element of document.getElementsByClassName(key + "_cost")){
            element.innerHTML = costs[key].toFixed(2);
        }
    }
}


window.setInterval(function(){
    timer += tickRate;

    
    for (const increment of increments){
        let total = 1;
        for (const input of increment["input"]){
            total *= resources[input];
        
        }
        if (total){
            console.log(total);
            resources[increment["output"]] += total / tickRate;
        }
    }
    
    if (timer > visualRate){
        timer -= visualRate;
        updateText();
    }
  

}, tickRate);

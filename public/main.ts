let timer = 256;
const tickRate = 16;
const visualRate = 256;


function updateText() {

}


window.setInterval(() => {
    timer += tickRate;



    if (timer > visualRate){
        timer -= visualRate;
        updateText();
    }


}, tickRate);

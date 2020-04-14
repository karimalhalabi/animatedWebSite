console.log("loading boy1 class...")
var bgImgWidth;
var width = screen.width - 160;
var height = 400;
var backGroundX = 0;
var boy1 = new character("01",width,height,3);

function preload() {
    console.log("loading images");
    //load background image.
    bgImg = loadImage('images/Colleges.jpg');

    //load boy1 images
    boy1.preload();
}


function setup() {
     frameRate(29);
     bgImgWidth = bgImg.width;
     width = screen.width - 160;
     height = 400;
     createCanvas(width, height);
}

function draw() {
    // drawing the background
    drawBackGround();

    // drawing the boy
    boy1.show();
}

function drawBackGround() {
     if (backGroundX < (bgImgWidth - width) * -1) {
         backGroundX = 0;
     }
     image(bgImg, backGroundX--, 0);
}

function keyPressed() {
    if (keyCode === UP_ARROW) {
        console.log("UPUPUP");
        boy1.setCurrentMove = 2;
    }
    else if (keyCode === RIGHT_ARROW) {
        console.log("RightRight");
        boy1.setCurrentMove = 3;
    }
}

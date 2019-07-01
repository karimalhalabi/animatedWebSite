class character {
    constructor(characterDirectory,canvasWidth=300,canvasHeight=400,
                noOfMoves=3, DANCE =false) {
        this.DANCE = DANCE;
        this.characterDirectory = characterDirectory;
        this.canvasHeight = canvasHeight;
        this.canvasWidth = canvasWidth;
        this.chWidth=0;
        this.chHeight=0
        this.X = -150;
        this.Y = canvasHeight - 300;
        this.noOfMoves = noOfMoves - 1;
        this.move = [];
        this.currentMove = [];
        this.spriteSource = [];
        this.spritePrefix = `sprites/ch${this.characterDirectory}`;
        this.mainMove = true;
        this.spritEextention = '.png';
        this.dance;
        this.WALK = true;
        this.Layer = 0;
        this.dance = 0;
        this.timer = 0;
        this.imageIndex=1;


    }
    buildMoves(noOfMoves) {
        let j = 0;
        let suffix = '';
        if (noOfMoves < 0) return true;
        
        // each move has a name and 30 frames
        this.move[noOfMoves] = {
            name: `move0${noOfMoves}`,
            spriteSource: []
        }

        //preloading the moves images for the character from its directories sprite/ch--/move00, move01, move02
        //                                                 
        for (j = 1; j <= 30; j++) {
            if (j < 10) {
                suffix = `/${this.move[noOfMoves].name}/a_0000`;
            } else {
                suffix = `/${this.move[noOfMoves].name}/a_000`;
            }
            this.move[noOfMoves].spriteSource[j] = loadImage(`${this.spritePrefix}${suffix}${j}${this.spritEextention}`);
        }
        this.buildMoves(noOfMoves - 1);
    }

    //this method in called form preload to preload the boys sprites.
    preload() {
        this.buildMoves(this.noOfMoves);
        setTimeout(() => (this.Y = this.canvasHeight - this.currentMove.spriteSource[1].height), 3000);
     // setting the current move
        this.currentMove = this.move[0];
     }

     // This function is to offset sprite Y location
     yLocation(offset)
     {
         this.Y = this.canvasHeight - this.currentMove.spriteSource[1].height - offset;
     }

     // this function switches between different prite moves
     set setCurrentMove(move){
        this.imageIndex = 1;
        switch (move) {
            case 2:
                this.currentMove = this.move[1];
                break;
            case 3:
                this.currentMove = this.move[2];
                break;
            default:
                this.currentMove = this.move[0];
        }
        this.mainMove = false;
    }
    show() {
//    let the temporary move runs for 120 frames

       if ((!this.mainMove) && (this.timer > 120)) {
            this.currentMove = this.move[0];
            this.timer       = 0;
            this.mainMove = true;
        }
        //thirty frames per move
        if (this.imageIndex > 30) this.imageIndex = 1;
        this.timer++;
        //offset the y location
        this.yLocation(-90);

        //draw the sprite
        image(this.currentMove.spriteSource[this.imageIndex++],this.X++,this.Y);
        //repeat
        if(this.X > this.canvasWidth) this.X = -150;
    }
}

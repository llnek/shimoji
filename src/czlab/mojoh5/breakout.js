;(function(window){
  "use strict";

  function defScenes(Mojo) {
    let Z=Mojo.Scenes;
    let S=Mojo.Sprites;
    let T=Mojo.Effects;
    let I=Mojo.Input;
    let _2d= Mojo["2d"];
    let _=Mojo.u, is=Mojo.is;

    let paddleWobble;

    //The size of the grid of blocks
    let gridWidth = 8,
      gridHeight = 2,//5,
      cellWidth = 64,
      cellHeight = 64;

    Z.defScene("splash", {
      poo:function() {
        console.log("poo poo");
      },
      setup: function() {
        let self=this;
        let title = S.sprite("title.png");
        this.insert(title);
        let playButton = I.button(["up.png", "over.png", "down.png"]);
        this.insert(playButton);
        playButton.x = 514;
        playButton.y = 350;
        playButton.mojoh5.press = () => {
          //let music=Mojo.Game.state.get("music");
          //if(!music.playing) music.play();
          let ns= Z.runScene("level1");
          let a= T.slide(this, T.EASE_OUT_CUBIC, 514, 0, 30);
          let b= T.slide(ns, T.EASE_OUT_CUBIC,0, 0, 30);
          a.onComplete= () => { Z.removeScene(this); };
        };
        let titleMessage = S.text("start game", {fontFamily:"puzzler",fontSize:20,fill:"white"}, -200, 300);
        this.insert(titleMessage);
        T.slide(playButton, T.EASE_OUT_CUBIC, 250, 350, 30);
        T.slide(titleMessage, T.EASE_OUT_CUBIC,250, 300, 30);
      }});

    Z.defScene("end",function(){
      let title = S.sprite("title.png");
      this.insert(title);
      let playButton = I.button(["up.png", "over.png", "down.png"]);
      this.insert(playButton);
      playButton.x = 514;
      playButton.y = 350;
      playButton.mojoh5.press = () => {
        let ns= Z.runScene("level1");
        let a= T.slide(this, T.EASE_OUT_CUBIC, 514, 0, 30);
        let b= T.slide(ns, T.EASE_OUT_CUBIC, 0, 0, 30);
        a.onComplete = () => { Z.removeScene(this); };
      };
      let score=Mojo.Game.state.get("score");
      let msg= `Score: ${score}`;
      let titleMessage = S.text(msg, {fontFamily:"puzzler",fontSize:20,fill:"white"}, -200, 300);
      this.insert(titleMessage);
      T.slide(playButton, T.EASE_OUT_CUBIC,250, 350, 30);
      T.slide(titleMessage, T.EASE_OUT_CUBIC,250, 300, 30);

      //Mojo.Game.state.get("music").volume = 0.3;
    });

    Z.defScene("level1",function(){
      //Add a black border along the top of the screen
      let topBorder = S.rectangle(512, 32, "black");
      let self=this;
      this.insert(topBorder);

      let paddle = S.sprite("paddle.png");
      paddle.mojoh5.static=true;
      paddle.mojoh5.step=function(dt){
        paddle.x = Mojo.pointer.x - S.halfSize(paddle)[0];
        //let y=paddle.y;
        _2d.contain(paddle, paddle.parent);
        //paddle.y=y;
      };
      this.insert(paddle);
      S.putBottom(this,paddle, 0, -24);

      //Plot the blocks
      //First create an array that stores references to all the
      //blocks frames in the texture atlas
      let blockFrames = [ "blue.png", "green.png", "orange.png", "red.png", "violet.png" ];
      //Use the `grid` function to randomly plot the
      //blocks in a grid pattern
      let blocks = S.grid(gridWidth, gridHeight, 64, 64, false, 0, 0, () => {
        let r= _.randInt2(0, 4);
        let s= S.sprite(blockFrames[r]);
        s.mojoh5.static=true;
        return s;
      });

      //Position the blocks 32 pixels below the top of the canvas
      blocks.y = 32;
      this.insert(blocks);

      let message = S.text("test", {fontFamily: "puzzler", fontSize: 20, fill: "white"});
      message.x = 8;
      message.y = 8;
      this.insert(message);

      let ball = S.sprite("ball.png",0,0,true);
      //ball.anchor.set(0.5);
      ball.mojoh5.step=function(dt){
        let bounce=Mojo.Game.state.get("bounce");
        S.move(ball);
        //ballHitsWall
        _2d.contain(ball,
          S.extend({x: 0, y: 32, anchor: {x:0,y:0},width: Mojo.canvas.width, height: Mojo.canvas.height}),
          true,
          (col) => {
            bounce.play();
            if(col.has(Mojo.BOTTOM))
              Mojo.Game.state.dec("score");
          });
        //ballHitsPaddle
        if(_2d.collide(ball, paddle)){
          bounce.play();
          if(paddleWobble){
            paddle.scale.set(1,1);
            T.remove(paddleWobble);
          };
          paddleWobble = T.wobble( paddle, 1.3, 1.2, 5, 10, 10, -10, -10, 0.96);
        }

        //ballHitsBlock
        if(true)
        for(let b,z=blocks.children.length,i=z-1; i>=0; --i){
          b=blocks.children[i];
          if(_2d.collide(ball,b)){
            Mojo.Game.state.inc("score");
            bounce.play();
            S.remove(b);
            let sz=S.halfSize(b);
            let g=S.gposXY(b);
            let globalCenterX = g[0] + sz[0];
            let globalCenterY = g[1] + sz[1];
            T.create(
              globalCenterX, globalCenterY,            //x and y position
              () => S.sprite("star.png"),              //Particle function
              self,                                 //The container to add it to
              [0.3,0.3],                                     //Gravity
              true,                                    //Random spacing
              20,                                      //Number of particles
              0, 6.28,                                 //Min/max angle
              12, 24,                                  //Min/max size
              5, 10,                                   //Min/max speed
              0.005, 0.01,                             //Min/max scale speed
              0.005, 0.01,                             //Min/max alpha speed
              0.05, 0.1                                //Min/max rotation speed
            );
          }
        }

        let score=Mojo.Game.state.get("score");
        message.mojoh5.content(`Score: ${score}`);
        if(blocks.children.length===0) {
          Mojo.pause();
          _.timer(() => {
            Z.replaceScene("level1","end");
            Mojo.resume();
          },300);
        }
      };

      this.insert(ball);
      S.putBottom(this,ball, 0, -128);
      ball.mojoh5.vel[0] = 8;//12;
      ball.mojoh5.vel[1] = 5;//8;

      //Add the game sprites to the `gameScene` group
      //gameScene = g.group(paddle, ball, topBorder, blocks, message);

      //Position the `gameScene` offscreen at -514 so that its
      //not visible when the game starts

      this.x = -514;
      this.y=0;

      let music= Mojo.Game.state.get("music");
      //if(!music.playing) music.play();
    });


  }


  window["io.czlab.mojoh5.AppConfig"]={
    assetFiles: ["images/bloxyee/bloxyee.json", "puzzler.otf", "music.wav", "bounce.wav"],
    arena: {width: 512, height: 512},
    scaleToWindow: true,
    load: (Mojo,f,p) => {
      console.log(`breakout- loading: ${f}`);
      console.log(`breakout- progress: ${p}`);
    },
    start: (Mojo) => {
      let G= Mojo.Game;
      G.state.set("bounce", Mojo.sound("bounce.wav"));
      G.state.set("music", Mojo.sound("music.wav"));
      G.state.set("score", 0);
      G.state.get("music").loop = true;
      defScenes(Mojo);
      Mojo.Scenes.runScene("splash");
    }
  };

})(this);



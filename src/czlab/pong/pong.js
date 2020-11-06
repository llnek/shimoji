;(function(window){
  "use strict";

  function scenes(Mojo){
    let _=Mojo.u, is=Mojo.is;
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;
    let _T=Mojo.Effects;
    let _I=Mojo.Input;
    let _2d= Mojo["2d"];
    let paddleWobble;

    _Z.defScene("Bg",{
      setup(){
        let s= _S.drawBody((g)=>{
          g.lineStyle(4,0xffffff);
          g.beginFill(0);
          g.drawRect(0,0,Mojo.canvas.width-4,Mojo.canvas.height-4);
          g.moveTo(0,Mojo.canvas.height/2);
          g.lineTo(Mojo.canvas.width,Mojo.canvas.height/2);
          //g.drawEllipse(Mojo.canvas.width/2,Mojo.canvas.height/2,100,50);
          g.drawCircle(Mojo.canvas.width/2,Mojo.canvas.height/2,32);
          g.endFill();
        });
        this.insert(s);
      }
    });

    _Z.defScene("PlayGame", {
      _initPlayer(){
        let paddle = this.player = _S.sprite("paddle.png");
        //paddle= 96x18
        paddle.mojoh5.static=true;
        paddle.mojoh5.step=function(dt){
          paddle.x = Mojo.pointer.x - _S.halfSize(paddle)[0];
          _2d.contain(paddle, paddle.parent);
        };
        this.insert(paddle);
        _S.pinBottom(this,paddle, 0, -24);
      },
      _initAI(){
        let paddle = this.robot = _S.sprite("paddle.png");
        let self=this;
        paddle.mojoh5.static=true;
        paddle.mojoh5.step=function(dt){
          paddle.x = self.ball.x - _S.halfSize(paddle)[0];
          _2d.contain(paddle, paddle.parent);
        };
        this.insert(paddle);
        paddle.x=0;
        paddle.y=6;
      },
      setup(){
        let ball= this.ball = _S.sprite("ball.png");
        let bounce=Mojo.state.get("bounce");
        let self=this;
        this._initPlayer();
        this._initAI();
        ball.mojoh5.step=function(dt){
          _S.move(ball);
          _2d.contain(ball, Mojo.mockStage(),
                      true,
                      (col) => {
                        //bounce.play();
                        if(col.has(Mojo.BOTTOM))
                          Mojo.state.dec("score");
          });
          //ballHitsPaddle
          if(_2d.collide(ball, self.player)){
            bounce.play();
            if(self.playerWobble){
              self.player.scale.set(1,1);
              _T.remove(self.playerWobble);
            };
            self.playerWobble = _T.wobble(self.player, 1.3, 1.2, 5, 10, 10, -10, -10, 0.96);
          }
          else if(_2d.collide(ball, self.robot)){
            bounce.play();
            if(self.robotWobble){
              self.robot.scale.set(1,1);
              _T.remove(self.robotWobble);
            };
            self.robotWobble = _T.wobble(self.robot, 1.3, 1.2, 5, 10, 10, -10, -10, 0.96);
          }
          let score=Mojo.state.get("score");
          //message.mojoh5.content(`Score: ${score}`);
        };
        this.insert(ball);
        _S.pinBottom(this,ball, 0, -128);
        ball.mojoh5.vel[0] = 8;//12;
        ball.mojoh5.vel[1] = 5;//8;
        //let music= Mojo.Game.state.get("music");
        //if(!music.playing) music.play();
      }
    });
  }

  function setup(Mojo){
    Mojo.state.set({
      bounce: Mojo.sound("bounce.wav"),
      //music:Mojo.sound("music.wav"),
      score:0
    });
    scenes(Mojo);
    Mojo.Scenes.runScene("Bg");
    Mojo.Scenes.runScene("PlayGame");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["ball.png", "puzzler.otf", "paddle.png", "bounce.wav"],
      arena: {width: 512, height: 512},
      scaleToWindow: true,
      start: setup
    });
  });

})(this);



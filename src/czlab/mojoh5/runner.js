(function(window){
  "use strict";

  function scenes(Mojo){
    let _=Mojo.u;
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input;
    let PStates={
      walk_right: [0,10],
      jump_right: 13,
      duck_right: 15
    }
    function Player(view){
      let s= _S.sprite(_S.frames("player.png",72,97,0,0,0,1));
      let floor=view.parent.getChildById("floor");
      _S.centerAnchor(s);
      s.mojoh5.gravity[1]=2000;
      s.x= 40;
      s.y= floor.y-s.height/2;
      s._mode=null;
      view.addChild(s);
      let speed= 500;
      let jump= -700;
      let landed=1;
      let upArrow = _I.keyboard(38);
      let downArrow = _I.keyboard(40);

      upArrow.press = () => {
        if(landed > 0) { s.mojoh5.vel[1] = jump; }
        landed=0;
        s.mojoh5.showFrame(PStates.jump_right);
        s._mode=PStates.jump_right;
      };
      upArrow.release = () => {
        s._mode=null;
      };
      downArrow.press = () => {
        s.mojoh5.showFrame(PStates.duck_right);
        s._mode=PStates.duck_right;
      };
      downArrow.release = () => {
        s._mode=null;
      };
      //this.p.points = this.p.standingPoints;
      Mojo.addMixin(s,"2d");
      s.mojoh5.getContactPoints=function(){
        return s._mode==PStates.duck_right ? [[-16,44], [-23,35], [-23,-10], [23,-10], [23,35], [16,44]]
                                           : [[-16,44], [-23,35], [-23,-48], [23,-48], [23,35], [16,44]]
      };
      s.mojoh5.step=function(dt){
        s.mojoh5.vel[0] += (speed - s.mojoh5.vel[0])/4;
        if(s.mojoh5.vel[1]>0 && _S.bottomSide(s) > floor.y){
          s.y = floor.y - s.height/2;
          landed = 1;
          s.mojoh5.vel[1] = 0;
        }else{
          //landed = 0;
        }
        //this.p.points = this.p.standingPoints;
        if(landed) {
          if(false){//Mojo.inputs.get('down'))
            //f_anim.enact("duck_right");
            //this.p.points = this.p.duckingPoints;
          }else{
          }
        } else {
          //f_anim.enact("jump_right");
        }

        if(landed && s._mode === null){
          s.mojoh5.playFrames(PStates.walk_right);
          s._mode=PStates.walk_right;
        }
      };
      return s;
    }
    //const levels = [ 565, 540, 500, 450 ];
    const levels = [ 0,25,65,100 ];
    function Box(scene,player){
      let frames=_S.frames("crates.png",32,32,0,0,0,0);
      _.assert(frames.length===2);
      let theta= (300*2*Math.PI/360 * Math.random() + 200*2*Math.PI/360) * (Math.random() < 0.5 ? 1 : -1);
      let floor=scene.getChildById("floor");
      let b=_S.sprite(frames[Math.random() < 0.5 ? 1 : 0]);
      _S.setScale(b,2,2);
      _S.centerAnchor(b);
      b.x= /*player.x +*/ Mojo.canvas.width + 50;
      b.y= floor.y - levels[Math.floor(Math.random() * 4)] - b.height/2;
      b.mojoh5.vel[0]= -800 + 200 * Math.random();
      b.mojoh5.vel[1]=0;
      b.mojoh5.acc[1]= 0;
      let base=floor.y-b.height/2;
      b.mojoh5.collide=function(col){
        b.alpha = 0.5;
        b.mojoh5.vel[0] = 200;
        b.mojoh5.vel[1] = -300;
        b.mojoh5.acc[1] = 400;
      };
      b.mojoh5.step=function(dt){
        b.x += b.mojoh5.vel[0] * dt;
        b.mojoh5.vel[1] += b.mojoh5.acc[1] * dt;
        b.y += b.mojoh5.vel[1] * dt;
        if(b.y != base) {
          b.rotation += theta * dt;
        }
        if(b.y > 800) {
          _S.remove(b);
        }else{
          Mojo["2d"].hit(player,b);
        }
      };
      Mojo.EventBus.sub(["hit",b],"collide",b.mojoh5);
      return b;
    }
    function BoxThrower(scene,p){
      let b= {
        launchDelay: 0.75,
        launchRandom: 1,
        launch: 2,
        update(dt){
          this.launch -= dt;
          if(this.launch < 0) {
            scene.insert(Box(scene,p));
            this.launch = this.launchDelay + this.launchRandom * Math.random();
          }
        }
      };
      Mojo.addBgTask(b);
    }

    _Z.defScene("level1",{
      setup(){
        let wall = this.bgWall = _S.tilingSprite("background-wall.png",Mojo.canvas.width,Mojo.canvas.height);
        let floor = this.bgFloor = _S.tilingSprite("background-floor.png",Mojo.canvas.width);
        floor.y=Mojo.canvas.height-floor.height;
        wall.mojoh5.uuid="wall";
        floor.mojoh5.uuid="floor";
        this.insert(wall);
        this.insert(floor);
        let V= this.view= _S.container();
        this.insert(V);
        let p= this.player= Player(V);
        BoxThrower(this,p);
        let stage=Mojo.mockStage();
        this.camera = Mojo["2d"].worldCamera(V,stage.width,stage.height, Mojo.canvas);
        Mojo.EventBus.sub(["canvas.resize"],"rsize",this);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      rsize(){
        this.bgWall.width=Mojo.canvas.width;
        this.bgWall.height=Mojo.canvas.height;
        this.bgFloor.width=Mojo.canvas.width;
        this.bgFloor.height=Mojo.canvas.height/4;
        this.bgFloor.y=Mojo.canvas.height - this.bgFloor.height;
        this.player.y= this.bgFloor.y - this.player.height/2;
      },
      postUpdate(dt){
        this.bgWall.tilePosition.x -= 4;
        //this.bgWall.tilePosition.y += 1;
        this.bgFloor.tilePosition.x -= 8;
        this.camera.centerOver(this.player.x+300,undefined);// this.player.y);//400);
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["player.png", "background-wall.png", "background-floor.png", "crates.png"],
      arena: {},
      scaleToWindow: "max",
      start: setup
    });
  });

})(this);



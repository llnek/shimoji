(function(window){
  "use strict";
  function scenes(Mojo){
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_T=Mojo.Tiles;
    let _=Mojo.u;
    function Collectable(){
      let c= _S.sprite();
      s.mojoh5.sensor= true;
        //Mojo.EventBus.sub("sensor",this);
      // When a Collectable is hit.
      p.mojoh5.sensor=function(col){
        /*
        if (this.p.amount) {
          colObj.p.score += this.p.amount;
          Mojo.runScene('hud', 3, colObj.p);
        }
        Mojo.audio.play('coin.mp3');
        this.scene.remove(this);//dispose();
        */
      };
    }
    function Door(){
      let d= _S.sprite();
      d.mojoh5.sensor= true;
      //Mojo.EventBus.sub("sensor",this);
      d.mojoh5.findLinkedDoor=function(){
        //return this.scene.find(this.p.link);
      };
      // When the player is in the door.
      d.mojoh5.onSensor=function(col){
        // Mark the door object on the player.
        colObj.p.door = this;
      };
    }
    function Heart(){
      let h= _S.sprite();
      h.mojoh5.onSensor=function(col){
        /*
        if(this.p.amount) {
          colObj.p.strength = Math.max(colObj.p.strength + 25, 100);
          Mojo.runScene('hud', 3, colObj.p);
          Mojo.audio.play('heart.mp3');
        }
        this.scene.remove(this);//dispose();
        */
      };
    }

    function Fly(){
    //enemy
    }
    function Slime(){
          //w: 55,
          //h: 34
    }
    function Snail(){
          //w: 55,
          //h: 36
    }
    function Enemy(){
      let e= _S.sprite();
      e.mojoh5.vel[0]=50;
      Mojo.addMixin(e,"2d", "aiBounceX");
      e.aiBounceX.defaultDirection=Mojo.D_LEFT;
      //Mojo.EventBus.sub("bump.top",this,"die",this);
      //Mojo.EventBus.sub("hit.sprite",this,"hit",this);
      e.mojoh5.step=function(dt){
        /*
        if(this.p.dead) {
          Mojo.delf(this,"2d,aiBounce");
          this.p.deadTimer++;
          if (this.p.deadTimer > 24) {
            // Dead for 24 frames, remove it.
            this.scene.remove(this);//dispose();
          }
          return;
        }
        var p = this.p;
        this.motion(dt);
        Mojo.getf(this,"animation").enact('walk');
        */
      };
      e.hit=function(col){
        /*
        if(_.inst(Player,col.obj) && !col.obj.p.immune && !this.p.dead) {
          Mojo.EventBus.pub('enemy.hit', col.obj,{"enemy":this,"col":col});
          Mojo.audio.play('hit.mp3');
        }
        */
      };
      e.die=function(col){
        /*
        if(_.inst(Player,col.obj)) {
          Mojo.audio.play('coin.mp3');
          this.p.vx=this.p.vy=0;
          Mojo.getf(this,"animation").enact('dead');
          this.p.dead = true;
          var that = this;
          col.obj.p.vy = -300;
          this.p.deadTimer = 0;
        }
        */
      };
    }
    //kenl
    function Player(scene,world){
      let wall= world.tiled.getObject("Collision");
      let grp=world.tiled.getObject("Sprites");
      let PStates={ walk_right: [0,10], jump_right: 13, duck_right: 15 };
      let _mode=null;
      let p;
      grp.tiled.objects.forEach(o=>{
        let tsinfo=world.tiled.getTSInfo(o.gid);
        let props=world.tiled.tileProps[o.gid];
        let C=props["Class"];
        if(C==="Player"){
          p=_S.sprite(_S.frames(tsinfo.image, tsinfo.tilewidth,tsinfo.tileheight));
          p.x=o.x-210;
          p.y=o.y-72;
        }
      });
      world.addChild(p);
      p.anchor.set(0.5);
      p.mojoh5.gravity[1]=500;
      p.mojoh5.strength= 100;
      p.mojoh5.speed= 300;
      p.mojoh5.score= 0;
      //this.p.points = this.p.standingPoints;
      Mojo.addMixin(p,"2d","platformer");
      p.mojoh5.showFrame(1);
      p.platformer.jumpSpeed= -400;
      p.mojoh5.direction= Mojo.RIGHT;
      let upArrow = _I.keyboard(_I.keyUP);
      let downArrow = _I.keyboard(_I.keyDOWN);
      let leftArrow = _I.keyboard(_I.keyLEFT);
      let rightArrow = _I.keyboard(_I.keyRIGHT);
      leftArrow.press=function(){
        p.scale.x = -1;
        if(_mode===null)
          p.mojoh5.playFrames(PStates.walk_right);
      };
      rightArrow.press=function(){
        p.scale.x = 1;
        if(_mode===null)
          p.mojoh5.playFrames(PStates.walk_right);
      }
      leftArrow.release=function(){
        p.mojoh5.showFrame(1);
        _mode=null;
      };
      rightArrow.release=function(){
        p.mojoh5.showFrame(1);
        _mode=null;
      }
      upArrow.press=function(){
        p.mojoh5.showFrame(PStates.jump_right);
        _mode=PStates.jump_right;
      }
      upArrow.release=function(){
        _mode=null;
      }
      downArrow.press=function(){
        p.mojoh5.showFrame(PStates.duck_right);
        _mode=PStates.duck_right;
      }
      downArrow.release=function(){
        p.mojoh5.showFrame(1);
        _mode=null;
      }


      //Mojo.EventBus.sub(["bump.top",p],"breakTile");
      //Mojo.EventBus.sub(["sensor.tile",p],"checkLadder");
      //Mojo.EventBus.sub(["enemy.hit",p],"enemyHit");
      //Mojo.EventBus.sub(["jump",p]);
      //Mojo.EventBus.sub(["jumped",p]);
      //Mojo.EventBus.sub(["down",Mojo.input,"checkDoor",this]]);
      p.mojoh5.XgetContactPoints=function(){
        return _mode==PStates.duck_right ? [[-16,44], [-23,35], [-23,-10], [23,-10], [23,35], [16,44]]
                                         : [[-16,44], [-23,35], [-23,-48], [23,-48], [23,35], [16,44]]
      };
      p.jump=function(col){
        /*
        if (!obj.p.playedJump) {
          Mojo.audio.play('jump.mp3');
          obj.p.playedJump = true;
        }*/
      };
      p.jumped=function(col){
        //obj.p.playedJump = false;
      };
      p.checkLadder=function(col){
        /*
        if(colObj.p.ladder) {
          this.p.onLadder = true;
          this.p.ladderX = colObj.p.x;
        }
        */
      };
      p.checkDoor=function(){
        //this.p.checkDoor = true;
      };
      p.resetLevel=function(){
        //Mojo.resetGame();
        //Mojo.runScene("level1");
        //this.p.strength = 100;
        //Mojo.getf(this,"tween").animate({opacity: 1});
        //Mojo.runScene('hud', 3, this.p);
      };
      p.enemyHit=function(data){
        /*
        var col = data.col;
        var enemy = data.enemy;
        this.p.vy = -150;
        if (col.normalX == 1) {
          // Hit from right
          this.p.x -=15;
          this.p.y -=15;
        }
        else {
          // Hit from left
          this.p.x +=15;
          this.p.y -=15;
        }
        this.p.immune = true;
        this.p.immuneTimer = 0;
        this.p.immuneOpacity = 1;
        this.p.strength -= 25;
        Mojo.runScene('hud', 3, this.p);
        if (this.p.strength == 0) {
          this.resetLevel();
        }
        */
      };
      p.continueOverSensor=function(){
        /*
        let a= Mojo.getf(this,"animation"),
            pf= Mojo.getf(this,"platformer");
        this.p.vy = 0;
        a.enact((this.p.vx !== 0 ? "walk_" : "stand_") + Mojo.dirToStr(this.p.direction));
        */
      };
      p.breakTile=function(col){
        /*
        if(_.inst(Mojo.TileLayer,col.obj)) {
          if(col.tile == 24) { col.obj.setTile(col.tileX,col.tileY, 36); }
          else if(col.tile == 36) { col.obj.setTile(col.tileX,col.tileY, 24); }
        }
        Mojo.audio.play('coin.mp3');
        */
      };
      p.mojoh5.collide=function(){
        for(let t,w,i=0;i<wall.children.length;++i){
          w=wall.children[i];
          t=w.tiled;
          if(t.ts==="Tiles"){
            if(t.id===81 || t.id===69 || t.id===40 || t.id===52)
              continue;
          }
          Mojo["2d"].hit(p,w);
        }
      };
      p.mojoh5.step=function(dt){
        p["2d"].motion(dt);
        p["platformer"].motion(dt);
        if(p.mojoh5.vel[0]===0 && p.mojoh5.vel[1]===0){
          //if(_.feq0(p.mojoh5.vel[0]) && _.feq0(p.mojoh5.vel[1]))
          if(!_I.keyDown(_I.keyDOWN))
            p.mojoh5.showFrame(1);
        }
        /*
        let processed = false,
        if (this.p.immune) {
          // Swing the sprite opacity between 50 and 100% percent when immune.
          if ((this.p.immuneTimer % 12) == 0) {
            var opacity = (this.p.immuneOpacity == 1 ? 0 : 1);
            f_tween.animate({"opacity":opacity}, 0);
            this.p.immuneOpacity = opacity;
          }
          this.p.immuneTimer++;
          if (this.p.immuneTimer > 144) {
            // 3 seconds expired, remove immunity.
            this.p.immune = false;
            f_tween.animate({"opacity": 1}, 1);
          }
        }

        if(this.p.onLadder) {
          this.p.gravity = 0;

          if(Mojo.inputs.get('up')) {
            this.p.vy = -this.p.speed;
            this.p.x = this.p.ladderX;
            f_anim.enact("climb");
          } else if(Mojo.inputs.get('down')) {
            this.p.vy = this.p.speed;
            this.p.x = this.p.ladderX;
            f_anim.enact("climb");
          } else {
            this.continueOverSensor();
          }
          processed = true;
        }

        if(!processed && this.p.door) {
          this.p.gravity = 1;
          if(this.p.checkDoor && f_plat.landed > 0) {
            // Enter door.
            this.p.y = this.p.door.p.y;
            this.p.x = this.p.door.p.x;
            f_anim.enact('climb');
            this.p.toDoor = this.p.door.findLinkedDoor();
            processed = true;
          }
          else if (this.p.toDoor) {
            // Transport to matching door.
            this.p.y = this.p.toDoor.p.y;
            this.p.x = this.p.toDoor.p.x;
            f_view.centerOn(this.p.x, this.p.y);
            this.p.toDoor = false;
            f_view.follow(this);
            processed = true;
          }
        }

        if(!processed) {
          this.p.gravity = 1;

          if(Mojo.inputs.get('down') && !this.p.door) {
            this.p.ignoreControls = true;
            f_anim.enact("duck_" + Mojo.dirToStr(this.p.direction));
            if(f_plat.landed > 0) {
              this.p.vx = this.p.vx * (1 - dt*2);
            }
            this.p.points = this.p.duckingPoints;
          } else {
            this.p.ignoreControls = false;
            this.p.points = this.p.standingPoints;

            if(this.p.vx > 0) {
              if(f_plat.landed > 0) {
                f_anim.enact("walk_right");
              } else {
                f_anim.enact("jump_right");
              }
              this.p.direction = Mojo.D_RIGHT;
            } else if(this.p.vx < 0) {
              if(f_plat.landed > 0) {
                f_anim.enact("walk_left");
              } else {
                f_anim.enact("jump_left");
              }
              this.p.direction = Mojo.D_LEFT;
            } else {
              f_anim.enact("stand_" + Mojo.dirToStr(this.p.direction));
            }

          }
        }

        this.p.onLadder = false;
        this.p.door = false;
        this.p.checkDoor = false;



        if(this.p.y > 2000) {
          this.resetLevel();
        }
        */
      };

      return p;
    }

    _Z.defScene("hud",{
      setup(){
        let container = this.insert(new Mojo.UI.Container({
          x: 50, y: 0
        }));
        let label = container.insert(new Mojo.UI.Text({x:200, y: 20,
          label: "Score: " + this.o.score, color: "white" }));
        let strength = container.insert(new Mojo.UI.Text({x:50, y: 20,
          label: "Health: " + this.o.strength + '%', color: "white" }));
        container.fit(20);
      }
    });

    _Z.defScene("level1",{
      setup(){
        //kenl
        let world= this.world= _T.makeTiledWorld("mario.json");
        let p=this.player=Player(this,world);
        let cam= this.camera= Mojo["2d"].worldCamera(world,world.tiled.tiledWidth,world.tiled.tiledHeight,Mojo.canvas);
        this.insert(world);
        this.camera.centerOver(70*5,70*10);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        if(this.player.y > 1000){
          //this.camera.unfollow();
        }else{
          this.camera.follow(this.player);
        }
      }
    });

    _Z.defScene("bg",{
      setup(){
        let bg=this.bg=_S.tilingSprite("bg.png",Mojo.canvas.width,Mojo.canvas.height);
        this.insert(bg);
      },
      postUpdate(){
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("bg");
    Mojo.Scenes.runScene("level1");
  }
  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["mario.json",
         "fire.mp3", "jump.mp3", "heart.mp3", "hit.mp3", "coin.mp3",
         "bg.png","bg_castle.png","collectables.png","doors.png","enemies.png","blocks.png", "player.png"],
      scaleToWindow:"max",
      start: setup
    })
  });
})(this);

/*
      walk_right: { frames: [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip: false, loop: true },
      walk_left: { frames:  [0,1,2,3,4,5,6,7,8,9,10], rate: 1/15, flip:"x", loop: true },
      jump_right: { frames: [13], rate: 1/10, flip: false },
      jump_left: { frames:  [13], rate: 1/10, flip: "x" },
      stand_right: { frames:[14], rate: 1/10, flip: false },
      stand_left: { frames: [14], rate: 1/10, flip:"x" },
      duck_right: { frames: [15], rate: 1/10, flip: false },
      duck_left: { frames:  [15], rate: 1/10, flip: "x" },
      climb: { frames:  [16, 17], rate: 1/3, flip: false }
      */


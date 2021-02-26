/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(window){

  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_T=Mojo.Tiles,_2d=Mojo["2d"];
    let {ute:_,is,EventBus}=Mojo;
    let _E=EventBus;
    let CZ={};
    let _score=0;

    CZ.Collectable=function(world,ts,ps){
      let s= _S.sprite(_S.frames(ts.image,ts.tilewidth,ts.tileheight)[ps.id]);
      let mo=s.m5;
      let signal=[["sensor",s],"onSensor",mo];
      mo.uuid= mo.uuid+"_"+ps["sprite"];
      s.x=ps.x;
      s.y=ps.y-72;
      mo.sensor= true;
      mo.onSensor=function(col){
        Mojo.sound("coin.mp3").play();
        _S.remove(s);
        _E.unsub.apply(_E,signal);
        if(ps.amount){
          _score = _score + (+ps.amount);
        }
      };
      _E.sub.apply(_E,signal);
      world.addChild(s);
      return s;
    };

    CZ.Door=function(world,ts,ps){
      let s= _S.sprite(_S.frames(ts.image,ts.tilewidth,ts.tileheight)[ps.id]);
      let mo=s.m5;
      let signal=[["sensor",s],"onSensor",mo];
      s.x=ps.x;
      s.y=ps.y-72;
      mo.sensor= true;
      mo.findLinkedDoor=function(){
        //return this.scene.find(this.p.link);
      };
      // When the player is in the door.
      mo.onSensor=function(col){
        // Mark the door object on the player.
        //colObj.p.door = this;
      };
      world.addChild(s);
      _E.sub.apply(_E,signal);
      return s;
    };

    CZ.Enemy=function(world,ts,ps){
      let s= _S.sprite(_S.frames(ts.image,ts.tilewidth,ts.tileheight)[ps.id]);
      let mo=s.m5;
      let wall= _T.getTileLayer(world,"Collision");
      mo.uuid= mo.uuid+"_"+ps["sprite"];
      s.x=ps.x;
      s.y=ps.y-72;
      let signals=[[["bump.top",s],"die",mo],
                   [["hit",s],"hit",mo]];
      _S.addMixin(s,"2d", "aiBounce");
      mo.speed=150;
      mo.vel[0]=-150;
      mo.deadTimer=0;
      s.aiBounce.dftDirection=Mojo.LEFT;
      mo.collide=function(){
        wall.children.forEach(w=> _2d.hit(s,w))
      };
      mo.die=function(col){
        if(col.B.m5.uuid=="player"){
          Mojo.sound("coin.mp3").play();
          mo.vel[0]=mo.vel[1]=0;
          mo.dead=true;
          col.B.m5.vel[1] = -300;
          mo.deadTimer = 0;
        }
      };
      mo.hit=function(col){
        if(!mo.dead && col.B.m5.uuid=="player" && !col.B.m5.immune){
          _E.pub(["enemy.hit", col.B],{"enemy":s,"col":col});
          Mojo.sound("hit.mp3").play();
        }
      };
      mo.step=function(dt){
        s["2d"].motion(dt);
        if(mo.dead){
          s.aiBounce.dispose();
          s["2d"]=null;
          mo.deadTimer++;
          if(mo.deadTimer > 24){
            // Dead for 24 frames, remove it.
            _S.remove(s);
          }
        }else{
          //Mojo.getf(this,"animation").enact('walk');
        }
      };
      signals.forEach(s=>_E.sub.apply(_E,s));
      world.addChild(s);
      return s;
    };

    CZ.Player=function(world,ts,ps){
      let PStates={ walk_right: [0,10], jump_right: 13, duck_right: 15 };
      let p=_S.sprite(_S.frames(ts.image, ts.tilewidth,ts.tileheight));
      let wall=_T.getTileLayer(world,"Collision");
      let scene=world.parent;
      let mo=p.m5;
      scene.player=p;
      p.x=ps.x-210;
      p.y=ps.y-72;
      let _mode=null;
      world.addChild(p);
      p.anchor.set(0.5);
      p.m5.gravity[1]=500;
      p.m5.strength= 100;
      p.m5.speed= 300;
      p.m5.score= 0;
      _S.addMixin(p,"2d","platformer");
      p.m5.showFrame(1);
      p.platformer.jumpSpeed= -400;
      p.m5.direction= Mojo.RIGHT;
      let leftArrow = _I.keybd(_I.keyLEFT, ()=>{
        p.scale.x = -1;
        if(_mode===null)
          p.m5.playFrames(PStates.walk_right);
      }, ()=>{
        p.m5.showFrame(1);
        _mode=null;
      });

      let rightArrow = _I.keybd(_I.keyRIGHT, ()=>{
        p.scale.x = 1;
        if(_mode===null)
          p.m5.playFrames(PStates.walk_right);
      }, ()=>{
        p.m5.showFrame(1);
        _mode=null;
      });

      let upArrow = _I.keybd(_I.keyUP, ()=>{
        p.m5.showFrame(PStates.jump_right);
        _mode=PStates.jump_right;
      }, ()=>{
        _mode=null;
      });

      let downArrow = _I.keybd(_I.keyDOWN, ()=>{
        p.m5.showFrame(PStates.duck_right);
        _mode=PStates.duck_right;
      }, ()=>{
        p.m5.showFrame(1);
        _mode=null;
      });

      let signals=[[["bump.top",p],"breakTile"],
                   [["sensor.tile",p],"checkLadder"],
                   [["enemy.hit",p],"enemyHit"],
                   [["jump",p]],
                   [["jumped",p]],
                   [["down",Mojo.input],"checkDoor",p]];
      p.m5.getContactPoints=function(){
        return _mode==PStates.duck_right ? [[-16,44], [-23,35], [-23,-10], [23,-10], [23,35], [16,44]]
                                         : [[-16,44], [-23,35], [-23,-48], [23,-48], [23,35], [16,44]]
      };
      p.jumped=function(col){ mo.playedJump = false; };
      p.checkDoor=function(){ mo.checkDoor = true; };
      p.resetLevel=function(){ };
      p.jump=function(col){
        if(!mo.playedJump){
          Mojo.sound("jump.mp3").play();
          mo.playedJump = true;
        }
      };
      p.checkLadder=function(col){
        if(col.B.tiled.ladder){
          mo.onLadder = true;
          mo.ladderX = col.B.x;
        }
      };
      p.enemyHit=function(data){
        let col = data.col;
        let enemy = data.enemy;
        mo.vel[1] = -150;
        if(col.overlapN[0] === 1){
          // Hit from right
          mo.x -=15;
          mo.y -=15;
        }else{
          // Hit from left
          mo.x +=15;
          mo.y -=15;
        }
        mo.immune = true;
        mo.immuneTimer = 0;
        mo.immuneOpacity = 1;
        mo.strength -= 25;
        //Mojo.runScene('hud', 3, this.p);
        if(mo.strength === 0){
          p.resetLevel();
        }
      };
      p.continueOverSensor=function(){
        mo.vel[1] = 0;
        //a.enact((this.p.vx !== 0 ? "walk_" : "stand_") + Mojo.dirToStr(this.p.direction));
      };
      p.breakTile=function(col){
        /*
        if(_.inst(Mojo.TileLayer,col.obj)) {
          if(col.tile == 24) { col.obj.setTile(col.tileX,col.tileY, 36); }
          else if(col.tile == 36) { col.obj.setTile(col.tileX,col.tileY, 24); }
        }
        */
        Mojo.sound("coin.mp3").play();
      };
      p.m5.collide=function(){
        for(let t,w,i=0;i<wall.children.length;++i){
          w=wall.children[i];
          t=w.tiled;
          if(t.ts.name=="Tiles"){
            if(t.id===81 || t.id===69 || t.id===40 || t.id===52)
              continue;
          }
          _2d.hit(p,w);
        }
      };
      p.m5.step=function(dt){
        p["2d"].motion(dt);
        p["platformer"].motion(dt);
        if(p.m5.vel[0]===0 && p.m5.vel[1]===0){
          //if(_.feq0(p.m5.vel[0]) && _.feq0(p.m5.vel[1]))
          if(!_I.keyDown(_I.keyDOWN))
            p.m5.showFrame(1);
        }
        let processed = false;
        if(mo.immune){
          //Swing the sprite opacity between 50 and 100% percent when immune.
          if((mo.immuneTimer % 12) === 0){
            let opacity = (mo.immuneOpacity === 1 ? 0 : 1);
            //f_tween.animate({"opacity":opacity}, 0);
            mo.immuneOpacity = opacity;
          }
          mo.immuneTimer++;
          if(mo.immuneTimer > 144){
            // 3 seconds expired, remove immunity.
            mo.immune = false;
            //f_tween.animate({"opacity": 1}, 1);
          }
        }
        if(mo.onLadder){
          mo.gravity[0]=0; mo.gravity[1] = 0;
          if(_I.keyDown(_I.keyUP)){
            mo.vel[1] = -mo.speed;
            p.x = mo.ladderX;
            //f_anim.enact("climb");
          }else if(_I.keyDown(_I.keyDOWN)){
            mo.vel[1] = mo.speed;
            p.x = mo.ladderX;
            //f_anim.enact("climb");
          }else{
            p.continueOverSensor();
          }
          processed = true;
        }
        if(!processed && mo.door){
          mo.gravity[0]=0;mo.gravity[1] = 500;
          if(mo.checkDoor && p.platformer.landed > 0){
            // Enter door.
            p.y = mo.door.y;
            p.x = mo.door.x;
            //f_anim.enact('climb');
            mo.toDoor = mo.door.findLinkedDoor();
            processed = true;
          }else if(mo.toDoor){
            // Transport to matching door.
            p.y = mo.toDoor.y;
            p.x = mo.toDoor.x;
            //f_view.centerOn(this.p.x, this.p.y);
            mo.toDoor = false;
            //f_view.follow(this);
            processed = true;
          }
        }
        if(!processed){
          mo.gravity[0] =0; mo.gravity[1] = 500;
          if(_I.keyDown(_I.keyDOWN) && !mo.door){
            mo.ignoreControls = true;
            //f_anim.enact("duck_" + Mojo.dirToStr(this.p.direction));
            if(p.platformer.landed > 0){
              mo.vel[0] *= (1 - dt*2);
            }
            //this.p.points = this.p.duckingPoints;
          }else{
            mo.ignoreControls = false;
            //this.p.points = this.p.standingPoints;
            if(mo.vel[0] > 0){
              if(p.platformer.landed > 0){
                //f_anim.enact("walk_right");
              }else{
                //f_anim.enact("jump_right");
              }
              mo.direction = Mojo.RIGHT;
            }else if(mo.vel[0] < 0){
              if(p.platformer.landed > 0){
                //f_anim.enact("walk_left");
              }else{
                //f_anim.enact("jump_left");
              }
              mo.direction = Mojo.LEFT;
            }else{
              //f_anim.enact("stand_" + Mojo.dirToStr(this.p.direction));
            }
          }
        }
        mo.onLadder = false;
        mo.door = false;
        mo.checkDoor = false;
        if(p.y > 2000) {
          //p.resetLevel();
        }
      };
      signals.forEach(s=>_E.sub.apply(_E,s));
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
        let world= this.world= _T.tiledWorld("mario.json");
        this.insert(world);
        let g=_T.getObjectGroup(world,"Sprites");
        g.tiled.objects.forEach(o=>{
          let ts=_T.getTSInfo(world,o.gid);
          let ps=world.tiled.tileProps[o.gid];
          let id=ps.id;
          let os=_.inject({},ps,o);
          os.id=id;
          let c= ps["Class"];
          if(c==="Snail"||c==="Slime"||c==="Fly") {
            c="Enemy";
          }
          let f=CZ[c];
          if(f)
            f(world,ts,os);
        })
        let cam= this.camera= _2d.worldCamera(world,world.tiled.tiledWidth,world.tiled.tiledHeight);
        this.camera.centerOver(70*5,70*10);
        EventBus.sub(["post.update",this],"postUpdate");
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
        let bg=this.bg=_S.tilingSprite("bg.png");
        _S.setSize(bg,Mojo.width,Mojo.height);
        this.insert(bg);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["mario.json",
         "fire.mp3", "jump.mp3", "heart.mp3", "hit.mp3", "coin.mp3",
         "bg.png","bg_castle.png","collectables.png","doors.png","enemies.png","blocks.png", "player.png"],
      scaleToWindow:"max",
      arena: {},
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("bg");
        Mojo.Scenes.runScene("level1");
      }
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


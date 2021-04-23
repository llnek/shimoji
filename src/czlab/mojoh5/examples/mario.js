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
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Tiles:_T,
           "2d":_2d,
           v2:_V,
           Game:G,
           ute:_,is}=Mojo;

    G.score=0;

    const E_PLAYER=1,
      E_ITEM=2,
      E_DOOR=4,
      E_SNAIL=8,
      E_FLY=16,
      E_SLIME=32,
      E_ENEMY=64;

    const Collectable={
      s(){},
      c(scene,s,ts,ps,os){
        let sigs=[["2d.sensor",s],"onSensor",s.m5];
        s.m5.uuid= `Coin#${_.nextId()}`;
        s.m5.type=E_ITEM;
        s.m5.sensor=true;
        s.m5.onSensor=(col)=>{
          Mojo.sound("coin.mp3").play();
          _S.remove(s);
          Mojo.off(...sigs);
          if(ps.Amount)
            G.score += ps.Amount
        };
        Mojo.on(...sigs);
        return s;
      }
    };

    const Door={
      s(){},
      c(scene,s,ts,ps,os){
        let sigs=[["2d.sensor",s],"onSensor",s.m5];
        s.m5.uuid= os.id;
        s.m5.type=E_DOOR;
        s.m5.sensor=true;
        s.y += scene.tiled.new_tileH;
        s.y -= s.height;
        s.m5.onSensor=(col)=>{
          if(col.g.hyper && _I.keyDown(_I.DOWN)){
            //goto the other
            col.g.hyper=false;
            let dx=scene.getChildById(os.link);
            col.x=dx.x;
            col.y=dx.y;
          }
        };
        Mojo.on(...sigs);
        return s;
      }
    };

    function Enemy(scene,s,ts,ps,os){
      let signals=[[["bump.top",s],"onKill",s.m5],
                   [["hit",s],"onHit",s.m5]];
      _S.centerAnchor(s);
      _V.add$(s, [Math.floor(s.width/2),
                  Math.floor(s.height/2)]);
      Mojo.addMixin(s,"2d",[_2d.Patrol,true,false]);
      s.m5.heading=Mojo.LEFT;
      s.m5.speed= 150;
      s.m5.vel[0]= -150;
      s.m5.deadTimer=0;

      s.m5.onKill=(col)=>{
        if(col.B.m5.uuid=="player"){
          Mojo.sound("coin.mp3").play();
          G.score++;
          _V.set(s.m5.vel,0,0);
          s.m5.dead=true;
          col.B.m5.vel[1] = -300;
          s.m5.deadTimer = 0;
        }
      };

      s.m5.onHit=function(col){
        if(!s.m5.dead && col.B.m5.uuid=="player" && !col.B.m5.immune){
          Mojo.emit(["enemy.hit", col.B],{"enemy":s,"col":col});
          Mojo.sound("hit.mp3").play();
        }
      };
      s.m5.tick=(dt)=>{
        s["2d"] && s["2d"].onTick(dt);
        if(s.m5.dead){
          s["2d"] && s["2d"].Patrol.dispose();
          s["2d"]=null;
          ++s.m5.deadTimer;
          if(s.m5.deadTimer > 24){
            // Dead for 24 frames, remove it.
            scene.remove(s);
          }
        }else{
          //Mojo.getf(this,"animation").enact('walk');
        }
      };
      signals.forEach(s=>Mojo.on(...s));
      return s;
    }

    const Heart={
      s(){},
      c(scene,s,ts,ps,os){
      }
    };

    const Snail={
      s(){},
      c(scene,s,ts,ps,os){
        s= Enemy(scene,s,ts,ps,os);
        s.m5.type=E_ENEMY;
        return s;
      }
    }

    const Slime={
      s(){},
      c(scene,s,ts,ps,os){
        s= Enemy(scene,s,ts,ps,os);
        s.m5.type=E_ENEMY;
        return s;
      }
    };

    const Fly={
      s(){},
      c(scene,s,ts,ps,os){
        s= Enemy(scene,s,ts,ps,os);
        s.m5.type=E_ENEMY;
        return s;
      }
    };

    const Player={
      s(){},
      c(scene,s,ts,ps,os){
        let PStates={ climb: [16,17], walk_right: [0,10], jump_right: 13, duck_right: 15 };
        let p=_S.sprite(_S.frames(ts.image, ts.tilewidth,ts.tileheight));
        let _mode=null;
        p.m5.cmask=E_ENEMY|E_ITEM|E_DOOR;
        p.m5.uuid="player";
        p.m5.type=E_PLAYER;
        p.height=s.height;
        p.width=s.width;
        p.g.hyper=true;
        _V.set(p, s.x + Math.floor(p.width/2), scene.tiled.tileH*4);
        _V.set(p.m5.gravity,0,333);
        p.m5.strength= 100;
        p.m5.speed= 300;
        p.m5.score= 0;
        _S.centerAnchor(p);
        Mojo.addMixin(p,"2d",[_2d.Platformer]);
        p.m5.showFrame(1);
        //p["2d"].Platformer.jumpSpeed= -500;
        p.m5.heading= Mojo.RIGHT;

        let leftArrow = _I.keybd(_I.LEFT, ()=>{
          if(p.scale.x>0) p.m5.flip="x";
          if(_mode===null)
            p.m5.playFrames(PStates.walk_right);
        }, ()=>{
          p.m5.showFrame(1);
          _mode=null;
        });

        let rightArrow = _I.keybd(_I.RIGHT, ()=>{
          if(p.scale.x<0) p.m5.flip="x";
          if(_mode===null)
            p.m5.playFrames(PStates.walk_right);
        }, ()=>{
          p.m5.showFrame(1);
          _mode=null;
        });

        let upArrow = _I.keybd(_I.UP, ()=>{
          if(p.g.onLadder){
            p.m5.playFrames(PStates.climb);
            _mode=PStates.climb;
          }else{
            p.m5.showFrame(PStates.jump_right);
            _mode=PStates.jump_right;
          }
        }, ()=>{
          _mode=null;
        });

        let downArrow = _I.keybd(_I.DOWN, ()=>{
          if(p.g.onLadder){
            p.m5.playFrames(PStates.climb);
            _mode=PStates.climb;
          }else{
            p.m5.showFrame(PStates.duck_right);
            _mode=PStates.duck_right;
          }
        }, ()=>{
          p.m5.showFrame(1);
          p.g.hyper=true;
          _mode=null;
        });

        let signals=[[["bump.top",p],"breakTile"],
                     [["tile.sensor",p],"checkLadder"],
                     //[["enemy.hit",p],"enemyHit"],
                     [["jump",p]],
                     [["jumped",p]],
                     [["down",Mojo.input],"checkDoor",p]];
        p.m5.getContactPoints=function(){
          return _mode==PStates.duck_right ? [[-16,44], [-23,35], [-23,-10], [23,-10], [23,35], [16,44]]
                                           : [[-16,44], [-23,35], [-23,-48], [23,-48], [23,35], [16,44]]
        };
        p.jumped=function(col){ p.m5.playedJump = false; };
        p.checkDoor=function(){ p.m5.checkDoor = true; };
        p.resetLevel=function(){ };
        p.checkLadder=(col)=>{
          if(!p.g.onLadder && col.tiled.gid===32){
            p.g.onLadder=true;
            p.x=col.x;
          }
        }

        p.jump=function(col){
          if(!p.m5.playedJump){
            Mojo.sound("jump.mp3").play();
            p.m5.playedJump = true;
          }
        };
        p.breakTile=(col)=>{
          let gid=col.B.tiled.gid;
          if(gid===25||gid===37){
            let s,[tx,ty]= scene.getTile(col.B);
            _S.remove(col.B);
            Mojo.sound("coin.mp3").play();
            s=scene.setTile("Collision",ty,tx, gid===25?37:25);
            scene.insert(s);
          }
        };

        p.m5.tick=function(dt){
          p["2d"].onTick(dt);
          if(p.m5.vel[0]===0 && p.m5.vel[1]===0){
            if(!p.g.onLadder && !_I.keyDown(_I.DOWN)) p.m5.showFrame(1);
          }
          if(p.g.onLadder){
            _V.set(p.m5.gravity,0,0);
            if(_I.keyDown(_I.UP)){
              p.m5.vel[1] = -p.m5.speed;
            }else if(_I.keyDown(_I.DOWN)){
              p.m5.vel[1] = p.m5.speed;
            }else{
              //p.continueOverSensor();
            }
          }
        };

        /*
        let wall=_T.getTileLayer(world,"Collision");
        let scene=world.parent;
        let mo=p.m5;
        scene.player=p;
        p.x=ps.x-210;
        p.y=ps.y-72;
        world.addChild(p);

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
        p.m5.tick=function(dt){
          p["2d"].onTick(dt);
          p["platformer"].onTick(dt);
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
      */
        signals.forEach(s=>Mojo.on(...s));
        return G.player=p;
      }
    };

    _Z.defScene("hud",{
      setup(){
        let K=Mojo.getScaleFactor();
        let t= this.score = _S.bitmapText("",{fontName:"unscii",fontSize:64*K, fill:"white"});
        this.insert(t);
      },
      postUpdate(){
        this.score.text= `Score: ${G.score}`;
      }
    });

    const _objF={
      Player,Collectable,Heart,Slime,Fly,Door,Snail
    };

    _Z.defScene("level1",{
      setup(){
        Mojo.addMixin(this,"camera2d",this.tiled.tiledWidth,this.tiled.tiledHeight,Mojo.canvas);
        this["camera2d"].centerOver(this.tiled.tileW*5, this.tiled.tileH*10);
      },
      postUpdate(){
        if(false && G.player && G.player.y > 2000){
        }else{
          this["camera2d"].follow(G.player);
        }
      }
    },{tiled:{name:"mario.json",factory:_objF}});

    _Z.defScene("bg",{
      setup(){
        let bg=_S.tilingSprite("bg.png");
        _S.sizeXY(bg,Mojo.width,Mojo.height);
        this.insert(bg);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["unscii.fnt","mario.json",
         "fire.mp3", "jump.mp3", "heart.mp3", "hit.mp3", "coin.mp3",
         "bg.png","bg_castle.png","collectables.png","doors.png","enemies.png","blocks.png", "player.png"],
      scaleToWindow:"max",
      arena: {},
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("bg");
        Mojo.Scenes.runScene("level1");
        Mojo.Scenes.runScene("hud");
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


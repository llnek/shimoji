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

;(function(global){

  "use strict";

  const E_PLAYER=1;
  const E_ENEMY=2;
  const E_BULLET=4;

  function scenes(Mojo){
    const MFL=Math.floor;
    const {Scenes:Z,
           Game:G,
           Input:I,
           ute:_,
           is,
           v2:_V,
           Sprites:S,"2d":_2d}=Mojo;

    G.boomSound = Mojo.sound("explosion.wav");
    G.shootSound = Mojo.sound("shoot.wav");
    G.music = Mojo.sound("music.wav");
    G.aliens=[];

    function resetLevel(){
      G.target= 10;
      G.score= 0;
      G.spawnInterval= 100;
      G.alienTimer= 0;
      G.winner= "";
      G.aliens.length=0;
      G.cannon=null;
    }

    Z.defScene("level1",{
      setup(){
        let scene=this,
            K=Mojo.getScaleFactor(),
            bg=S.sprite("background.png"),
            cannon = S.sprite("cannon.png",true);

        resetLevel();

        G.cannon=cannon;
        G.bg=bg;

        //scale to fit
        S.scaleContent(cannon);
        S.scaleToCanvas(bg);

        S.pinBottom(this,cannon,-cannon.height-10*K);
        cannon.m5.type=E_PLAYER;
        cannon.m5.uuid="player";
        let pY=cannon.y;
        cannon.m5.tick=()=>{
          _V.setX(cannon, Mojo.mouse.x - this.x);
          S.clamp(cannon,this,false);
          _V.setY(cannon, pY);
        };

        //add sprites
        this.insert(bg);
        this.insert(cannon,true);

        const goLeft = I.keybd(I.LEFT,
          ()=>{ _V.set(cannon.m5.vel,-5*K,0) },
          ()=>{ !goRight.isDown && _V.setX(cannon.m5.vel,0) });

        const goRight =I.keybd(I.RIGHT,
          ()=>{ _V.set(cannon.m5.vel,5*K,0) },
          ()=>{ !goLeft.isDown && _V.setX(cannon.m5.vel,0) });

        function ctor(){
          let b=S.sprite("bullet.png",true);
          S.scaleContent(b);
          b.m5.uuid=`bullet#${_.nextId()}`;
          b.m5.type=E_BULLET;
          b.m5.onHit=()=>{
            G.boomSound.play();
            b.m5.dead=true;
            G.score += 1;
            scene.future(()=> S.remove(b),5);
          }
          b.m5.tick=()=>{
            if(!b.m5.dead){
              if(b.y < -b.height){
                b.m5.dead=true;
                S.remove(b)
              }else{
                S.move(b);
              }
            }
          };
          return b;
        }

        const fireFunc=()=>{
          let b= S.shoot(cannon, -Mojo.PI_90,
                         7*K, ctor, MFL(cannon.width/2), 0);
          scene.insert(b,true);
          G.shootSound.play();
          scene.future(fireFunc,60);
        };
        const fire = I.keybd(I.SPACE, fireFunc);
        G.shootSound.pan = -0.5;
        G.boomSound.pan = 0.5;
        G.music.loop=true;
        G.music.volume=5;
        G.aliens=[];
        G.score= 0;
        G.winner= null;
        G.alienTimer= 0;
        scene.future(fireFunc,60);
      },
      _spawnAlien(){
        const alienFrames = ["alien.png",
                             "explosion.png"];
        let K=Mojo.getScaleFactor(),
            scene=this,
            alien = S.sprite(alienFrames);
        alien.m5.cmask=E_PLAYER|E_BULLET;
        alien.m5.type=E_ENEMY;
        alien.m5.uuid=`alien${_.nextId()}`;
        S.scaleContent(alien);
        S.pinTop(this,alien);
        alien.x = _.randInt2(0,Mojo.width-alien.width);
        _V.set(alien.m5.vel,0,1*K);
        this.insert(alien,true);
        alien.m5.tick=()=>{ !alien.m5.dead && S.move(alien) };
        alien.m5.dispose=()=>{
          Mojo.off(["hit",alien],"onHit",alien.m5)
        };
        alien.m5.onHit=(col)=>{
          if(!alien.m5.dead){
            if(col.B.m5.uuid=="player"){
              G.winner="p2";
            }else{
              scene.future(()=> S.remove(alien),5);
              alien.m5.showFrame(1);
              alien.m5.dead=true;
              _V.setY(alien.m5.vel,0);
              col.B.m5.onHit();
            }
          }
        };
        S.clamp(alien,this,false);
        G.alienTimer = 0;
        G.aliens.push(alien);
        Mojo.on(["hit",alien],"onHit",alien.m5);
      },
      postUpdate(dt){
        //maybe make more aliens?
        if(++G.alienTimer === G.spawnInterval){
          this._spawnAlien();
          if(G.spawnInterval>2) --G.spawnInterval;
        }
        //check collision
        let killed=0;
        for(let a,i=G.aliens.length-1;i>=0;--i){
          a=G.aliens[i];
          if(!a.m5.dead){
            this.collideXY(a);
            if(a.m5.dead) killed=1;
          }
        }

        //resync the alien list if any was killed
        if(killed>0)
          G.aliens=G.aliens.filter(a=> !a.m5.dead);

        //check for winner
        if(G.winner!="p2"){
          if(G.score >= G.target){
            G.winner = "p1"
          }else{
            G.aliens.forEach(a=>{ if(a.y>Mojo.height) G.winner="p2" })
          }
        }

        //end?
        G.winner && this.end();
      },
      end(){
        let K=Mojo.getScaleFactor();
        this.removeChildren();
        this.insert(G.bg);
        let msg = S.bitmapText("", {fontName:"unscii",
                              fill: "#00FF00",
                              fontSize: 20 * K}, 90 * K, 120 * K);
        this.insert(msg);
        G.music.loop=false;
        G.music.stop();
        if(G.winner == "p1"){
          msg.x = 120 * K;
          msg.text="Earth Saved!";
        }
        else
        if(G.winner == "p2"){
          msg.text= "Earth Destroyed!";
        }

        function reset(){
          resetLevel();
          Z.removeScenes();
          Z.runScene("level1");
          Z.runScene("hud");
          //Z.runScene("ctrl");
        }

        this.future(() => reset(), 120);
      }
    });

    Z.defScene("hud", {
      setup(){
        let K=Mojo.getScaleFactor();
        let score= S.bitmapText("0", {fontName: "unscii",
                                fontSize: 20*K, fill: "#00FF00"}, 400*K, 10*K);
        score.m5.tick=()=>{ score.text= `${G.score}` };
        this.insert(score);
      }
    });

    Z.defScene("ctrl", {
      setup(){
        let K=Mojo.getScaleFactor();
        let j=Mojo.Touch.joystick({
          onChange(dir,angle,power){
            if(Mojo.sideRight(dir)){
              _V.set(G.cannon.m5.vel,5*K,0)
            }
            if(Mojo.sideLeft(dir)){
              _V.set(G.cannon.m5.vel,-5*K,0)
            }
          }
        });
        j.x=MFL(Mojo.width/2);
        j.y=MFL(Mojo.height/2);
        this.insert(j);
      }
    });

  }

  window.addEventListener("load", ()=>
    MojoH5({
      assetFiles: ["images/alienArmada.json",
                   "explosion.wav", "music.wav", "shoot.wav", "unscii.fnt"],
      arena: { width: 480, height: 320 },
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        //["level1","ctrl","hud"].forEach(s=> Mojo.Scenes.runScene(s));
        ["level1","hud"].forEach(s=> Mojo.Scenes.runScene(s));
      }
    })
  );

})(this);



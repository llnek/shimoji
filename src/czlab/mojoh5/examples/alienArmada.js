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

  function defScenes(Mojo){
    const I=Mojo.Input, S=Mojo.Sprites, Z=Mojo.Scenes, _2d=Mojo["2d"], G=Mojo.Game;
    let {ute:_,is,EventBus}=Mojo;
    let alienFrames = ["alien.png", "explosion.png"];
    let alienStates=[0,1];
    Z.defScene("level1",{
      setup(){
        let bg=this.insert( S.sprite("background.png")),
            cannon = G.cannon= S.sprite("cannon.png",true);
        cannon.m5.step=(dt)=>{
          _2d.contain(S.move(cannon), this,false); };
        this.insert(cannon);
        S.pinBottom(this,cannon,-cannon.height-10);
        let goLeft = I.keybd(I.keyLEFT,
          ()=>{cannon.m5.vel[0] = -5;
               cannon.m5.vel[1] = 0; },
          ()=>{if(!goRight.isDown && cannon.m5.vel[1] === 0){ cannon.m5.vel[0] = 0 } });
        let goRight =I.keybd(I.keyRIGHT,
          ()=>{cannon.m5.vel[0] = 5;
               cannon.m5.vel[1] = 0; },
          ()=>{if(!goLeft.isDown && cannon.m5.vel[1] === 0) { cannon.m5.vel[0] = 0 } });
        let fire = I.keybd(I.keySPACE,
          ()=>{
            S.shoot(cannon, -Math.PI/2, this, 7, G.bullets, ()=>{
              let b=S.sprite("bullet.png",true);
              b.m5.step=()=>{ if(!b.m5.dead) S.move(b) };
              return b;
            },
            cannon.width/2, 0);
            G.shootSound.play();
          });
        G.bullets=[];
        G.aliens=[];
        G.music.volume=5;
        G.music.loop=true;
        //G.music.play();
        G.shootSound.pan = -0.5;
        G.boomSound.pan = 0.5;
        G.score= 0;
        G.alienTimer= 0;
        G.winner= null;
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        if(++G.alienTimer === G.spawnInterval){
          let alien = S.sprite(alienFrames);
          S.pinTop(this,alien);
          alien.x = alien.width*_.randInt2(0, 14);
          alien.m5.vel[1] = 1;
          this.insert(alien);
          alien.m5.step=()=>{ if(!alien.m5.dead) S.move(alien) };
          _2d.contain(alien,this,false);
          G.aliens.push(alien);
          G.alienTimer = 0;
          //slowly increase aliens
          if(G.spawnInterval > 2){ --G.spawnInterval }
        }
        let killed=false;
        G.aliens = G.aliens.filter(alien=>{
          G.bullets = G.bullets.filter(b=>{
            if(_2d.hitTest(alien, b)){
              alien.m5.dead=true;
              b.m5.dead=true;
              G.boomSound.play();
              alien.m5.showFrame(1);
              alien.m5.vel[1] = 0;
              G.score += 1;
              this.future(() => S.remove(alien,b),5);
            }
            return !b.m5.dead;
          });
          if(_2d.hitTest(alien,G.cannon)){ killed=true; }
          return !alien.m5.dead;
        });
        if(killed){
          G.winner = "p2";
        }else if(G.score < G.target){
          G.aliens.forEach(a=>{ if(a.y > Mojo.height) G.winner = "p2" })
        }else{
          G.winner = "p1";
        }
        if(G.winner){
          Mojo.EventBus.unsub(["post.update",this]);
          this.end();
        }
      },
      end(){
        let bg=this.children[0];
        this.removeChildren();
        this.insert(bg);
        let msg = S.text("", {fontFamily: "emulogic", fontSize: 20, fill: "#00FF00"}, 90, 120);
        this.insert(msg);
        G.music.loop=false;
        G.music.pause();
        if(G.winner === "p1"){
          msg.x = 120;
          msg.text="Earth Saved!";
        }else if(G.winner === "p2"){
          msg.text= "Earth Destroyed!";
        }
        function reset(){
          Mojo.Game.score= 0;
          Mojo.Game.spawnInterval= 100;
          Mojo.Game.alienTimer= 0;
          Mojo.Game.winner= "";
          Mojo.Game.music.volume = 1;
          Z.removeScenes();
          Z.runScene("level1");
          //Z.runScene("ctrl");
          Z.runScene("hud");
        }
        this.future(() => reset(), 120);
      }
    });

    Z.defScene("hud", {
      setup(){
        let score= S.text("0", {fontFamily: "emulogic", fontSize: 20, fill: "#00FF00"}, 400, 10);
        score.m5.step=function(){
          score.text= ""+G.score;
        };
        this.insert(score);
      }
    });

    Z.defScene("ctrl", {
      setup(){
        let j=Mojo.Touch.joystick({
          onChange(dir,angle,power){
            if(Mojo.sideRight(dir)){
              G.cannon.m5.vel[0] = 5;
              G.cannon.m5.vel[1] = 0;
            }
            if(Mojo.sideLeft(dir)){
              G.cannon.m5.vel[0] = -5;
              G.cannon.m5.vel[1] = 0;
            }
          }
        });
        j.x=Mojo.width/2;
        j.y=Mojo.height/2;
        this.insert(j);
      }
    });


  }

  window.addEventListener("load", ()=>
    MojoH5({
      assetFiles: ["joystick.png","joystick-handle.png",
                   "images/alienArmada.json",
                   "explosion.wav", "music.wav", "shoot.wav", "emulogic.ttf"],
      arena: { width: 480, height: 320 },
      scaleToWindow: true,
      start(Mojo){
        Mojo.Game.boomSound = Mojo.sound("explosion.wav");
        Mojo.Game.shootSound = Mojo.sound("shoot.wav");
        Mojo.Game.music = Mojo.sound("music.wav");
        Mojo.Game.spawnInterval= 100;
        Mojo.Game.target= 10;
        defScenes(Mojo);
        Mojo.Scenes.runScene("level1");
        //Mojo.Scenes.runScene("ctrl");
        Mojo.Scenes.runScene("hud");
      }
    })
  );

})(this);


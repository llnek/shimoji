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
    const Z=Mojo.Scenes, _2d=Mojo["2d"];
    const I=Mojo.Input, S=Mojo.Sprites;
    const G=Mojo.Game;
    const MFL=Math.floor;

    let alienFrames = ["alien.png", "explosion.png"];
    let {ute:_,is,EventBus}=Mojo;

    G.boomSound = Mojo.sound("explosion.wav");
    G.shootSound = Mojo.sound("shoot.wav");
    G.music = Mojo.sound("music.wav");
    G.spawnInterval= 100;
    G.target= 10;

    function _setVel(o,vx,vy,K){
      o.m5.vel[1]=vy * K.height;
      o.m5.vel[0]=vx * K.width;
      return o;
    }

    Z.defScene("level1",{
      setup(){
        let scene=this,
            K=Mojo.contentScaleFactor(),
            bg=S.sprite("background.png"),
            cannon = S.sprite("cannon.png",true);

        G.cannon=cannon;
        G.bg=bg;

        //scale to fit
        S.scaleContent(cannon);
        S.scaleToCanvas(bg);

        cannon.m5.type=E_PLAYER;
        cannon.m5.uuid="player";
        cannon.m5.step=(dt)=>{ _2d.contain(S.move(cannon), this,false) };
        S.pinBottom(this,cannon,-cannon.height-10*K.height);

        //add sprites
        this.insert(bg);
        this.insert(cannon);

        const goLeft = I.keybd(I.keyLEFT,
          ()=>{_setVel(cannon,-5,0,K) },
          ()=>{if(!goRight.isDown){ cannon.m5.vel[0] = 0 } });

        const goRight =I.keybd(I.keyRIGHT,
          ()=>{_setVel(cannon,5,0,K) },
          ()=>{if(!goLeft.isDown) { cannon.m5.vel[0] = 0 } });

        function ctor(){
          let b=S.sprite("bullet.png",true);
          S.scaleContent(b);
          b.m5.uuid=`bullet#${_.nextId()}`;
          b.m5.type=E_BULLET;
          b.m5.onHit=(col)=>{
            col.m5.dead=true;
            b.m5.dead=true;
            G.boomSound.play();
            col.m5.showFrame(1);
            col.m5.vel[1] = 0;
            G.score += 1;
            scene.future(() => S.remove(col,b),5);
          }
          b.m5.step=()=>{ if(!b.m5.dead) S.move(b) };
          return b;
        }

        const fire = I.keybd(I.keySPACE,
          ()=>{
            let b= S.shoot(cannon, -Math.PI/2, 7*K.height, ctor, MFL(cannon.width/2), 0);
            scene.insert(b);
            G.shootSound.play();
          });

        G.shootSound.pan = -0.5;
        G.boomSound.pan = 0.5;
        G.music.loop=true;
        G.music.volume=5;
        G.aliens=[];
        G.score= 0;
        G.winner= null;
        G.alienTimer= 0;

        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        if(++G.alienTimer === G.spawnInterval){
          let K=Mojo.contentScaleFactor(),
              alien = S.sprite(alienFrames);
          alien.m5.cmask=E_PLAYER|E_BULLET;
          alien.m5.type=E_ENEMY;
          alien.m5.uuid=`alien${_.nextId()}`;
          S.scaleContent(alien);
          S.pinTop(this,alien);
          alien.x = alien.width*_.randInt2(0, 14);
          _setVel(alien,0,1,K);
          this.insert(alien);
          alien.m5.step=()=>{ if(!alien.m5.dead) S.move(alien) };
          alien.m5.onHit=(col)=>{
            if(!alien.m5.dead){
              if(col.B.m5.uuid=="player"){
                G.winner="p2";
              }else{
                col.B.m5.onHit(alien);
              }
            }
          };
          _2d.contain(alien,this,false);
          EventBus.sub(["hit",alien],"onHit",alien.m5);

          G.aliens.push(alien);
          G.alienTimer = 0;
          //slowly increase aliens
          if(G.spawnInterval > 2){ --G.spawnInterval }
        }
        for(let a,i=G.aliens.length-1;i>=0;--i){
          a=G.aliens[i];
          if(!a.m5.dead)
            this.collideXY(a);
        }
        G.aliens=G.aliens.filter(a=> !a.m5.dead);
        if(G.winner=="p2"){}
        else if(G.score < G.target){
          G.aliens.forEach(a=>{ if(a.y > Mojo.height) G.winner = "p2" })
        }else{
          G.winner = "p1";
        }
        if(G.winner){
          EventBus.unsub(["post.update",this]);
          this.end();
        }
      },
      end(){
        let K=Mojo.contentScaleFactor();
        this.removeChildren();
        this.insert(G.bg);
        let msg = S.text("", {fontFamily:"emulogic",
                              fill: "#00FF00",
                              fontSize: 20 * K.width}, 90 * K.width, 120 * K.height);
        this.insert(msg);
        G.music.loop=false;
        G.music.pause();
        if(G.winner == "p1"){
          msg.x = 120 * K.width;
          msg.text="Earth Saved!";
        }else if(G.winner == "p2"){
          msg.text= "Earth Destroyed!";
        }
        function reset(){
          G.score= 0;
          G.spawnInterval= 100;
          G.alienTimer= 0;
          G.winner= "";
          G.music.volume = 1;
          G.aliens.length=0;
          G.cannon=null;
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
        let K=Mojo.contentScaleFactor();
        let score= S.text("0", {fontFamily: "emulogic",
                                fontSize: 20*K.width, fill: "#00FF00"}, 400*K.width, 10*K.height);
        score.m5.step=function(){
          score.text= `${G.score}`;
        };
        this.insert(score);
      }
    });

    Z.defScene("ctrl", {
      setup(){
        let K=Mojo.contentScaleFactor();
        let j=Mojo.Touch.joystick({
          onChange(dir,angle,power){
            if(Mojo.sideRight(dir)){
              _setVal(G.cannon,5,0,K);
            }
            if(Mojo.sideLeft(dir)){
              _setVal(G.cannon,-5,0,K);
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
      assetFiles: ["joystick.png","joystick-handle.png",
                   "images/alienArmada.json",
                   "explosion.wav", "music.wav", "shoot.wav", "emulogic.ttf"],
      arena: { width: 480, height: 320 },
      resize:false,
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        //["level1","ctrl","hud"].forEach(s=> Mojo.Scenes.runScene(s));
        ["level1","hud"].forEach(s=> Mojo.Scenes.runScene(s));
      }
    })
  );

})(this);


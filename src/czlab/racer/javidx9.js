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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           Arcade:_2d,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //shorthands
    const int=Math.floor; const ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#e4ea1c"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          W2=Mojo.width/2,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("Retro Racer",TITLE_FONT,120*K);
            _S.tint(s,C_TITLE);
            _V.set(s,W2,Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT,64*K);
            t=_F.throb(s,0.747,0.747);
            function cb(){
              _I.off(["single.tap"],cb);
              _F.remove(t);
              _S.tint(s,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=> _Z.runEx("PlayGame"));
            }
            _I.on(["single.tap"],cb);
            _V.set(s,W2,Mojo.height*0.7);
            return self.insert(_S.anchorXY(s,0.5));
          }
        });
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        //use a fixed width font
        _.inject(this.g,{
          msgs:["   Track Section",
                " Track Curvature",
                "Target Curvature",
                "================",
                "        Distance",
                "    Player Speed",
                "Player Curvature",
                "================",
                "Current LAP Time"],
          stats:[],
          fmtNum(n,v,p){
            return `${n}: ${Number(v).toFixed(p===undefined?3:p)}`
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        let pad=10*K,
          cfg={fontName:"unscii",fontSize:24*K};
        //track info
        for(let a=this.g.msgs,z=a.length,i=0;i<z;++i)
          this.g.stats[i]=_S.bmpText(
            (i==3||i==7)?this.g.msgs[i]: this.g.fmtNum(a[i],0),cfg);
        let T=_S.bmpText("Statistics",cfg);
        let p=this.insert(T);
        T.y -= (T.height+pad);
        this.g.stats.forEach(s=>{
          _S.pinBelow(p,s,pad,0);
          p=this.insert(s);
        });
        if(true){
          let r=64*K,r4=r/4;
          this.g.spdo= _2d.gaugeUI({
            cx: Mojo.width-r-r4,
            cy: r+r4,
            fill: "#cccccc",
            scale:K,
            radius:64,
            alpha:0.4,
            line:"white",
            needle: "#FF9166",
            gfx: _S.graphics(),
            update(){ return _G.speed }
          })
          this.insert(this.g.spdo.gfx);
        }
      },
      postUpdate(){
        this.g.stats[0].text= this.g.fmtNum(this.g.msgs[0],_G.trackSection,0);
        this.g.stats[1].text= this.g.fmtNum(this.g.msgs[1],_G.trackCurvature);
        this.g.stats[2].text= this.g.fmtNum(this.g.msgs[2],_G.targetBend);
        //skip3
        this.g.stats[4].text= this.g.fmtNum(this.g.msgs[4],_G.distance);
        this.g.stats[5].text= this.g.fmtNum(this.g.msgs[5],_G.maxSpeed*_G.speed);
        this.g.stats[6].text= this.g.fmtNum(this.g.msgs[6],_G.playerCurvature);
        //skip7
        this.g.stats[8].text= this.g.fmtNum(this.g.msgs[8],_G.lapTime);
        this.g.spdo.draw();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        const self=this,
          W=Mojo.width,
          H=Mojo.height,
          W2= Mojo.width/2,
          H2= Mojo.height/2,
          K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        const CHUNKX=int(4*K);
        const CHUNKY=int(4*K);
        _.inject(this.g,{
          initLevel(){
            _.inject(_G,{
              TRACK:[{ct:10,tu:0},
                     {ct:200,tu:0},
                     {ct:200,tu:1},
                     {ct:400,tu:0},
                     {ct:100,tu:-1},
                     {ct:200,tu:0},
                     {ct:200,tu:-1},
                     {ct:200,tu:1},
                     {ct:200,tu:0},
                     {ct:500,tu:0.2},
                     {ct:200,tu:0} ],
              HILL_COLOR: _S.color("#556b2f"),
              SKY_COLOR: _S.color("#87cefa"),
              HILLHEIGHT:343*K,
              laps: [0,0,0,0,0],
              lapTime: 0,
              distance:0,
              curvature:0,
              playerPos:0,
              playerArc:0,
              speed:0,
              maxSpeed:120,
              targetBend:0,
              trackSection:0,
              trackCurvature:0,
              playerCurvature:0,
              player: _S.sprite("red_car.png")
            });
            _G.TRACK_DIST= _G.TRACK.reduce((a,r)=> a+r.ct, 0);
            self.insert(self.g.gfx=_S.graphics());
            return self.insert(_S.anchorXY(_S.scaleBy(_G.player,K*1.4,K*1.4),0.5));
          },
          updateStats(dt){
            _G.lapTime += dt;
            if(_G.distance >= _G.TRACK_DIST){
              _G.distance -= _G.TRACK_DIST;
              _G.laps.unshift(_G.lapTime);
              _G.laps.pop();
              _G.lapTime = 0;
            }
          },
          findSection(){
            let t=0,d=0;
            while(t < _G.TRACK.length && d <= _G.distance){
              d += _G.TRACK[t].ct;
              ++t;
            }
            _G.trackSection=t;
            _G.targetBend = _G.TRACK[t-1].tu;
          },
          draw(dt){
            let dts= dt*_G.speed;
            //interpolate towards current section curvature
            _G.curvature += (_G.targetBend - _G.curvature) * dts;
            //accumulate track curvature
            _G.trackCurvature += _G.curvature * dts;
            this.gfx.clear() &&
              this.drawWorld() && this.drawTrack({}) &&  this.drawCar();
          },
          drawWorld(){
            //draw sky
            this.gfx.beginFill(_G.SKY_COLOR);
            this.gfx.drawRect(0,0,W,H2);
            this.gfx.endFill();
            //draw scenery - our hills are a rectified sine wave,
            //where the phase is adjusted by the accumulated track curvature
            for(let hh,x=0; x < W; x+=CHUNKX){
              hh = Math.abs(sin(x * 0.01 + _G.trackCurvature) * _G.HILLHEIGHT);
              this.gfx.beginFill(_G.HILL_COLOR);
              this.gfx.drawRect(x,H2-hh,CHUNKX,hh);
              this.gfx.endFill();
            }
            return this;
          },
          drawTrack(proj){
            let project=(y)=>{
              let perspective = y/H2,
                  roadWidth = 0.1 + perspective * 0.8, // Min 10% Max 90%
                  clipWidth = roadWidth * 0.15;
              /////
              proj.p3= Math.pow(1-perspective,3);
              proj.p2= Math.pow(1-perspective,2);
              roadWidth *= 0.5;  // Halve it as track is symmetrical around center of track, but offset...
              // ...depending on where the middle point is, which is defined by the current track curvature.
              let middle= 0.5 + _G.curvature * proj.p3;
              //work out segment boundaries
              proj.leftGrassX = (middle- roadWidth - clipWidth) * W;
              proj.leftClipX = (middle- roadWidth) * W;
              proj.rightClipX = (middle + roadWidth) * W;
              proj.rightGrassX = (middle+ roadWidth + clipWidth) * W;
            },
            drawRow=(x1,y1,x2,color)=>{
              this.gfx.beginFill(color);
              this.gfx.drawRect(x1,y1,x2-x1,CHUNKY);
              this.gfx.endFill();
            };
            for(let r,y=0;y<H2; y+=CHUNKY){
              project(y);
              //Using periodic oscillatory functions to give lines, where the phase is controlled
              //by the distance around the track. These take some fine tuning to give the right "feel"
              proj.grassColor = _S.color(sin(20 *proj.p3 + _G.distance * 0.1) > 0 ? "#a6d608": "#8db600");
              proj.clipColor = _S.color(sin(80 *proj.p2  + _G.distance) > 0 ? "#ff6347": "white");
              // Start finish straight changes the road colour to inform the player lap is reset
              proj.roadColor = _S.color((_G.trackSection-1) == 0 ? "#fffacd" : "#808080");
              // Draw the row segments
              r = H2 + y; //screen bottom up visually
              drawRow(0,r,proj.leftGrassX,proj.grassColor);
              drawRow(proj.leftGrassX,r,proj.leftClipX,proj.clipColor);
              drawRow(proj.leftClipX,r,proj.rightClipX,proj.roadColor);
              drawRow(proj.rightClipX,r,proj.rightGrassX,proj.clipColor);
              drawRow(proj.rightGrassX,r,W,proj.grassColor);
            }
            return this;
          },
          drawCar(){
            //draw Car - car position on road is proportional to difference between
            // current accumulated track curvature, and current accumulated player curvature
            // i.e. if they are similar, the car will be in the middle of the track
            _G.player.angle= _G.playerArc;
            _G.playerPos = _G.playerCurvature - _G.trackCurvature;
            return _V.set(_G.player, W2 + ((W * _G.playerPos) * 0.5) ,H);
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel() && _Z.run("HUD");
      },
      postUpdate(dt){
        _G.speed += dt * (_I.keyDown(_I.SPACE)?2:-1);
        _G.playerArc= 0;
        let b=0,dv= 0.7*dt*(1-_G.speed/2);
        //car curvature is accumulated left/right input, but inversely proportional to speed
        // i.e. it is harder to turn at high speed
        if(_I.keyDown(_I.LEFT)){ b=-1 }
        if(_I.keyDown(_I.RIGHT)){ b=1 }
        if(b !== 0){
          _G.playerArc= b*30;
          _G.playerCurvature += b*dv;
        }
        //car curvature is too different to track curvature,
        //slow down as car has gone off track
        if(Math.abs(_G.playerCurvature - _G.trackCurvature) >= 0.8){
          _G.speed -= 5*dt
        }
        //clamp Speed//////////////
        _G.speed= _M.clamp(0,1,_G.speed);
        _G.distance += (_G.maxSpeed * _G.speed) * dt;
        ///////////////////////////
        this.g.updateStats(dt);
        this.g.findSection();
        //paint///////////////////
        this.g.draw(dt);
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["red_car.png","click.mp3"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"x",
    //fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }
  }));

})(this);




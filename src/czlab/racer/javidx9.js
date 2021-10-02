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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor;
    const ceil=Math.ceil;
    const sin=Math.sin,
          cos=Math.cos;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){ Mojo.sound("click.mp3").play() }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bg.png"),Mojo.width,Mojo.height);
      return scene.insert(_S.opacity(_G.backDropSprite,0.15));
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Retro Racer",{fontName:TITLE_FONT,fontSize:120*K});
          _S.tint(s,C_TITLE);
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        }
        this.g.doNext=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          t=_F.throb(s,0.99);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=>{
              _Z.runSceneEx("PlayGame");
              _Z.runScene("HUD");
            });
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,Mojo.width/2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(s));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("HUD",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          tmsgs:["Track Section",
                 "Track Curvature",
                 "Target Curvature"],
          pmsgs:["Distance",
                 "Player Speed",
                 "Player Curvature",
                 "Current LAP Time"],
          tstats:[],
          pstats:[],
          fmtNum(n,v){
            return `${n}:${Number(v).toFixed(3)}`
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        let pad=10*K,
            cfg={fontName:UI_FONT,fontSize:24*K};
        //track info
        for(let a=this.g.tmsgs,z=a.length,i=0;i<z;++i)
          this.g.tstats[i]=_S.bmpText(this.g.fmtNum(a[i],0),cfg);
        let T=_S.bmpText("Statistics",cfg);
        let p=this.insert(T);
        T.y -= (T.height+pad);
        this.g.tstats.forEach(s=>{
          _S.pinBottom(p,s,pad,0);
          p=this.insert(s);
          T=p;
        });
        //player info
        for(let a=this.g.pmsgs,z=a.length,i=0;i<z;++i)
          this.g.pstats[i]=_S.bmpText(this.g.fmtNum(a[i],0),cfg);
        this.g.pstats.forEach((s,i)=>{
          _S.pinBottom(p,s,pad,0);
          if(i===0)
            s.y += pad;
          p=this.insert(s);
        });
      },
      postUpdate(){
        this.g.tstats[0].text= this.g.fmtNum(this.g.tmsgs[0],_G.trackSection);
        this.g.tstats[2].text= this.g.fmtNum(this.g.tmsgs[2],_G.targetTurn);
        this.g.tstats[1].text= this.g.fmtNum(this.g.tmsgs[1],_G.trackTurn);
        this.g.pstats[2].text= this.g.fmtNum(this.g.pmsgs[2],_G.playerTurn);
        this.g.pstats[1].text= this.g.fmtNum(this.g.pmsgs[1],_G.maxSpeed*_G.speed);
        this.g.pstats[0].text= this.g.fmtNum(this.g.pmsgs[0],_G.playerDist);
        this.g.pstats[3].text= this.g.fmtNum(this.g.pmsgs[3],_G.curLapTime);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawBackdrop(scene,K,W,H,W2,H2){
      const gfx=scene.g.gfx,
            HILLHEIGHT=434*K;
      //draw sky
      gfx.beginFill(_S.color("#87cefa"));
      gfx.drawRect(0,0,W,H2);
      gfx.endFill();
      //draw scenery - our hills are a rectified sine wave, where the phase is adjusted by the accumulated track curvature
      gfx.lineStyle(1,_S.color("#556b2f"));
      for(let hh,x = 0; x < W; ++x){
        hh = Math.abs(sin(x * 0.01 + _G.trackTurn) * HILLHEIGHT*K);
        gfx.moveTo(x,H2-hh);
        gfx.lineTo(x,H2);
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawTrack(scene,K,W,H,W2,H2,proj){
      const gfx=scene.g.gfx;
      function project(y){
        let perspective = y/H2;
        let roadWidth = 0.1 + perspective * 0.8; // Min 10% Max 90%
        let clipWidth = roadWidth * 0.15;
        /////
        proj.p3= Math.pow(1-perspective,3);
        proj.p2= Math.pow(1-perspective,2);
        roadWidth *= 0.5;  // Halve it as track is symmetrical around center of track, but offset...
        // ...depending on where the middle point is, which is defined by the current
        // track curvature.
        let middle= 0.5 + _G.curvature * proj.p3;
        //work out segment boundaries
        proj.leftGrassX = (middle- roadWidth - clipWidth) * W;
        proj.leftClipX = (middle- roadWidth) * W;
        proj.rightClipX = (middle + roadWidth) * W;
        proj.rightGrassX = (middle+ roadWidth + clipWidth) * W;
      }
      function drawLine(x1,y1,x2,y2,color){
        gfx.lineStyle(1,color);
        gfx.moveTo(x1,y1);
        gfx.lineTo(x2,y2);
      }
      for(let r,y=0;y<H2;++y){
        project(y);
        //Using periodic oscillatory functions to give lines, where the phase is controlled
        //by the distance around the track. These take some fine tuning to give the right "feel"
        proj.grassColor = _S.color(sin(20 *proj.p3 + _G.playerDist * 0.1) > 0 ? "#a6d608": "#8db600");
        proj.clipColor = _S.color(sin(80 *proj.p2  + _G.playerDist) > 0 ? "#ff6347": "white");
        // Start finish straight changes the road colour to inform the player lap is reset
        proj.roadColor = _S.color((_G.trackSection-1) == 0 ? "#fffacd" : "#808080");
        // Draw the row segments
        r = H2 + y; //screen bottom up visually
        drawLine(0,r,proj.leftGrassX,r,proj.grassColor);
        drawLine(proj.leftGrassX,r,proj.leftClipX,r,proj.clipColor);
        drawLine(proj.leftClipX,r,proj.rightClipX,r,proj.roadColor);
        drawLine(proj.rightClipX,r,proj.rightGrassX,r,proj.clipColor);
        drawLine(proj.rightGrassX,r,W,r,proj.grassColor);
      }
    }
    function drawCar(scene,W,H,W2,H2){
      //draw Car - car position on road is proportional to difference between
      // current accumulated track curvature, and current accumulated player curvature
      // i.e. if they are similar, the car will be in the middle of the track
      _G.player.angle= _G.playerArc;
      _G.playerPos = _G.playerTurn - _G.trackTurn;
      _V.set(_G.player, W2 + ((W * _G.playerPos) * 0.5) ,H);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function draw3D(scene,dt){
      const W=Mojo.width,
            H=Mojo.height,
            H8= H*0.8,
            W2= Mojo.width/2,
            H2= Mojo.height/2,
            dts= dt*_G.speed,
            K=Mojo.getScaleFactor();
      //interpolate towards current section curvature
      _G.curvature += (_G.targetTurn - _G.curvature) * dts;
      //accumulate track curvature
      _G.trackTurn += _G.curvature * dts;
      drawBackdrop(scene,K,W,H,W2,H2);
      drawTrack(scene,K,W,H,W2,H2,{});
      drawCar(scene,W,H,W2,H2);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
              listLapTimes: [0,0,0,0,0],
              curLapTime: 0,
              playerDist:0,
              curvature:0,
              playerPos:0,
              playerArc:0,
              speed:0,
              trackSection:0,
              trackTurn:0,
              targetTurn:0,
              playerTurn:0,
              maxSpeed:120,
              player: _S.sprite("images/javidx9/red_car.png")
            });
            _G.TRACK_DIST= _G.TRACK.reduce((a,r)=> a+r.ct, 0);
          },
          updateStats(dt){
            _G.curLapTime += dt;
            if(_G.playerDist >= _G.TRACK_DIST){
              _G.playerDist -= _G.TRACK_DIST;
              _G.listLapTimes.pop();
              _G.listLapTimes.unshift(_G.curLapTime);
              _G.curLapTime = 0;
            }
          },
          findSection(){
            let t=0,d=0;
            while(t < _G.TRACK.length && d <= _G.playerDist){
              d += _G.TRACK[t].ct;
              ++t;
            }
            _G.trackSection=t;
            _G.targetTurn = _G.TRACK[t-1].tu;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        this.insert(this.g.gfx=_S.graphics());
        this.insert(_S.centerAnchor(_S.scaleBy(_G.player,K*1.4,K*1.4)));
      },
      postUpdate(dt){
        _G.speed += dt * _I.keyDown(_I.SPACE)?2:-1;
        _G.playerArc= 0;
        let b=0,dv= 0.7*dt*(1-_G.speed/2);
        //car curvature is accumulated left/right input, but inversely proportional to speed
        // i.e. it is harder to turn at high speed
        if(_I.keyDown(_I.LEFT)){ b=-1 }
        if(_I.keyDown(_I.RIGHT)){ b=1 }
        if(b !== 0){
          _G.playerTurn += b*dv;
          _G.playerArc= b*30;
        }
        //car curvature is too different to track curvature, slow down as car has gone off track
        if(Math.abs(_G.playerTurn - _G.trackTurn) >= 0.8){
          _G.speed -= 5*dt
        }
        //clamp Speed
        if(_G.speed<0) _G.speed = 0;
        if(_G.speed>1) _G.speed = 1;
        //move car along track according to car speed
        _G.playerDist += (_G.maxSpeed * _G.speed) * dt;
        //lap timing and counting
        this.g.updateStats(dt);
        //update to track section
        this.g.findSection();
        //repaint
        this.g.gfx.clear() && draw3D(this,dt);
      }
    });
  }

  const _$={
    assetFiles: ["images/javidx9/red_car.png","bg.png","click.mp3"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"x",
    //fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);


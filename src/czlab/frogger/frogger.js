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
  const int=Math.floor;

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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#e4ea1c");//"#e8eb21";//"#fff20f";//yelloe
    //const C_TITLE=_S.color("#ea2152");//red
    //const C_TITLE=_S.color("#1eb7e6");//blue
    //const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const C_BG=_S.color("#1e1e1e");
    const CLICK_DELAY=343;
    const ICON_WIDTH=64;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){ Mojo.sound("click.mp3").play() }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene,alpha=1){return 1;
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.fillMax(_S.sprite("bg.png"));
      return scene.insert(_S.opacity(_G.backDropSprite,alpha));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            W2=Mojo.width/2,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Frogger",{fontName:TITLE_FONT,fontSize:120*K});
          _S.tint(s,C_TITLE);
          _V.set(s,W2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          t=_F.throb(s,0.747,0.747);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=>{
              _Z.runSceneEx("PlayGame");
            });
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,W2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(s));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this,0.2) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const BANDS=["grass","water","water","water","dirt","road","road","road","grass"].map(x=> `${x}.png`);
    const BAND_CNT=BANDS.length, ROAD=3, RIVER=3;
    const CARS=["bus1","bus2","car1","car2","car3","fire_truck","police","taxi"].map(x=> `${x}.png`);
    const CARGRP={3:[], 4:[], 5:[], 6:[]};
    const CARLEN=[4,5,3,3,3,6,4,4];
    const CARMAP={};

    CARS.forEach((s,i)=>{
      CARMAP[s]=CARLEN[i];
      CARGRP[CARLEN[i]].push(s);
    })
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

    const TRACKLEN = 64;
    const TRACKS = [
      [0,  "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg", "e"],
      [-300, "...4xxx..6xxxxx.......4xxx.....2x...5xxxx....6xxxxx....5xxxx....", "w"],
      [300,  "....xxx4.....xxx4....xxx4.........xxx4.....x2......xxxxx6.......","w"],
      [200,  "..xx3.....xx3.....x2.....xx3...xx3....x2....xxx4....x2......x2..", "w"],
      [0,  "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", ""],
      [-300, "....5xxxx......4xxx....4xxx........6xxxxx......6xxxxx...5xxxx...", "r"],
      [300,  "....xx3..xxx4..xxx4..xxx4...xxxxx6....xx3.xxxx5......xxx4....xx3", "r"],
      [-400, "..3xx....4xxx.......3xx.5xxxx.....3xx..3xx..3xx...3xx..3xx..3xx.", "r"],
      [0,  "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg", "s"]
    ];

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randStart(){
      let p,out=[];
      TRACKS.forEach((t,i)=>{
        p=-1;
        if(t[0] != 0){
          while(1){
            p=_.randInt2(8,64-8);
            if(t[1].charAt(p)=="."){ break } }
        }
        out[i]=p;
      })
      out.forEach((p,i,t)=>{
        if(p>0){
          t=TRACKS[i];
          t[1]= t[1].substring(p) + t[1].substring(0,p);
        }
        //console.log(TRACKS[i][1]);
      });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkLog(dir,band,size){
      let s= _S.sprite(`log${size}.png`);
      let {tileW,tileH,grid}= _G;
      let g=grid[band][0];
      s.height= 0.8 * tileH;
      s.y=int((g.y1+g.y2)/2 - s.height/2);
      s.m5.vel[0]=dir;
      s.m5.tick=(dt)=>{
        _S.move(s,dt);
        dir>0?checkFlowRight(s):checkFlowLeft(s);
      };
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkCar(dir,band,png){
      let s= _S.sprite(dir>0?png:`_${png}`);
      let {tileW,tileH,grid}= _G;
      let g=grid[band][0];
      s.height= Math.min(s.height,tileH);
      s.y=g.y2-s.height;
      s.m5.vel[0]=dir;
      s.m5.tick=(dt)=>{
        _S.move(s,dt);
        dir>0?checkGoRight(s):checkGoLeft(s);
      };
      return s;
    }

    function checkFlowRight(s){
      if(s.x>Mojo.width){
        _.assert(s===s.g.river[0], "bad right pop");
        let e=s.g.river[s.g.river.length-1];
        let {tileW}=_G;
        s.g.river.shift();
        s.g.river.push(s);
        s.x = e.x - s.g.gap*tileW - s.width;
      }
    }

    function checkFlowLeft(s){
      if((s.x+s.width)<0){
        _.assert(s===s.g.river[0], "bad left pop");
        let e=s.g.river[s.g.river.length-1];
        let {tileW}=_G;
        s.g.river.shift();
        s.g.river.push(s);
        s.x = e.x + e.width + s.g.gap*tileW;
      }
    }

    function checkGoRight(s){
      if(s.x>Mojo.width){
        _.assert(s===s.g.track[0], "bad right pop");
        let e=s.g.track[s.g.track.length-1];
        let {tileW}=_G;
        s.g.track.shift();
        s.g.track.push(s);
        s.x = e.x - s.g.gap*tileW - s.width;
      }
    }

    function checkGoLeft(s){
      if((s.x+s.width)<0){
        _.assert(s===s.g.track[0], "bad left pop");
        let e=s.g.track[s.g.track.length-1];
        let {tileW}=_G;
        s.g.track.shift();
        s.g.track.push(s);
        s.x = e.x + e.width + s.g.gap*tileW;
      }
    }

    function buildTrack(t,band){
      return t[0]>0?buildTrackRight(t,band):buildTrackLeft(t,band)
    }

    function buildRiver(t,band){
      return t[0]>0?buildRiverRight(t,band):buildRiverLeft(t,band)
    }

    function buildRiverLeft(t,band){
      let p,s,v,gap=0, out=[];
      let cells=t[1];
      let {tileW}=_G;
      for(let c,i=0;i<cells.length;++i){
        c=cells.charAt(i);
        if(c=="."){
          gap+=1
        }else if(c=="x"){
        }else{
          s=mkLog(t[0],band,c);
          s.g.river=out;
          s.g.gap=gap;
          if(!p){
            s.x=tileW*gap;
          }else{
            s.x= p.x+p.width+gap*tileW;
          }
          gap=0;
          p=s;
          out.push(s);
        }
      }
      //since this is like a circular buffer
      //so add remaining gap to the first car
      out[0].g.gap += gap;
      return out;
    }

    function buildRiverRight(t,band){
      let out=[],cells= t[1];
      let {tileW}=_G;
      let p,s,v,gap=0;
      for(let c,i=cells.length-1;i>=0;--i){
        c=cells.charAt(i);
        if(c=="."){
          gap+=1
        }else if(c=="x"){
        }else{
          s=mkLog(t[0],band,c);
          s.g.river=out;
          s.g.gap=gap;
          if(!p){
            s.x= Mojo.width - tileW*gap - s.width;
          }else{
            s.x= p.x- tileW*gap - s.width;
          }
          gap=0;
          p=s;
          out.push(s);
        }
      }
      //since this is like a circular buffer
      //so add remaining gap to the first car
      out[0].g.gap += gap;
      return out;
    }

    function buildTrackRight(t,band){
      let out=[],cells= t[1];
      let {tileW}=_G;
      let p,s,v,gap=0;
      for(let c,i=cells.length-1;i>=0;--i){
        c=cells.charAt(i);
        if(c=="."){
          gap+=1
        }else if(c=="x"){
        }else{
          v= _.randItem(CARGRP[c]);
          s=mkCar(t[0],band,v);
          s.g.track=out;
          s.g.gap=gap;
          if(!p){
            s.x= Mojo.width - tileW*gap - s.width;
          }else{
            s.x= p.x- tileW*gap - s.width;
          }
          gap=0;
          p=s;
          out.push(s);
        }
      }
      //since this is like a circular buffer
      //so add remaining gap to the first car
      out[0].g.gap += gap;
      return out;
    }

    function buildTrackLeft(t,band){
      let p,s,v,gap=0, out=[];
      let cells=t[1];
      let {tileW}=_G;
      for(let c,i=0;i<cells.length;++i){
        c=cells.charAt(i);
        if(c=="."){
          gap+=1
        }else if(c=="x"){
        }else{
          v= _.randItem(CARGRP[c]);
          s=mkCar(t[0],band,v);
          s.g.track=out;
          s.g.gap=gap;
          if(!p){
            s.x=tileW*gap;
          }else{
            s.x= p.x+p.width+gap*tileW;
          }
          gap=0;
          p=s;
          out.push(s);
        }
      }
      //since this is like a circular buffer
      //so add remaining gap to the first car
      out[0].g.gap += gap;
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function fillBand(scene,sx,sy,width,height,png){
      let K,s, x=sx, y=sy, row=[];
      function obj(x,y,s){
        return { x1:x,y1:y,x2:x+s.width,y2:y+s.height }
      }
      while(1){
        s=_S.sizeXY(_S.sprite(png),_G.tileW, _G.tileH);
        scene.insert( _V.set(s,x,y));
        row.push(obj(x,y,s));
        x+=s.width;
        if(x>width){
          row.push(obj(x,y,s));
          break;
        }
      }
      return row;
    }


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        randStart();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let sx=0,sy=0,grid=[],
                K,r,h= int(Mojo.height/BAND_CNT);
            _G.tileH=h;
            _G.tileW=h;

            BANDS.forEach((b,i)=>{
              r=fillBand(self,sx,sy,Mojo.width,h,b);
              if(i==0 || i==BAND_CNT-1)
                r=fillBand(self,sx,sy,Mojo.width,h,"bush.png");
              grid.push(r);
              sy += h;
            });
            _G.grid=grid;
            //self.insert(_S.drawGridLines(0,0,grid,1,"white"));
          },
          initBands(){
            TRACKS.forEach((t,i)=>{
              if(t[2]=="r")
                buildTrack(t,i).forEach(s=> self.insert(s));
              if(t[2]=="w")
                buildRiver(t,i).forEach(s=> self.insert(s));
            });
          },
          initHoles(){
            let {tileW,tileH,grid}=_G;
            let row= grid[0],
                len= row.length,
                s,g,d2= int(len/2), d3= int(len/4);
            g=row[d2];
            s= _S.centerAnchor(_S.sprite("hole.png"));
            s.x= int((g.x1 + g.x2)/2);
            s.y= int((g.y1 + g.y2)/2);
            _S.sizeXY(s,tileW,tileH);
            self.insert(s);
            g=row[d2-d3];
            s= _S.centerAnchor(_S.sprite("hole.png"));
            s.x= int((g.x1 + g.x2)/2);
            s.y= int((g.y1 + g.y2)/2);
            _S.sizeXY(s,tileW,tileH);
            self.insert(s);
            g=row[d2+d3];
            s= _S.centerAnchor(_S.sprite("hole.png"));
            s.x= int((g.x1 + g.x2)/2);
            s.y= int((g.y1 + g.y2)/2);
            _S.sizeXY(s,tileW,tileH);
            self.insert(s);
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this)&&this.g.initLevel();
        this.g.initBands();
        this.g.initHoles();
      },
      postUpdate(dt){
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["click.mp3","game_over.mp3","game_win.mp3",
                 "log3.png","log4.png","log5.png","log6.png","hole.png",
                 "items.png","grass.png","water.png","dirt.png","bush.png","frog.png","images/items.json"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);



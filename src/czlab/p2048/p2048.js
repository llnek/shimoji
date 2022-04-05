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

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_T,
           Ute2D:_U,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_, is}=Mojo;

    const
      UI_FONT= "Doki Lowercase",
      SplashCfg= {
        title:"2048",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _loadTiles=()=> [0,2,4,8,16, 32,64, 256,1024].map(n=> Mojo.tcached(`${n}.png`));
    const doBackDrop=(s)=> s.insert( _S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    const DIM=4;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _mkTiles(scene){
      let z=_S.sprite(_G.tileFrames[0]),
        t=_G.grid[0][0],
        w= t.x2-t.x1,
        h= t.y2-t.y1,
        K=w/z.width,
        out=_.fill(DIM, ()=> []);
      for(let pos,s,y=0;y<DIM;++y){
        for(let x=0;x<DIM;++x){
          out[y].push(0);
          s=_S.sprite(_G.tileFrames);
          pos=_G.grid[y][x];
          s.g.ROW=y;
          s.g.COL=x;
          _S.scaleXY(s,K,K);
          _S.anchorXY(s,0.5);
          s.x= _M.ndiv(pos.x1+pos.x2,2);
          s.y= _M.ndiv(pos.y1+pos.y2,2);
          s.m5.showFrame(numToFrame(0));
          _G.TILES.push(scene.insert(s));
        }
      }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function numToFrame(num){
      switch(num){
        case 0:return 0;
        case 2:return 1;
        case 4:return 2;
        case 8:return 3;
        case 16:return 4;
        case 32:return 5;
        case 64:
        case 128:return 6;
        case 256:
        case 512:return 7;
        case 1024:
        case 2048:return 8;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function setNumber(r,c,num){
      let K= Mojo.getScaleFactor(),
        n= numToFrame(num),
        s= _G.TILES[r*DIM+c];
      s.m5.showFrame(n);
      _G.tiles[r][c]=num;
      if(num>0){
        let t= _S.bmpText(`${num}`,UI_FONT,96*K);
        let c=n>2?"white":"black";
        _S.anchorXY(_S.tint(t,_S.color(c)),0.5);
        s.addChild(t);
      }
      if(num==2048)
        _.delay(CLICK_DELAY, ()=> _Z.run("EndGame", {

          fontSize:64*Mojo.getScaleFactor(),
          replay:{name:"PlayGame"},
          quit:{name:"Splash", cfg:SplashCfg},
          msg:"You Win!",
          winner:1

        }));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function postSwipe(){
      let p,z,out=[];
      for(let y=0;y<DIM;++y)
        for(let x=0;x<DIM;++x)
          if(_G.tiles[y][x]==0) out.push([y,x]);
      z=out.length;
      switch(z){
        case 0:
          p=-1;
          break;
        case 1:
          p=0;
          break;
        case 2:
          p=_.rand()>0.5?1:0;
          break;
        default:
          p=_.randInt(z);
          break;
      }
      if(p>=0){
        let r=out[p];
        setNumber(r[0],r[1],_.rand()>0.5?4:2)
      }else{
        _.delay(CLICK_DELAY, ()=> _Z.modal("EndGame",{

          fontSize:64*Mojo.getScaleFactor(),
          replay:{name:"PlayGame"},
          quit:{name:"Splash", cfg:SplashCfg},
          msg:"You Lose!",
          winner:0

        }));
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function refreshTiles(){
      _G.TILES.forEach(t=> t.removeChildren());
      Mojo.sound("slide.mp3").play();
      _G.tiles.forEach((r,y)=> r.forEach((c,x)=>{
        setNumber(y,x,c)
      }));
      postSwipe();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      swipeRight(){
        this.tiles.forEach(r=>this.compress(r,true));
        refreshTiles();
      },
      swipeLeft(){
        this.tiles.forEach(r=>{
          let out=this.compress(r.reverse()).reverse();
          for(let i=0;i<DIM;++i) r[i]=out[i];
        });
        refreshTiles();
      },
      swipeUp(){
        let out=[];
        for(let x=0;x<DIM;++x){
          out.length=0;
          for(let y=DIM-1;y>=0;--y){
            out.push(this.tiles[y][x]);
          }
          this.compress(out,true);
          out.reverse();
          for(let y=0;y<DIM;++y)
            this.tiles[y][x]=out[y];
        }
        refreshTiles();
      },
      swipeDown(){
        let out=[];
        for(let x=0;x<DIM;++x){
          out.length=0;
          for(let y=0;y<DIM;++y){
            out.push(this.tiles[y][x]);
          }
          this.compress(out,true);
          for(let y=0;y<DIM;++y)
            this.tiles[y][x]=out[y];
        }
        refreshTiles();
      },
      compress(arr,mutate){
        let k=arr.length,
          v2=null,
          v1=v2,
          out=_.fill(k,0);
        for(let j=arr.length-1;j>=0;--j){
          if(arr[j]==0){continue}
          if(v2===null){
            v2=arr[j]
          }else{
            v1=arr[j]
            if(v1==v2){
              out[--k]=v1+v2;
              v2=v1=null;
            }else{
              out[--k]=v2;
              v2=v1;
            }
          }
        }
        if(v2 !== null){
          out[--k]=v2
        }
        if(mutate)
          for(let i=0;i<out.length;++i) arr[i]=out[i];
        return out;
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      dispose(){
        _I.off(["swipe.down"],"swipeDown",_G);
        _I.off(["swipe.up"],"swipeUp",_G);
        _I.off(["swipe.left"],"swipeLeft",_G);
        _I.off(["swipe.right"],"swipeRight",_G);
        _G.dirRight.dispose();
        _G.dirLeft.dispose();
        _G.dirUp.dispose();
        _G.dirDown.dispose();
      },
      setup(){
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        _.inject(_G,{
          dirRight: _I.keybd(_I.RIGHT),
          dirLeft: _I.keybd(_I.LEFT),
          dirUp: _I.keybd(_I.UP),
          dirDown: _I.keybd(_I.DOWN),
          grid: _S.gridSQ(DIM, 0.95),
          TILES:[],
          tileFrames: _loadTiles(),
        });
        _G.tiles= _mkTiles(this);
        _.inject(this.g,{
          initLevel(){
            let v,r,c,i=2;
            while(i>0){
              r=_.randInt(DIM);
              c=_.randInt(DIM);
              if(_G.tiles[r][c]==0){
                setNumber(r,c,2);//_.rand()>0.5?2:2048;
                --i;
              }
            }
            _G.dirRight.press= ()=> _G.swipeRight();
            _G.dirLeft.press= ()=> _G.swipeLeft();
            _G.dirUp.press= ()=> _G.swipeUp();
            _G.dirDown.press= ()=> _G.swipeDown();
          }
        });

        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _I.on(["swipe.down"],"swipeDown",_G);
        _I.on(["swipe.up"],"swipeUp",_G);
        _I.on(["swipe.left"],"swipeLeft",_G);
        _I.on(["swipe.right"],"swipeRight",_G);
        this.g.initLevel();
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=>MojoH5({

    assetFiles: ["0.png","2.png","4.png",
                 "8.png", "16.png","32.png",
                 "64.png", "256.png","1024.png","bg.jpg",
                 "click.mp3","slide.mp3","game_over.mp3","game_win.mp3"],
    arena: {width:768,height:768},
    scaleToWindow: "max",
    scaleFit: "y",
    start(...args){ scenes(...args) }

  }));

})(this);



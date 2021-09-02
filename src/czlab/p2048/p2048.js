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

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_T,
           v2:_V,
           Game:_G,
           ute:_, is}=Mojo;

    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    const TITLE_FONT= "Big Shout Bob";
    const UI_FONT= "Doki Lowercase";
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _loadTiles(){
      return [0,2,4,8,16,
              32,64,
              256,1024].map(n=> Mojo.tcached(`${n}.png`))
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _mkTiles(scene){
      let z=_S.sprite(_G.tileFrames[0]);
      let t=_G.grid[0][0];
      let w= t.x2-t.x1;
      let h= t.y2-t.y1;
      let K=w/z.width;
      let out=[];
      for(let pos,s,r,y=0;y<_G.DIM;++y){
        r=[];
        for(let x=0;x<_G.DIM;++x){
          r.push(0);
          s=_S.sprite(_G.tileFrames);
          pos=_G.grid[y][x];
          s.g.ROW=y;
          s.g.COL=x;
          //s.x=pos.x1;
          //s.y=pos.y1;
          _S.scaleXY(s,K,K);
          _S.centerAnchor(s);
          s.x= int((pos.x1+pos.x2)/2);
          s.y= int((pos.y1+pos.y2)/2);
          s.m5.showFrame(_G.numToFrame(0));
          _G.TILES.push(s);
          scene.insert(s);
        }
        out.push(r);
      }
      return out;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.sizeXY(_S.sprite("bg.jpg"),Mojo.width,Mojo.height);
      scene.insert(_G.backDropSprite);
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      playClick(){
        Mojo.sound("click.mp3").play()
      },
      numToFrame(num){
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
      },
      setNumber(r,c,num){
        let K= Mojo.getScaleFactor(),
            n= this.numToFrame(num),
            s= this.TILES[r*_G.DIM+c];
        s.m5.showFrame(n);
        this.tiles[r][c]=num;
        if(num>0){
          let t= _S.bmpText(`${num}`,{fontSize:96*K,
                                      fontName:UI_FONT });
          let c=n>2?"white":"black";
          _S.centerAnchor(_S.tint(t,_S.color(c)));
          s.addChild(t);
        }
        if(num===2048){
          _I.resetAll();
          _.delay(343, ()=>{
            _Z.runScene("EndGame", {msg:"You Win!"});
          });
        }
      },
      postSwipe(){
        let p,z,out=[];
        for(let y=0;y<this.DIM;++y)
          for(let x=0;x<this.DIM;++x)
            if(this.tiles[y][x]===0) out.push([y,x]);
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
          this.setNumber(r[0],r[1],_.rand()>0.5?4:2)
        }else{
          _I.resetAll();
          _.delay(CLICK_DELAY, ()=> _Z.runScene("EndGame"));
        }
      },
      refreshTiles(){
        this.TILES.forEach(t=> t.removeChildren());
        Mojo.sound("slide.mp3").play();
        for(let v,r,y=0;y<this.DIM;++y){
          r=this.tiles[y];
          for(let c=0;c<this.DIM;++c){
            this.setNumber(y,c,r[c])
          }
        }
        this.postSwipe();
      },
      swipeRight(){
        this.tiles.forEach(r=>this.compress(r,true));
        this.refreshTiles();
      },
      swipeLeft(){
        this.tiles.forEach(r=>{
          let out=this.compress(r.reverse()).reverse();
          for(let i=0;i<this.DIM;++i) r[i]=out[i];
        });
        this.refreshTiles();
      },
      swipeUp(){
        let out=[];
        for(let x=0;x<this.DIM;++x){
          out.length=0;
          for(let y=this.DIM-1;y>=0;--y){
            out.push(this.tiles[y][x]);
          }
          this.compress(out,true);
          out.reverse();
          for(let y=0;y<this.DIM;++y)
            this.tiles[y][x]=out[y];
        }
        this.refreshTiles();
      },
      swipeDown(){
        let out=[];
        for(let x=0;x<this.DIM;++x){
          out.length=0;
          for(let y=0;y<this.DIM;++y){
            out.push(this.tiles[y][x]);
          }
          this.compress(out,true);
          for(let y=0;y<this.DIM;++y)
            this.tiles[y][x]=out[y];
        }
        this.refreshTiles();
      },
      compress(arr,mutate){
        let k=arr.length;
        let v2=null;
        let v1=v2;
        let out=_.fill(k,0);
        for(let j=arr.length-1;j>=0;--j){
          if(arr[j]===0){continue}
          if(v2===null){
            v2=arr[j]
          }else{
            v1=arr[j]
            if(v1===v2){
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
    _Z.defScene("Splash",{
      setup(){
        const verb = Mojo.touchDevice ? "Tap": "Click";
        const K= Mojo.getScaleFactor();
        const self=this;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=function(s){
          s=_S.bmpText("2048",{fontName:TITLE_FONT, fontSize: 120*K});
          _S.centerAnchor(s).tint=C_TITLE;
          self.insert(_V.set(s,Mojo.width/2, Mojo.height*0.3));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doPlayBtn=function(s,b,t){
          s=_S.bmpText(`${verb} to PLAY!`, {fontName:UI_FONT,fontSize:72*K});
          _S.centerAnchor(s).tint=_S.color("white");
          b=_I.mkBtn(s);
          t=_T.throb(b,0.99);
          b.m5.press=function(){
            _T.remove(t);
            b.tint=C_ORANGE;
            _G.playClick();
            _.delay(CLICK_DELAY, ()=>_Z.runSceneEx("PlayGame"));
          };
          self.insert(_V.set(b,Mojo.width/2, Mojo.height * 0.7));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        this.g.doTitle();
        this.g.doPlayBtn();
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("EndGame",{
      setup(options){
        let s1,s2,
            snd="game_over.mp3",
            s4,s5,s6,os={fontName:UI_FONT,
                         fontSize: 72*Mojo.getScaleFactor()};
        function space(s){ return _S.opacity(_S.bmpText("I",os),0) }
        if(options.msg) snd="game_win.mp3";
        s1=_S.bmpText("Game Over", os);
        s2=_S.bmpText(options.msg||"You Lose!", os);
        s4=_I.makeButton(_S.bmpText("Play Again?",os));
        s5=_S.bmpText(" or ",os);
        s6=_I.makeButton(_S.bmpText("Quit",os));
        s4.m5.press=()=>{ _Z.runSceneEx("PlayGame") };
        s6.m5.press=()=>{ _Z.runSceneEx("Splash") };
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const DIM=4;
        _.inject(_G,{
          TILES:[],
          DIM,
          grid: _S.gridSQ(DIM, 0.95),
          dirRight: _I.keybd(_I.RIGHT),
          dirLeft: _I.keybd(_I.LEFT),
          dirUp: _I.keybd(_I.UP),
          dirDown: _I.keybd(_I.DOWN)
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this);
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _G.tileFrames= _loadTiles(),
        _G.tiles= _mkTiles(this);
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          let v,r,c,i=2;
          while(i>0){
            r=_.randInt(DIM);
            c=_.randInt(DIM);
            if(_G.tiles[r][c]===0){
              _G.setNumber(r,c,2);//_.rand()>0.5?2:2048;
              --i;
            }
          }
          _G.dirRight.press= ()=>_G.swipeRight();
          _G.dirLeft.press= ()=>_G.swipeLeft();
          _G.dirUp.press= ()=>_G.swipeUp();
          _G.dirDown.press= ()=>_G.swipeDown();
        };

        Mojo.on(["swipe.down"],"swipeDown",_G);
        Mojo.on(["swipe.up"],"swipeUp",_G);
        Mojo.on(["swipe.left"],"swipeLeft",_G);
        Mojo.on(["swipe.right"],"swipeRight",_G);

        this.g.initLevel();
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["0.png","2.png","4.png",
                 "8.png", "16.png","32.png",
                 "64.png", "256.png","1024.png","bg.jpg",
                 "click.mp3","slide.mp3","game_over.mp3","game_win.mp3"],
    arena: {width:768,height:768},
    scaleToWindow: "max",
    scaleFit: "y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=>MojoH5(_$));

})(this);



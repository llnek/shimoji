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
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           v2:_V,
           Game:_G,
           ute:_, is}=Mojo;

    _.inject(_G,{
      loadTiles(){
        return [0,2,4,8,16,
                32,64,256,1024].map(n=> Mojo.tcached(`${n}.png`)) },
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
          case 2048:return 8; } },
      setNumber(r,c,num){
        let s= _G.TILES[r*_G.DIM+c];
        let n= _G.numToFrame(num);
        s.m5.showFrame(n);
        _G.tiles[r][c]=num;
        if(num>0){
          let t= _S.bitmapText(`${num}`,{fontSize:64,
                                             fontName:"unscii",
                                             tint:"black",align:"center"});
          _S.centerAnchor(t);
          s.addChild(t);
        }
      },
      postSwipe(){
        let p,z,out=[];
        for(let y=0;y<_G.DIM;++y)
          for(let x=0;x<_G.DIM;++x)
            if(_G.tiles[y][x]===0) out.push([y,x]);
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
          _G.setNumber(r[0],r[1],_.rand()>0.5?4:2) } },
      refreshTiles(){
        _G.TILES.forEach(t=> t.removeChildren());
        for(let v,r,y=0;y<_G.DIM;++y){
          r=this.tiles[y];
          for(let c=0;c<_G.DIM;++c){
            _G.setNumber(y,c,r[c])
          }
        }
        _G.postSwipe();
      },
      swipeRight(){
        _G.tiles.forEach(r => _G.compress(r,true));
        _G.refreshTiles();
      },
      swipeLeft(){
        _G.tiles.forEach(r => {
          let out=_G.compress(r.reverse()).reverse();
          for(let i=0;i<_G.DIM;++i) r[i]=out[i];
        });
        _G.refreshTiles();
      },
      swipeUp(){
        let out=[];
        for(let x=0;x<_G.DIM;++x){
          out.length=0;
          for(let y=_G.DIM-1;y>=0;--y){
            out.push(this.tiles[y][x]);
          }
          _G.compress(out,true);
          out.reverse();
          for(let y=0;y<_G.DIM;++y)
            this.tiles[y][x]=out[y];
        }
        _G.refreshTiles();
      },
      swipeDown(){
        let out=[];
        for(let x=0;x<_G.DIM;++x){
          out.length=0;
          for(let y=0;y<_G.DIM;++y){
            out.push(_G.tiles[y][x]);
          }
          _G.compress(out,true);
          for(let y=0;y<_G.DIM;++y)
            _G.tiles[y][x]=out[y];
        }
        _G.refreshTiles();
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

    _Z.defScene("bg",{
      setup(){
      }
    });

    _Z.defScene("level1",{
      _initLevel(){
        let v,r,c,i=2;
        while(i>0){
          r=_.randInt(_G.DIM);
          c=_.randInt(_G.DIM);
          if(_G.tiles[r][c]===0){
            _G.setNumber(r,c,2);//_.rand()>0.5?2:2048;
            --i;
          }
        }
        _G.dirRight=_I.keybd(_I.RIGHT);
        _G.dirLeft=_I.keybd(_I.LEFT);
        _G.dirUp=_I.keybd(_I.UP);
        _G.dirDown=_I.keybd(_I.DOWN);
        _G.dirRight.press=()=>{ _G.swipeRight() };
        _G.dirLeft.press=()=>{ _G.swipeLeft() };
        _G.dirUp.press=()=>{ _G.swipeUp() };
        _G.dirDown.press=()=>{ _G.swipeDown() }
      },
      _mkTiles(){
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
            s.x= MFL((pos.x1+pos.x2)/2);
            s.y= MFL((pos.y1+pos.y2)/2);
            s.m5.showFrame(_G.numToFrame(0));
            _G.TILES.push(s);
            this.insert(s);
          }
          out.push(r);
        }
        return out;
      },
      onDown(){
        _G.startXY= [Mojo.mouse.x, Mojo.mouse.y];
      },
      onUp(){
        let pos= [Mojo.mouse.x,Mojo.mouse.y];
        let v= _V.vecAB(_G.startXY,pos);
        let z= _V.len2(v);
        let n= _V.unit$(_V.normal(v));
        //up->down n(1,0)
        //bottom->up n(-1,0)
        //right->left n(0,1)
        //left->right n(0,-1)
        if(z > 40 && Math.abs(n[1]) > 0.8 || Math.abs(n[0]) > 0.8){
          if(n[0] > 0.8) {
            _G.swipeDown();
          }
          if(n[0] < -0.8) {
            _G.swipeUp();
          }
          if(n[1] > 0.8) {
            _G.swipeLeft();
          }
          if(n[1] < -0.8) {
            _G.swipeRight();
          }
        }
      },
      setup(){
        _G.TILES=[];
        _G.DIM=4;
        _G.grid= _S.gridSQ(_G.DIM,0.95);
        _G.tileFrames= _G.loadTiles();
        _G.tiles=this._mkTiles();
        this._initLevel();
        Mojo.on(["mousedown"],"onDown",this);
        Mojo.on(["mouseup"],"onUp",this);
        Mojo.on(["touchstart"],"onDown",this);
        Mojo.on(["touchend"],"onUp",this);
      }
    });
  }

  const _$={
    assetFiles: ["0.png","2.png","4.png",
                 "8.png", "16.png","32.png",
                 "64.png", "256.png","1024.png"],
    arena: {width:768,height:768},
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load", ()=>MojoH5(_$));

})(this);

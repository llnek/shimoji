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

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_F,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_, is}=Mojo;

    const C_TITLE=_S.color("#fff20f"),
      TITLE_FONT= "Big Shout Bob",
      UI_FONT= "Doki Lowercase",
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");

    const DIM=3,
      TILES=DIM*DIM,
      CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(scene)=> scene.insert(_S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const playSlide=()=> Mojo.sound("slide.mp3").play();
    const zix=(p)=> p.indexOf(0);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //deal with [row,col]
    function validMoves(p){
      let i=zix(p), x= i % DIM, y= _M.ndiv(i,DIM);
      let top= y-1, down=y+1, left=x-1, right=x+1;
      let v=[[top,x],[down,x]];
      let h=[[y,left],[y,right]];
      if(y==0){ //no top
        v.shift();
      }else if(y==DIM-1){ //no down
        v.pop();
      }
      if(x==0){ //no left
        h.shift();
      }else if(x==DIM-1){ //no right
        h.pop();
      }
      return v.concat(h);
    }

    function makeMove(p,move){
      let z=zix(p),
          m= move[0]*DIM + move[1], v= p[m];
      p[z]=v;
      p[m]=0;
      //console.log("makemove====> "+ p.join(","));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dbgShow(p){
      for(let s,y=0;y<DIM;++y){
        s="";
        for(let x=0;x<DIM;++x){
          s+= (""+p[y*DIM+x]);
          s+=",";
        }
        console.log(s);
      }
      return p;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function genPuzzle(dim){
      let g,p=_.fill(dim*dim,(i)=> i+1)
      //set the blank piece
      p[p.length-1]=0;
      g=p.slice();
      //randomize the grid
      for(let m,i=0;i<3*TILES;++i){
        m= validMoves(p);
        makeMove(p, _.randItem(m));
      }
      //dbgShow(p);
      return [g,p];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const verb = Mojo.touchDevice ? "Tap": "Click";
        const K= Mojo.getScaleFactor();
        const self=this;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=function(s){
          s=_S.bmpText("Sliding Tiles",
                       {fontName:TITLE_FONT, fontSize: 120*K});
          _S.tint(_S.anchorXY(s,0.5), C_TITLE);
          return self.insert(_V.set(s,Mojo.width/2, Mojo.height*0.3));
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doPlayBtn=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          t=_F.throb(s,0.747,0.747);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=> _Z.runSceneEx("PlayGame"));
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,Mojo.width/2,Mojo.height*0.7);
          return self.insert(_S.anchorXY(s,0.5));
        }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doPlayBtn();
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
        s4.m5.press=()=>_Z.runSceneEx("PlayGame");
        s6.m5.press=()=>_Z.runSceneEx("Splash");
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        let [goal,puz]= genPuzzle(DIM);
        _.inject(this.g,{
          initLevel(){
            let out={},
                grid= _S.gridSQ(DIM, 0.95,out),
                v,n,t,os={fontName:UI_FONT, fontSize: 72*K};
            grid.forEach((row,y)=> row.forEach((c,x)=>{
              let R=0.98,s=_S.sprite("tile.png");
              s.tint=_S.color("#bb3b58");
              _S.sizeXY(s, R*(c.x2-c.x1), R*(c.y2-c.y1));
              _S.anchorXY(_V.set(s, _M.ndiv(c.x1+c.x2,2),_M.ndiv(c.y1+c.y2,2)),0.5);
              n=y*DIM+x;
              v=puz[n];
              s.g.value=v;
              s.g.row=y;
              s.g.col=x;
              if(v==0){
                s.alpha=0.3;
              }else{
                t=_S.anchorXY(_S.bmpText(`${v}`,os),0.5);
                s.addChild(t);
                s.m5.press=(b)=>{
                  this.onClick(b);
                };
              }
              c.tile= self.insert(s);
            }));
            return _.inject(_G,{ puz,grid,goal })
          },
          onClick(b){
            let {row,col}=b.g,
                bx=b.x, by=b.y,
                z,zc, zr, g=_G.grid;
            g.forEach((row,y)=> row.forEach((c,x)=>{
              if(c.tile.g.value==0){
                zc=x; zr=y; z=c.tile;
              }else{
                c.tile.alpha=1;
              }
              _I.undoBtn(c.tile);
            }));

            //swap the blank and the `clicked`
            g[zr][zc].tile=b;
            b.g.row=zr;
            b.g.col=zc;
            b.x=z.x;
            b.y=z.y;

            g[row][col].tile=z;
            z.g.row=row;
            z.g.col=col;
            z.x=bx;
            z.y=by;

            makeMove(_G.puz, [row,col]);
            playSlide();
            !this.checkFinz() && this.showMoves();
          },
          checkFinz(){
            return goal.join(",") == puz.join(",")
          },
          showMoves(){
            let g=_G.grid,
                moves= validMoves(puz);
            moves.forEach(m=>{
              _I.mkBtn(_S.opacity(g[m[0]][m[1]].tile,0.7))
            });
          }
        })
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() && this.g.showMoves();
        _Z.runScene("AudioIcon",{
          xScale:K, yScale:K,
          xOffset: -10*K, yOffset:0
        });
      },
      postUpdate(){
        if(this.g.checkFinz()){
          this.m5.dead=true;
          console.log("You Win!");
          _Z.runScene("EndGame",{msg:"You Win!"});
        }
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=>MojoH5({

    assetFiles: ["tile.png","bg.jpg","audioOff.png","audioOn.png",
                 "click.mp3","slide.mp3","game_over.mp3","game_win.mp3"],
    arena: {width:768,height:768},
    scaleToWindow: "max",
    scaleFit: "y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }

  }));

})(this);



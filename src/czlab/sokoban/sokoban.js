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
           FX:_F,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_, is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const C_TITLE=_S.color("#fff20f"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b"),
      TITLE_FONT= "Big Shout Bob",
      UI_FONT= "Doki Lowercase";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doCheckPt(){
      let m={};
      for(let o,i=0;i<_G.items.length;++i){
        o=_G.items[i];
        if(o.g.value==3){
          m[o.m5.uuid]= [o.g.row,o.g.col];
        }
      }
      m[_G.player.m5.uuid]=[_G.player.g.row,_G.player.g.col];
      _G.history.push(m);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function getItem(y,x){
      for(let o,i=0;i<_G.items.length;++i){
        o=_G.items[i]; if(o.g.row==y && o.g.col==x) return o; }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function findCrate(y,x){
      for(let o,i=0;i<_G.items.length;++i){
        o=_G.items[i]; if(o.g.row==y && o.g.col==x && o.g.value==3) return o; }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const emptySlot=(y,x)=> _G.level[y][x]==0 || _G.level[y][x]==2;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function holesFilled(){
      let goals=0,found=0;
      for(let o,i=0;i<_G.items.length;++i){
        o=_G.items[i];
        if(o.g.value==2){
          ++goals;
          if(findCrate(o.g.row,o.g.col)){ ++found }else{ break }
        }
      }
      return goals>0 && goals==found;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //floor,wall,hole,box,player
    function testMove(y,x,dirY,dirX){
      let hit= findCrate(y,x);
      if(hit){
        let r=hit.g.row,
          c=hit.g.col,
          o=findCrate(r+dirY,c+dirX);
        if(o)
          return false;
        o= getItem(r+dirY, c+dirX);
        return o? (o.g.value==3?false: o.g.value==2) : emptySlot(r+dirY,c+dirX)
      }else{
        return emptySlot(y,x)
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doMove(y,x,dirY,dirX){
      //update history
      doCheckPt();
      let z,o= findCrate(y,x);
      if(o){
        let r=o.g.row,
          c=o.g.col;
        o.g.row=r+dirY;
        o.g.col=c+dirX;
        //o.x += dirX * o.width;
        //o.y += dirY * o.height;
        _F.tweenXY(o,_F.SMOOTH,  o.x + dirX * o.width, o.y + dirY * o.height);
      }
      _G.player.g.row=y;
      _G.player.g.col=x;
      //_G.player.x += dirX * _G.player.width;
      //_G.player.y += dirY * _G.player.height;
      z=_F.tweenXY(_G.player,_F.SMOOTH, _G.player.x + dirX * _G.player.width, _G.player.y + dirY * _G.player.height);
      z.onComplete=()=> _G.player.m5.showFrame(0);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function undoMove(){
      if(!_G.history.length>0){return}
      let pos,c,s,m= _G.history.pop();
      _.keys(m).forEach(k=>{
        pos=m[k];
        s=_G.gameScene.getChildById(k);
        s.g.row=pos[0];
        s.g.col=pos[1];
        c=_G.grid[s.g.row][s.g.col];
        s.y=c.y1;
        s.x=c.x1;
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      swipeRight(){
        let {row,col}= _G.player.g;
        let c=col+1;
        if(c>=_G.level[0].length){return}
        if(testMove(row,c,0,1)){
          _G.player.m5.showFrame(3)
          doMove(row,c,0,1);
        }
      },
      swipeLeft(){
        let {row,col}= _G.player.g;
        let c=col-1;
        if(c<=0){return}
        if(testMove(row,c,0,-1)){
          _G.player.m5.showFrame(2);
          doMove(row,c,0,-1);
        }
      },
      swipeUp(){
        let {row,col}= _G.player.g;
        let r=row-1;
        if(r<=0){return}
        if(testMove(r,col,-1,0)){
          _G.player.m5.showFrame(1);
          doMove(r,col,-1,0);
        }
      },
      swipeDown(){
        let {row,col}= _G.player.g;
        let r=row+1;
        if(r>=_G.level.length){return}
        if(testMove(r,col,1,0)){
          _G.player.m5.showFrame(0);
          doMove(r,col,1,0);
        }
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          W2=Mojo.width/2,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("Sokoban",TITLE_FONT,120*K);
            _S.tint(s,C_TITLE);
            _V.set(s,W2,Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT,84*K);
            t=_F.throb(s,0.747,0.747);
            function cb(){
              Mojo.off(["single.tap"],cb);
              _F.remove(t);
              _S.tint(s,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=> _Z.runEx("PlayGame"));
            }
            Mojo.on(["single.tap"],cb);
            _V.set(s,W2,Mojo.height*0.7);
            return self.insert(_S.anchorXY(s,0.5));
          }
        });
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("EndGame",{
      setup(options){
        let snd="game_over.mp3",
          os={fontName:UI_FONT,
              fontSize: 72*Mojo.getScaleFactor()},
          space=()=> _S.opacity(_S.bmpText("I",os),0),
          s1=_S.bmpText("Game Over", os),
          s2=_S.bmpText(options.msg||"You Lose!", os),
          s4=_I.makeButton(_S.bmpText("Play Again?",os)),
          s5=_S.bmpText(" or ",os),
          s6=_I.makeButton(_S.bmpText("Quit",os));
        s4.m5.press=()=> _Z.runEx("PlayGame");
        s6.m5.press=()=> _Z.runEx("Splash");
        if(options.msg) snd="game_win.mp3";
        Mojo.sound(snd).play();
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const GLYPH=" #.ox";//floor,wall,hole,box,player
    const MAP1= "########,"+
                "#####x.#,"+
                "####.oo#,"+
                "#### o #,"+
                "### .# #,"+
                "###    #,"+
                "###  ###,"+
                "########";
    function mapToLevel(m){
      let row,grid=[];
      m.split(",").filter(x=>x.length).forEach(s=>{
        row=[];
        s.split("").forEach(c=>{
          c=GLYPH.indexOf(c);
          _.assert(c>=0,"bad map");
          row.push(c);
        });
        grid.push(row);
      });
      for(let i=1;i<grid.length;++i)
        _.assert(grid[i-1].length==grid[i].length,"uneven mp(width)");
      //_.assert(grid.length==grid[0].length,"uneven mp(height)");
      return grid;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let level= mapToLevel(MAP1),
              out={},
              items=[],
              h=level.length,
              w= level[0].length,
              player,grid=_S.gridXY([w,h],0.9,0.9,out);
            let c=grid[0][0],
              W=c.x2-c.x1, H=c.y2-c.y1;
            function cs(y,x,[n,value]){
              let s;
              if(value==4){
                s=_S.spriteFrom("down.png","up.png","left.png","right.png");
              }else{
                s=_S.sprite(n);
              }
              s=_S.sizeXY(s,W,H);
              s.g.row=y;
              s.g.col=x;
              s.g.value=value;
              _V.set(s,grid[y][x].x1,grid[y][x].y1);
              return self.insert(s);
            }
            //floor,wall,water,hole,box,player
            //do wall & floor first
            for(let s,r,x,y=0;y<level.length;++y)
            for(r=level[y], x=0; x<r.length; ++x){
              if(r[x]==1){
                cs(y,x,["wall.png",1]);
              }else{
                cs(y,x, ["water.png",0]);
              }
              if(r[x]==2){
                level[y][x]=0;
                items.push(cs(y,x,["hole.png",2]));
              }
            }
            for(let v,s,r,x,y=0;y<level.length;++y)
            for(r=level[y], x=0; x<r.length; ++x){
              if(r[x]==3){
                level[y][x]=0;
                items.push(cs(y,x,["crate.png",3]));
              }
              if(r[x]==4){
                level[y][x]=0;
                items.push(player=cs(y,x,["",4]));
              }
            }
            //put holes in front
            items.sort((a,b)=>{
              return a.g.value==2?-1:1
            });
            let dirRight= _I.keybd(_I.RIGHT),
                dirLeft= _I.keybd(_I.LEFT),
                dirUp= _I.keybd(_I.UP),
                dirDown= _I.keybd(_I.DOWN);
            _.inject(_G,{
              level,grid,tileW:W,tileH:H,
              history:[],
              gameScene:self,
              items,player,dirRight, dirLeft, dirUp, dirDown
            });
            Mojo.on(["swipe.down"],"swipeDown",_G);
            Mojo.on(["swipe.up"],"swipeUp",_G);
            Mojo.on(["swipe.left"],"swipeLeft",_G);
            Mojo.on(["swipe.right"],"swipeRight",_G);
            dirRight.press= ()=>_G.swipeRight();
            dirLeft.press= ()=>_G.swipeLeft();
            dirUp.press= ()=>_G.swipeUp();
            dirDown.press= ()=>_G.swipeDown();
            //init history
            //doCheckPt();
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this)&&this.g.initLevel();
        _Z.run("HUD");
      },
      dispose(){
        Mojo.off(_G);
      },
      postUpdate(dt){
        if(holesFilled()){
          this.m5.dead=true;
          _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{msg: "You Win!"}));
        }
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        let K=Mojo.getScaleFactor(),
          g=_G.grid[_G.grid.length-1][_G.grid[0].length-1],
          c,p,s,pad=5*K;
        for(let i=0;i<4;++i){
          s= _I.mkBtn(_S.anchorXY(_S.sprite("button.png"),0.5));
          _S.sizeXY(s,_G.tileW,_G.tileH);
          if(i==3){
            c=_S.anchorXY(_S.sprite("arrowLeft.png"),0.5);
            _S.uuid(s,"#<-");
          }
          if(i==2){
            c=_S.anchorXY(_S.sprite("arrowRight.png"),0.5);
            _S.uuid(s,"#->");
          }
          if(i==1){
            c=_S.anchorXY(_S.sprite("arrowUp.png"),0.5);
            _S.uuid(s,"#^^");
          }
          if(i==0){
            c=_S.anchorXY(_S.sprite("arrowDown.png"),0.5);
            _S.uuid(s,"#vv");
          }
          c.height= s.height;
          c.width= s.width;
          c.tint=_S.color("orange");
          s.addChild(c);
          s.m5.press=(b)=>{
            switch(b.m5.uuid){
              case "#<-": _G.swipeLeft(); break;
              case "#->": _G.swipeRight(); break;
              case "#^^": _G.swipeUp(); break;
              case "#vv": _G.swipeDown(); break;
            }
          };
          if(!p){
            _V.set(s,g.x2+pad+s.width/2, g.y1+s.height/2);
          }else{
            _S.pinAbove(p,s,pad);
          }
          p=this.insert(s);
        }
        //////
        g=_G.grid[0][_G.grid[0].length-1];
        s= _I.mkBtn(_S.anchorXY(_S.sprite("button.png"),0.5));
        _S.sizeXY(s,_G.tileW,_G.tileH);
        _V.set(s,g.x2+pad+s.width/2, g.y1+s.height/2);
        c=_S.anchorXY(_S.sprite("undo.png"),0.5);
        c.tint=_S.SomeColors.orange;
        s.addChild(c);
        s.m5.press=()=>undoMove();
        this.insert(s);
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=>MojoH5({
    assetFiles: ["click.mp3","game_over.mp3","game_win.mp3",
      "button.png","arrowUp.png","arrowDown.png","arrowLeft.png","arrowRight.png",
      "left.png","right.png","up.png","down.png","undo.png",
                 "wall.png","hole.png","grass.png","water.png","crate.png"],
    arena: {width:1680,height:1050},
    scaleToWindow: "max",
    scaleFit: "y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }

  }));

})(this);



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
           Ute2D:_U,
           FX:_F,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_, is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT= "Doki Lowercase",
      SplashCfg= {
        title:"Sokoban",
        action: {name:"PlayGame"},
        clickSnd:"click.mp3",
      };


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
      let cnt=1,z,o= findCrate(y,x);
      _G.tweenCnt=0;
      if(o){
        let r=o.g.row,
          c=o.g.col;
        o.g.row=r+dirY;
        o.g.col=c+dirX;
        //o.x += dirX * o.width;
        //o.y += dirY * o.height;
        z=_F.tweenXY(o,_F.SMOOTH,  o.x + dirX * o.width, o.y + dirY * o.height,30);
        z.onComplete=()=>{
          --_G.tweenCnt
        };
        ++cnt;
      }
      _G.player.g.row=y;
      _G.player.g.col=x;
      //_G.player.x += dirX * _G.player.width;
      //_G.player.y += dirY * _G.player.height;
      z=_F.tweenXY(_G.player,_F.SMOOTH, _G.player.x + dirX * _G.player.width, _G.player.y + dirY * _G.player.height,30);
      z.onComplete=()=>{
        --_G.tweenCnt;
        _G.player.m5.showFrame(0);
      }
      _G.tweenCnt=cnt;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function undoMove(){
      if(!_G.history.length>0){return}
      if(_G.tweenCnt!=0){return}
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
        if(_G.tweenCnt!=0){return}
        let {row,col}= _G.player.g;
        let c=col+1;
        if(c>=_G.level[0].length){return}
        if(testMove(row,c,0,1)){
          _G.player.m5.showFrame(3)
          doMove(row,c,0,1);
        }
      },
      swipeLeft(){
        if(_G.tweenCnt!=0){return}
        let {row,col}= _G.player.g;
        let c=col-1;
        if(c<=0){return}
        if(testMove(row,c,0,-1)){
          _G.player.m5.showFrame(2);
          doMove(row,c,0,-1);
        }
      },
      swipeUp(){
        if(_G.tweenCnt!=0){return}
        let {row,col}= _G.player.g;
        let r=row-1;
        if(r<=0){return}
        if(testMove(r,col,-1,0)){
          _G.player.m5.showFrame(1);
          doMove(r,col,-1,0);
        }
      },
      swipeDown(){
        if(_G.tweenCnt!=0){return}
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

    const MAP2= "########,"+
                "###   ##,"+
                "#.xo  ##,"+
                "### o.##,"+
                "#.##o ##,"+
                "# # . ##,"+
                "#o ooo.#,"+
                "#   .  #,"+
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
            let level= mapToLevel(MAP2),
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
              tweenCnt:0,
              gameScene:self,
              items,player,dirRight, dirLeft, dirUp, dirDown
            });
            _I.on(["swipe.down"],"swipeDown",_G);
            _I.on(["swipe.up"],"swipeUp",_G);
            _I.on(["swipe.left"],"swipeLeft",_G);
            _I.on(["swipe.right"],"swipeRight",_G);
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
          _S.die(this);
          _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{

            fontSize:64*Mojo.getScaleFactor(),
            replay:{name:"PlayGame"},
            quit:{name:"Splash", cfg:SplashCfg},
            msg:"You Win!",
            winner:1

          }));
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

    _Z.run("Splash",SplashCfg);

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=>MojoH5({
    assetFiles: ["click.mp3","game_over.mp3","game_win.mp3",
      "button.png","arrowUp.png","arrowDown.png","arrowLeft.png","arrowRight.png",
      "left.png","right.png","up.png","down.png","undo.png",
                 "wall.png","hole.png","grass.png","water.png","crate.png"],
    arena: {width:1344,height:840},
    scaleToWindow: "max",
    scaleFit: "x",
    start(...args){ scenes(...args) }

  }));

})(this);



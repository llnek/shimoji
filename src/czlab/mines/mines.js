/* Licensed under the Apache License, Version 2.0 (the "License");
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

(function(window){

  "use strict";

  /**/
  function scenes(Mojo){
    const {Sprites:_S,
           Scenes:_Z,
           Input:_I,
           Game:_G,
           ute:_,is}=Mojo;
    const C_WHITE=_S.color("#ffffff");
    const C_BG= _S.color("#25A65B");
    const C_TITLE=_S.color("#fff20f");
      //"#ff9f0f"
      //"#f75539"
      //"#eef838"
    const LINE_COLOR=_S.color("#2abb67");//"#bb8044"
    const TEXT_COLOR=_S.color("#2abb67");
    const C_NUM=_S.color("#24a159");
    const C_BOX=_S.color("#e1fc7e"); //"#fcf97e"
    const int=Math.floor;

    const V_MINE=9;
    const V_MARKER=99;

    /**/
    function isValid(row,col){
      return row>=0 && col>=0 && row<_G.grid.length && col<_G.grid[0].length }

    /**/
    function gameOver(){
      _I.reset();
      Mojo.mouse.reset();
      _Z.runScene("EndGame");
    }

    /**Show the mine, then play the animation of explosion. */
    function boom(scene,cell){
      let x,y,s= _S.centerAnchor(_S.sprite("mine.png"));
      [x,y]=_S.centerXY(cell.sprite);
      s.x=x; s.y=y;
      _S.sizeXY(s,cell.sprite.width, cell.sprite.height);
      _S.scaleBy(s,0.8, 0.8);
      cell.sprite.visible=false;
      //show the mine
      scene.insert(s);
      //play the explosion animation
      s= _S.spriteFrom("boom0.png","boom1.png","boom2.png",
                       "boom3.png","boom4.png","boom5.png","boom6.png");
      _S.centerAnchor(s);
      s.x=x; s.y=y;
      //animate once only
      s.loop=false;
      scene.insert(s);
      //when explosion ends, show the gameover screen
      s.onComplete=()=>{
        _.delay(100,()=>{
          _S.remove(s);//clear the explosion
          _.delay(100,gameOver);//show the gameover scene
        });
      };
      //start the animation
      s.m5.playFrames();
      _G.gameOver=true;
      //boom!
      Mojo.sound("boom.ogg").play();
    }

    /**when the flag is dropped onto a cell */
    function onDropped(scene,B){
      let found,
          rows=_G.grid.length,
          cols=_G.grid[0].length;
      for(let y=0; y<rows; ++y){
        for(let s,cell,x=0; x<cols; ++x){
          cell= _G.grid[y][x];
          if(Mojo.mouse.hitTest(cell.sprite)){
            if(!cell.opened && B.g.value===V_MARKER){
              if(cell.marker){
                //already flagged so clear the flag
                cell.marker=_S.remove(cell.marker)
                ++_G.minesCount;
              }else{
                if(_G.minesCount>0) --_G.minesCount;
                //place a flag on the cell
                s=_S.centerAnchor(_S.sprite("rflag.png"));
                _S.sizeXY(s,cell.sprite.width,cell.sprite.height);
                _S.scaleBy(s, 0.5, 0.5);
                [s.x,s.y]= _S.centerXY(cell.sprite);
                cell.marker=s;
                scene.insert(s);
              }
              found=true;
              Mojo.sound("drop.ogg").play();
              _G.minesText.text =_.prettyNumber(_G.minesCount,2);
            }
            break;
          }
        }
      }
      //move the flag icon back to default spot
      B.x=B.g.oldx;
      B.y=B.g.oldy;
      /*
      _.delay(0, ()=>{
        checkEnd(scene);
        if(!_G.gameOver && !_G.timerStarted) _.delay(1000,updateTimer);
      });
      */
    }

    /**/
    function initLevel(scene,cols,rows,target){
      //top left corner
      let sx=_G.arena.x,
          sy=_G.arena.y;
      placeBombs(rows,cols,target);
      calcBombs();
      for(let y=0; y<rows; ++y){
        for(let g,s,cell,x=0;x<cols;++x){
          cell=_G.grid[y][x];
          cell.row=y;
          cell.col=x;
          g=_.randInt2(1,4);
          cell.sprite= s=_S.sprite(`ground${g}.png`);
          s.x=sx+cell.x1;
          s.y=sy+cell.y1;
          _S.sizeXY(s, cell.x2-cell.x1, cell.y2-cell.y1);
          s.m5.press=()=>{
            //maybe start the timer
            if(!_G.timerStarted) _.delay(0,updateTimer);
            if(cell.marker){return}
            _I.undoButton(s);
            if(cell.value===V_MINE){
              boom(scene,cell)
            }else{
              if(expand(scene,cell.row,cell.col)>3){
                Mojo.sound("expand.ogg").play()
              }
              checkEnd(scene)
            }
          };
          //make cell clickable
          scene.insert(_I.makeButton(s));
        }
      }
      _G.timerStarted=false;
      _G.gameOver=false;
    }

    /**/
    function showAll(scene){
      let rows=_G.grid.length,
          cols=_G.grid[0].length;
      for(let y=0;y<rows;++y){
        for(let n,s,cell,x=0;x<cols;++x){
          cell=_G.grid[y][x];
          if(!cell.opened){
            n= cell.value==9? "mine.png": `${cell.value}.png`;
            s=_S.centerAnchor(_S.sprite(n));
            _S.sizeXY(s,cell.sprite.width, cell.sprite.height);
            if(cell.value===9){
              _S.scaleBy(s, 0.8,0.8);
            }else{
              _S.scaleBy(s, 0.5, 0.5);
              s.tint=_S.color("#e2e55c");
            }
            [s.x,s.y]=_S.centerXY(cell.sprite);
            if(cell.marker) _S.remove(cell.marker);
            cell.marker=null;
            cell.sprite.visible=false;
            scene.insert(s);
          }
        }
      }
    }

    /**If all the mines are correctly marked? */
    function checkEnd(scene){
      let opened=0,
          found=0,
          pending=[],
          rows=_G.grid.length,
          cols=_G.grid[0].length;
      for(let y=0;y<rows;++y){
        for(let cell,x=0;x<cols;++x){
          cell=_G.grid[y][x];
          if(cell.opened) ++opened;
          else if(cell.marker && cell.value=== V_MINE) ++found;
          else pending.push(cell);
        }
      }
      if(found===Mojo.u.dimXY[2] ||
         pending.filter(c=> c.value=== V_MINE).length===pending.length){
        _G.gameOver=true;
        _G.lastWin=1;
        showAll(scene);
        _.delay(100, gameOver);
      }
    }

    /**Randomly place mines around */
    function placeBombs(rows,cols,target){
      let n=rows*cols,
          x,y,p,t=0;
      while(t<target){
        p=_.randInt2(0,n-1);
        y=int(p/cols);
        x=p%cols;
        if(_G.grid[y][x].value !== V_MINE){
          ++t;
          _G.grid[y][x].value=V_MINE;
        }
      }
    }

    /**Indicates how many mines are around this cell */
    function calcBombs(){
      let rows=_G.grid.length,
          cols=_G.grid[0].length,
          calc=(r,c)=>{
            return isValid(r,c) && _G.grid[r][c].value==V_MINE ?1:0 };

      for(let y=0; y<rows; ++y){
        for(let t,x=0; x<cols; ++x){
          t=0;
          if(_G.grid[y][x].value !== V_MINE){
            //neighbours
            _G.grid[y][x].value = calc(y+1,x) +
                                  calc(y,x+1) +
                                  calc(y-1,x) +
                                  calc(y,x-1) +
                                  calc(y+1,x+1) +
                                  calc(y-1,x-1) +
                                  calc(y-1,x+1) +
                                  calc(y+1,x-1);
          }
        }
      }
    }

    /**/
    function expand(scene,row,col){
      if(!isValid(row,col)){return 0}
      let sum=0,
          x,y,s,
          cell= _G.grid[row][col];
      if(!cell.opened && cell.value!==V_MINE && cell.value !== V_MARKER){
        cell.sprite.visible=false;
        cell.opened=true;
        sum=1;
        if(cell.value!=0){
          s=_S.centerAnchor(_S.sprite(`${cell.value}.png`));
          _S.sizeXY(s,cell.sprite.width, cell.sprite.height);
          _S.scaleBy(s, 0.5, 0.5);
          s.tint=_S.color("#e2e55c");
          [s.x,s.y]=_S.centerXY(cell.sprite);
          //show the hint number
          scene.insert(s);
        }else{
          sum += expand(scene,row-1,col-1);
          sum += expand(scene,row-1,col);
          sum += expand(scene,row-1,col+1);
          sum += expand(scene,row,col-1);
          sum += expand(scene,row,col+1);
          sum += expand(scene,row+1,col-1);
          sum += expand(scene,row+1,col);
          sum += expand(scene,row+1,col+1);
        }
      }
      return sum;
    }

    /**/
    function initBg(scene){
      _S.repeatSprite("grass.png",true,true,Mojo.width,Mojo.height).forEach(s=>scene.insert(s))
    }

    /**/
    function initHud(scene){
      let s1,s2,c,s,
          gap=10,
          fz=Mojo.getScaleFactor() * 36;
      s= _G.flag=_S.sprite("box.png");
      s.addChild(c= _S.sprite("rflag.png"));
      _S.centerAnchor(c);
      [c.x,c.y]= _S.centerXY(s);
      _S.sizeXY(s,_G.CELLW, _G.CELLH);
      _S.scaleBy(c,0.5,0.5);
      _I.makeDrag(s);
      s.m5.onDragDropped=()=>{
        onDropped(scene, _G.flag);
        if(!_G.timerStarted) _.delay(1000,updateTimer);
      };
      _S.pinTop(_G.bg,s);
      //save the pos so that we know where to move back
      s.g.oldx=s.x;
      s.g.oldy=s.y;
      s.g.value=V_MARKER;
      scene.insert(_G.flag);
      //indicate how many mines are hidden
      _G.minesCount=Mojo.u.dimXY[2];
      s= _G.minesText= _S.bitmapText(`${_G.minesCount}`,{fontSize:fz});
      s.tint=C_TITLE;
      _S.pinTop(_G.bg,s,gap,0);
      scene.insert(s);
      s1=_S.sprite("mine.png");
      _S.sizeXY(s1,_G.CELLW, _G.CELLH);
      _S.scaleBy(s1, 0.6, 0.6);
      s.x += s1.width+gap;
      _S.pinLeft(s,s1,gap,0.5);
      scene.insert(s1);
      //show the timer
      s=_S.bitmapText(`000`,{fontSize:fz});
      s.tint=C_TITLE;
      _S.pinTop(_G.bg,s,gap,1);
      scene.insert(s);
      s1=_S.sprite("clock.png");
      _S.sizeXY(s1,_G.CELLW, _G.CELLH);
      _S.scaleBy(s1, 0.6, 0.6);
      _S.pinLeft(s,s1,gap,0.5);
      scene.insert(s1);
      //for the timer
      _G.timerText=s;
      _G.timerSecs=0;
    }

    /**/
    function updateTimer(){
      let msg= _.prettyNumber(++_G.timerSecs,3);
      _G.timerText.text=`${msg}`;
      _G.timerStarted=true;
      if(!_G.gameOver)
        _.delay(1000, updateTimer);
    }

    /**/
    function addBg(scene){
      _S.repeatSprite("grass.png",true,true,Mojo.width,Mojo.height).forEach(s=>scene.insert(s));
    }

    /**/
    _Z.defScene("Splash",{
      setup(){
        let verb = Mojo.touchDevice ? "Tap": "Click";
        let b,msg,K= Mojo.getScaleFactor();
        addBg(this);
        msg=_S.bitmapText(`Minesweeper`,
                          {fontName:"Big Shout Bob",
                           align:"center", fontSize:120*K});
        msg.tint=C_TITLE;
        msg.x=Mojo.width/2;
        msg.y=Mojo.height*0.3;
        this.insert( _S.centerAnchor(msg));
        //
        msg=_S.bitmapText(`${verb} to play!`,
                          {fontName:"NineteenOhFive",
                           align:"center", fontSize:48*K});
        msg.tint=_S.color("#ffffff");
        //in pixi, no fontSize, defaults to 26, left-align
        b=_I.makeButton(msg);
        b.m5.press= ()=> _Z.replaceScene(this,"MainMenu");
        b.x=Mojo.width/2;
        b.y=Mojo.height * 0.7;
        this.insert( _S.centerAnchor(b));
      }
    });

    /**/
    _Z.defScene("MainMenu",{
      setup(){
        let fn="NineteenOhFive";
        let s,b1,b2,b3,gap,fz=Mojo.getScaleFactor()*64;
        s=_S.bitmapText("Easy",{fill:"#ffffff",
                                fontName:fn,fontSize:fz,align:"center"});
        b1=_I.makeButton(_S.uuid(s,"#easy"));
        s=_S.bitmapText("Medium",{fill:"#ffffff",
                                  fontName:fn, fontSize:fz,align:"center"});
        b2=_I.makeButton(_S.uuid(s,"#medium"));
        s=_S.bitmapText("Hard",{fill:"#ffffff",
                                fontName:fn, fontSize:fz,align:"center"});
        b3=_I.makeButton(_S.uuid(s,"#hard"));

        let pad,cb=(btn)=>{
          let i;
          switch(btn.m5.uuid){
            case "#easy": i=1; break;
            case "#medium": i=2; break;
            case "#hard": i=3; break;
          }
          Mojo.u.dimXY= Mojo.u.levels[i];
          _Z.replaceScene(this,"GamePlay");
        };

        pad=int(b3.height);
        b1.m5.press=cb;
        b2.m5.press=cb;
        b3.m5.press=cb;

        addBg(this);
        this.insert(_Z.layoutY([b1,b2,b3],{bg:"#cccccc", opacity:0.3, padding:pad}));
      }
    });

    /**/
    _Z.defScene("EndGame",{
      setup(){
        let fn="NineteenOhFive",
            fz=Mojo.getScaleFactor() * 36;
        let msg= `You ${_G.lastWin>0 ? "win":"lose"}!`;
        let space=()=>{
          let s=_S.bitmapText("I", {fontName:fn,fontSize:fz});
          s.alpha=0;
          return s;
        };
        let b1=_I.makeButton(_S.bitmapText("Play Again?",
                                           {fontName:fn,
                                            align:"center",fontSize:fz}));
        let b2=_I.makeButton(_S.bitmapText("Quit",
                                           {fontName:fn,
                                            align:"center",fontSize:fz}));
        let m1=_S.bitmapText("Game Over",{fontName:fn,
                                          align:"center",fontSize:fz});
        let m2=_S.bitmapText(msg,{fontName:fn,
                                  align:"center",fontSize:fz});
        let gap=_S.bitmapText("or",{fontName:fn,
                                    align:"center",fontSize:fz});
        b1.m5.press=()=>{ _Z.runSceneEx("MainMenu") };
        b2.m5.press=()=>{ _Z.runSceneEx("Splash") };
        Mojo.sound(_G.lastWin>0?"game_win.wav":"game_over.wav").play();
        this.insert(_Z.layoutY([m1, m2, space(), space(), space(),b1, gap, b2],{bg:C_BG,opacity:1}));
      }
    });

    /**/
    _Z.defScene("GamePlay",{
      setup(options){
        let s,w,h,bb,dim=Mojo.u.dimXY;
        addBg(this);
        //arena is the area containing the cells
        _G.grid= _S.gridXY([dim[0],dim[1]],0.9,0.7,_G.arena={x:0,y:0});
        _G.gfx=_S.graphics();
        //figure out size of a cell
        s=_G.grid[0][0];
        _G.CELLW=s.x2-s.x1;
        _G.CELLH=s.y2-s.y1;
        //draw the grid
        bb=_S.gridBBox(_G.arena.x,_G.arena.y,_G.grid);
        _S.drawGridLines(_G.arena.x, _G.arena.y,_G.grid,1,C_NUM,_G.gfx);
        _S.drawGridBox(bb,1,C_NUM,_G.gfx);
        //use this to easily pin other widgets
        _G.bg=_S.rect(_G.arena.width,_G.arena.height,false,C_NUM,1);
        _G.bg.x=_G.arena.x;
        _G.bg.y=_G.arena.y;
        this.insert(_G.bg);
        //level initialization
        initLevel(this,dim[0],dim[1],dim[2]);
        this.insert(_G.gfx);
        //show other UI stuff
        initHud(this);
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["clock.png","boom.ogg","expand.ogg","drop.ogg","game_over.wav","game_win.wav","tiles.png","images/tiles.json"],
    XXassetFiles:["1.png","2.png","3.png","4.png","5.png","6.png","7.png","8.png","boom.ogg", "boom0.png","boom1.png","boom2.png","boom3.png","boom4.png","boom5.png","boom6.png", "grass.png","ground1.png","ground2.png","ground3.png","ground4.png","mine.png","rflag.png","box.png"],
    arena: {width: 920, height: 920},
    scaleToWindow:"max",
    scaleFit:"y",
    levels: {
      1: [9,9,10],
      2: [16,16,40],
      3: [30,16,99]
    },
    dimXY: null,
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //one small step for...
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


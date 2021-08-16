(function(window){

  "use strict";

  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const TEXT_COLOR=_S.color("#f2f429");
    const ORANGE=_S.color("#f2ce33");
    const BLUE=_S.color("#17ccff");
    const BGCOLOR=BLUE;
    const int=Math.floor;

    function boom(scene,c){
      let x,y,s= _S.sprite("boom.png");
      [x,y]=_S.centerXY(c.sprite);
      _S.centerAnchor(s);
      s.x=x;
      s.y=y;
      s.width=c.sprite.width;
      s.height=c.sprite.height;
      //s.scale.x *=0.5;
      //s.scale.y *=0.5;
      c.sprite.visible=false;
      _G.gameOver=true;
      scene.insert(s);
      _.delay(100,()=>alert("You lose!"));
    }

    function onDropped(scene,B){
      let found;
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let s,c,x=0;x<_G.grid[0].length;++x){
          c=r[x];
          if(Mojo.mouse.hitTest(c.sprite)){
            if(!c.opened){
              if(B.g.value===99){
                if(c.marker){
                  _S.remove(c.marker);
                  c.marker=null;
                }else{
                  let m,n;
                  [m,n]= _S.centerXY(c.sprite);
                  s=_S.sprite("wflag.png");
                  _S.centerAnchor(s);
                  s.width=c.sprite.width;
                  s.height=c.sprite.height;
                  s.x=m;
                  s.y=n;
                  c.marker=s;
                  scene.insert(s);
                }
                found=true;
              }
            }
            break;
          }
        }
      }
      B.x=B.g.oldx;
      B.y=B.g.oldy;
    }

    function initLevel(scene,cols,rows,target){
      let sx=_G.arena.x,
          sy=_G.arena.y;
      placeBombs(rows,cols,target);
      calcBombs();
      for(let r,y=0; y<_G.grid.length; ++y){
        r=_G.grid[y];
        for(let s,c,x=0;x<r.length;++x){
          c=r[x];
          c.sprite=
          s=_S.spriteFrom("box.png","round.png");
          s.tint=BLUE;
          s.x=sx+c.x1;
          s.y=sy+c.y1;
          s.width=c.x2-c.x1;
          s.height=c.y2-c.y1;
          c.row=y;
          c.col=x;
          s.m5.press=()=>{
            if(!_G.timerStarted) _.delay(0,()=>updateTimer());
            if(c.marker){return}
            _I.undoButton(s);
            if(c.value===9){
              boom(scene,c);
            }else{
              expand(scene,c.row,c.col);
              checkEnd(scene);
            }
          };
          scene.insert(_I.makeButton(s));
        }
      }
    }

    function showAllMines(scene){
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let m,n,s,c,x=0;x<_G.grid[0].length;++x){
          c=r[x];
          if(c.value===9 && !c.opened){
            [m,n]=_S.centerXY(c.sprite);
            s=_S.sprite("boom.png");
            _S.centerAnchor(s);
            s.width=c.sprite.width;
            s.height=c.sprite.height;
            s.x=m;
            s.y=n;
            if(c.marker)_S.remove(c.marker);
            c.marker=null;
            scene.insert(s);
          }
        }
      }
    }

    function checkEnd(scene){
      let opened=0,found=0;
      let pending=[];
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let c,x=0;x<_G.grid[0].length;++x){
          c=r[x];
          if(c.opened) ++opened;
          else if(c.marker && c.value===9) ++found;
          else pending.push(c);
        }
      }
      if(found===Mojo.u.dimXY[2] ||
         pending.filter(c=> c.value===9).length===pending.length){
        _.delay(100,()=>alert("You win!"));
        _G.gameOver=true;
        return showAllMines(scene);
      }
    }

    //10,40,99
    function placeBombs(rows,cols,target){
      let n=rows*cols,
          x,y,p,t=0;
      while(t<target){
        p=_.randInt2(0,n-1);
        y=int(p/cols);
        x=p%cols;
        if(_G.grid[y][x].value !==9){
          ++t;
          _G.grid[y][x].value=9;
        }
      }
    }

    function calcBombs(){
      function calc(row,col){
        return row>=0 && row < _G.grid.length &&
               col>=0 && col < _G.grid[0].length && _G.grid[row][col].value==9?1:0 }
      for(let r,y=0;y<_G.grid.length;++y){
        r=_G.grid[y];
        for(let t,c,x=0;x <r.length;++x){
          t=0;
          if(r[x].value !== 9){
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

    function expand(scene,row,col){
      if(row>=0&&row<_G.grid.length && col>=0 && col < _G.grid[0].length){}else{return}
      let x,y,s,c= _G.grid[row][col];
      if(!c.opened && c.value!==9 && c.value !== 99){
        c.sprite.m5.showFrame(1);
        if(c.value===0){
          c.sprite.visible=false;
        }else{
          [x,y]=_S.centerXY(c.sprite);
          s=_S.sprite(`${c.value}.png`);
          _S.centerAnchor(s);
          s.x=x;
          s.y=y;
          //s.tint=ORANGE;
          s.width=c.sprite.width;
          s.height=c.sprite.height;
          s.scale.x *=0.5;
          s.scale.y *=0.5;
          s.alpha=0.5;
          scene.insert(s);
        }
        c.opened=true;
        if(c.value===0){
          expand(scene,row-1,col-1);
          expand(scene,row-1,col);
          expand(scene,row-1,col+1);
          expand(scene,row,col-1);
          expand(scene,row,col+1);
          expand(scene,row+1,col-1);
          expand(scene,row+1,col);
          expand(scene,row+1,col+1);
        }
      }
    }

    function initHud(scene){
      let K=Mojo.getScaleFactor(),
          c,s= _G.flag=_S.sprite("box.png");
      s.addChild(c=_S.sprite("wflag.png"));
      //c.tint=TEXT_COLOR;
      s.tint=BLUE;
      s.width=_G.CELLW;
      s.height=_G.CELLH;
      _I.makeDrag(s);
      s.m5.onDragDropped=()=>{
        onDropped(scene, _G.flag)
        if(!_G.timerStarted) _.delay(1000,()=>updateTimer());
      };
      _S.pinTop(_G.bg,s);
      s.g.oldx=s.x;
      s.g.oldy=s.y;
      s.g.value=99;
      scene.insert(_G.flag);
      //
      s=_S.bitmapText(`Mines: ${Mojo.u.dimXY[2]}`,{fontSize:36*K});
      //s.tint=TEXT_COLOR;
      _S.pinTop(_G.bg,s,10,0);
      scene.insert(s);
      //
      s=_S.bitmapText(`Time: 000`,{fontSize:36*K});
      //s.tint=TEXT_COLOR;
      _S.pinTop(_G.bg,s,10,1);
      scene.insert(s);
      _G.timerText=s;
      _G.timerSecs=0;
    }

    function updateTimer(){
      let msg= _.prettyNumber(++_G.timerSecs,3);
      _G.timerText.text=`Time: ${msg}`;
      _G.timerStarted=true;
      if(!_G.gameOver)
        _.delay(1000, updateTimer);
    }

    _Z.defScene("level1",{
      setup(){
        let s,w,h,bb,dim=Mojo.u.dimXY;
        _G.grid= _S.gridXY([dim[0],dim[1]],0.9,0.8,_G.arena={x:0,y:0});
        _G.gfx=_S.graphics();
        s=_G.grid[0][0];
        _G.CELLW=s.x2-s.x1;
        _G.CELLH=s.y2-s.y1;
        bb=_S.gridBBox(_G.arena.x,_G.arena.y,_G.grid);
        _S.drawGridLines(_G.arena.x, _G.arena.y,_G.grid,1,"white",_G.gfx);
        _S.drawGridBox(bb,1,"black",_G.gfx);
        _G.bg=_S.rect(_G.arena.width,_G.arena.height,BGCOLOR,BGCOLOR);
        _G.bg.x=_G.arena.x;
        _G.bg.y=_G.arena.y;
        this.insert(_G.bg);
        initLevel(this,dim[0],dim[1],dim[2]);
        this.insert(_G.gfx);
        initHud(this);
      },
      postUpdate(dt){
      }
    });

  }

  //9x9, 16x16,30x16
  const _$={
    assetFiles: ["tiles.png","images/tiles.json"],
    arena: {width: 920, height: 920},
    scaleToWindow:"max",
    scaleFit:"y",
    dimXY: [9,9,10],
    //dimXY: [16,16,40],
    //dimXY: [30,16,99],
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);


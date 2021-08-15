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
      scene.insert(s);
    }

    function initLevel(scene,rows,cols,target){
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
            _I.undoButton(s);
            if(c.value===9){
              boom(scene,c);
            }else{
              expand(scene,c.row,c.col);
            }
          };
          scene.insert(_I.makeButton(s));
        }
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

        //buttons
        w=_G.CELLW*3;
        h=_G.CELLH*3;

        s=_S.sprite("box.png");
        s.tint=BLUE;
        s.addChild(_S.sprite("B.png"));
        _G.flag=s;
        _G.flag.width=w;
        _G.flag.height=h;
        _I.makeButton(_G.flag);
        _S.pinLeft(_G.bg,_G.flag,w/2);
        this.insert(_G.flag);

        s=_S.sprite("box.png");
        s.tint=BLUE;
        s.addChild(_S.sprite("ptr.png"));
        _G.smiley=s;
        _G.smiley.width=w;
        _G.smiley.height=h;
        _I.makeButton(_G.smiley);
        _S.pinRight(_G.bg,_G.smiley,w/2);
        this.insert(_G.smiley);
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
    //dim: [16,16,40],
    //dim: [30,16,99],
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);


;(function(window){
  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;
    let _I=Mojo.Input;
    let _G=Mojo.Game;
    let _=Mojo.u;

    //_G.icons=["cherry.png","apple.png","orange.png","lemon.png","plum.png"];
    _G.icons= ["1s.png","2s.png","3s.png","4s.png","5s.png"];
    _G.tilesInX=12;
    _G.tilesInY=18;

    _Z.defScene("Bg",{
      setup(){
      }
    });

    _Z.defScene("level1",{
      backdrop(){
        let r1=this.grid[0];
        let n=r1.length;
        let f=r1[0];
        let rE=this.grid[this.grid.length-1];
        let e=rE[n-1];
        let s=_S.rect(e.x2-f.x1,e.y2-f.y1,0xc9d08e,0xc9d08e);
        s.x=f.x1;
        s.y=f.y1;
        this.insert(s);
      },
      randColor(){
        return _.randInt(_G.icons.length)
      },
      createTile(pos,color){
        let s=_S.sprite(_G.icons[color]);
        let y= _.floor(pos/_G.tilesInX);
        let x= pos%_G.tilesInX;
        let g=this.grid[y][x];
        _S.centerAnchor(s);
        s.scale.x=_G.scaleX;
        s.scale.y=_G.scaleY;
        s.iconColor=color;
        s.x=(g.x2+g.x1)/2;
        s.y=(g.y2+g.y1)/2;
        this.insert(s);
        return s;
      },
      initLevel(){
        //let s=_S.sprite("apple.png");
        let s=_S.sprite("1s.png");
        let w=s.width;
        let h=s.height;
        //let K=Mojo.scaleXY([w,h],[_G.tileW-6,_G.tileH-6]);
        let K=Mojo.scaleXY([w,h],[_G.tileW,_G.tileH]);
        _G.tiles=[];
        _G.scaleX=K[0];
        _G.scaleY=K[1];
        let pos=0;
        for(let c,s,y=0;y<_G.tilesInY;++y){
          for(let x=0;x<_G.tilesInX;++x){
            c=this.randColor();
            s=this.createTile(pos,c);
            _G.tiles[pos++]=s;
          }
        }
        let click=()=>{ this.onClick() };
        Mojo.pointer.press=click;
        Mojo.pointer.tap=click;
      },
      onClick(){
        if(_G.busySignal){return}
        for(let x,y,t,i=0;i<_G.tiles.length;++i){
          t=_G.tiles[i];
          if(Mojo.pointer.hitTestSprite(t)){
            y= _.floor(i/_G.tilesInX);
            x= i % _G.tilesInX;
            _.delay(0,()=>{
              this.onSelected(y,x);
            })
            _G.busySignal=true;
            break;
          }
        }
      },
      matchTiles(garbo,row,col,color){
        if (col<0  || col >= _G.tilesInX ||
            row <0 || row >= _G.tilesInY){return}
        let pos = row * _G.tilesInX + col;
        // match color?
        if(_G.tiles[pos].iconColor !== color){return}
        //check if tile is already saved
        if(garbo[pos]){return}
        garbo[pos]=1;
        // check up and down
        this.matchTiles(garbo, row-1, col, color);
        this.matchTiles(garbo, row+1, col,color);
        // check left and right
        this.matchTiles(garbo, row,col-1, color);
        this.matchTiles(garbo, row,col+1, color);
      },
      onSelected(row,col){
        let t= _G.tiles[row*_G.tilesInX+col];
        let c= t.iconColor;
        let garbo={};
        this.matchTiles(garbo,row,col,c);
        //updateScore(loc);
        this.removeTiles(garbo);
        this.shiftTiles(garbo);
        this.addNewTiles();
        _G.busySignal=false;
      },
      shiftTiles(garbo){
        let ts= _.keys(garbo).sort();
        let shifts= {};
        // for each tile, bring down all the tiles
        // belonging to the same column that are above the current tile
        for(let pos,y,x,i=0;i<ts.length;++i){
          pos= +ts[i];
          x = _.floor(pos % _G.tilesInX);
          y = _.floor(pos / _G.tilesInX);
          // iterate through each row above the current tile
          for(let g,s,cur,top,j= y;j>=0; --j){
            // each tile gets the data of the tile exactly above it
            top= (j-1) * _G.tilesInX + x;
            cur= j * _G.tilesInX + x;
            s= _G.tiles[cur] = _G.tiles[top];
            if(s){
              g=this.grid[j][x];
              s.x=(g.x1+g.x2)/2;
              s.y=(g.y1+g.y2)/2;
              _.assoc(shifts, s.mojoh5.uuid,s);
            }
          }
          //null the very top slot
          _G.tiles[x] = null;
        }
      },
      addNewTiles(){
        let empty=[];
        for(let i=0;i<_G.tiles.length;++i){
          if(_G.tiles[i]){}else{
            empty.push(i);
          }
        }
        empty.forEach(pos=>{
          let c=this.randColor();
          let s= this.createTile(pos,c);
          _G.tiles[pos]=s;
        });
        // the move has finally finished, do some cleanup
        //cleanUpAfterMove();
      },
      removeTiles(garbo){
        _.doseq(garbo,(v,pos)=>{
          _S.remove(_G.tiles[pos]);
          _G.tiles[pos]=null;
        });
      },
      setup(){
        let g= _S.gridXY(_G.tilesInX,_G.tilesInY,0.8);
        //let b= _S.drawGridBox(g,2,0x958ed0);
        let b= _S.drawGridBox(g,4,"white");
        //let n= _S.drawGridLines(g,2,0x958ed0);
        let z=g[0][0];
        _G.tileW=z.x2-z.x1;
        _G.tileH=z.y2-z.y1;
        this.grid=g;
        this.backdrop();
        this.insert(b);
        //this.insert(n);
        this.initLevel();
      }
    });
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("Bg");
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load", ()=>{
    MojoH5({
      //assetFiles: ["cherry.png","apple.png","lemon.png","orange.png","plum.png"],
      assetFiles: ["1s.png","2s.png","3s.png","4s.png","5s.png"],
      arena: {width:480,height:800},
      scaleToWindow: "max",
      backgroundColor: 0,
      start:setup
    })
  });
})(this);

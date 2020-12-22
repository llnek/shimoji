;(function(window){
  "use strict";

  function setup(Mojo){
    const _S=Mojo.Sprites;
    const _Z=Mojo.Scenes;
    const _G= Mojo.Game;
    const _=Mojo.u;

    window["io.czlab.reversi.Sprites"](Mojo);
    window["io.czlab.reversi.AI"](Mojo);
    window["io.czlab.reversi.Scenes"](Mojo);

    const _Dirs=
    (function(out){
      [-1,0,1].forEach(r=>{
        [-1,0,1].forEach(c=>{
          if(r !== 0 || c !==0) out.push([r,c]) }) });
      return out;
    })([]);
    const Ext={
      gridLineWidth: 4,
      DIM:8,
      X:1,//black
      O:2,//white
      piecesFlipped(cells, pos, cur,other){
        let len=cells.length;
        let total=[];
        for(let added,d,r,c,i=0;i<_Dirs.length;++i){
          d=_Dirs[i];
          added=[];
          r=pos[0]+d[0];
          c=pos[1]+d[1];
          while(0<=r && r<len && 0<=c && c<len){
            if(cells[r][c] === other){
              added.push([r,c]);
            }else if(cells[r][c] === cur){
              total=total.concat(added);
              break;
            }else{
              break;
            }
            r+=d[0];
            c+=d[1];
          }
        }
        return total;
      },
      getIcon(v){
        if(v===_G.O || v==="O") return 2;//"o.png";
        if(v===_G.X || v==="X") return 1;//"x.png";
        return 0;//"z.png";
      },
      getIconValue(v){
        if(v===_G.O) return _G.O;
        if(v===_G.X) return _G.X;
      },
      getIconImage(v){
        if(v===_G.O) return "O";
        if(v===_G.X) return "X";
      },
      switchPlayer(){
        let c=_G.state.get("pcur");
        let ai= _G.state.get("ai");
        if(c===_G.X)
          _G.state.set("pcur", _G.O);
        if(c===_G.O)
          _G.state.set("pcur", _G.X);
        if(ai && ai.pnum !== c)
          Mojo.EventBus.pub(["ai.move",ai]);
      },
      checkTie(){
      },
      checkState(gpos){
        //0=>ok,1=>win,-1=>draw
        let cells= _G.state.get("cells");
        let v= _G.state.get("pcur");
        return _G.piecesFlipped(cells,gpos,v,v===_G.X?_G.O:_G.X);
      }
    };
    _.inject(_G, Ext);
    _Z.runScene("PlayGame");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles:["bggreen.jpg","tiles.png"],
      arena:{width:1600, height:1200},
      scaleToWindow:"max",
      start: setup
    })
  });

})(this);






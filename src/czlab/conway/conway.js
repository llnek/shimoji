;(function(window){
  "use strict";

  function _scenes(Mojo){
    const _S=Mojo.Sprites;
    const _Z=Mojo.Scenes;
    const _T=Mojo.Tiles;
    const _G= Mojo.Game;
    const _GS=_G.state;
    const _=Mojo.u;
    const SEEDS = {
      diehard: [
        [0, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 1, 1]
      ],
      glider: [
        [1, 0, 1],
        [0, 1, 1],
        [0, 1, 0]],
      blinker:[
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0]],
      boat: [
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 0]],
      r_pentomino: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 1, 0]],
      pentadecathlon: [
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1]
      ],
      beacon: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]],
      acorn: [
        [0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 0, 0, 1, 1, 1]],
      spaceship: [
        [0, 0, 1, 1, 0],
        [1, 1, 0, 1, 1],
        [1, 1, 1, 1, 0],
        [0, 1, 1, 0, 0]],
      block_switch_engine: [
        [0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 1, 1],
        [0, 0, 0, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0],
        [1, 0, 1, 0, 0, 0, 0, 0] ],
      infinite: [
        [1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1],
        [0, 1, 1, 0, 1],
        [1, 0, 1, 0, 1]
      ],
      toad: [
        [0, 1, 1, 1],
        [1, 1, 1, 0]],
      lwws: [
        [1, 0, 0, 1, 0],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 1]],
      pulsar: [
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0],
        [1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]],
      random: [
        [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0],
        [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1],
        [0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0],
        [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
        [0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1]],
      gosper_glider: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
    };
    const NBS= [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    const _DELAY=300;

    _Z.defScene("level1",{
      _tile(){
        return _S.sprite([_S.frame("tiles.png",_G.iconSize[0],_G.iconSize[1],1,1),
                          _S.frame("tiles.png",_G.iconSize[0],_G.iconSize[1],65,1)]);
      },
      _initLevel(options){
        _G.gridLineWidth=1;
        _G.iconSize=[60,60];
        _G.DIM=40;
        let grid= _T.mapGridPos(_G.DIM,_G.gridLineWidth,0.9),
            s,cells,
            cz= _S.bboxSize(grid.cell(0,0)),
            K=Mojo.scaleXY(_G.iconSize,cz);
        cells=grid.data.map(r=> r.map(c=> {
          let s=this._tile();
          s.x=c.x1;
          s.y=c.y1;
          s.width=cz[0];
          s.height=cz[1];
          s.mojoh5.showFrame(0);
          this.insert(s);
          //if(s) console.log(`sx=${s.x},sy=${s.y},sw=${s.width},sy=${s.height}`);
          return {alive: false, nextAlive: false, icon: s};
        }));
        _G.state.set({
                      iconScale: K,
                      grid: grid, cells: cells});
      },
      onCanvasResize(old){
        let g=_T.mapGridPos(_G.DIM,_G.gridLineWidth,0.9);
        let cz= _S.bboxSize(g.cell(0,0));
        _G.state.set("grid", g);
        _G.state.set("iconScale", Mojo.scaleXY(_G.state.get("iconSize"),cz));
        _S.resize({x:0,y:0,width:old[0],height:old[1],children:this.children});
      },
      _cntNbrs(row,col,R,C,cs){
        let sum=0;
        let r;
        let c;
        NBS.forEach(pos=>{
          r=row+pos[0];
          c=col+pos[1];
          if(r>=0&&r<R&&c>=0&&c<C && cs[r][c].alive){
            ++sum;
          }
        });
        return sum;
      },
      step(){
        let cs=_GS.get("cells");
        this._examine();
        this._nextgen();
        _.delay(_DELAY,()=>this.step());
      },
      _examine(){
        let cs=_GS.get("cells");
        for(let row,r=0;r<cs.length;++r){
          row=cs[r];
          for(let rc,n,c=0;c<row.length;++c){
            n=this._cntNbrs(r,c,cs.length,row.length,cs);
            rc=row[c];
            if(rc.alive){
              //too few, or too many
              if(n<2 || n>3){
                rc.nextAlive=false;
              }else{
                //stay same
                rc.nextAlive=true;
              }
            }else if(n===3){
              //come alive
              rc.nextAlive=true;
            }
          }
        }
      },
      _nextgen(){
        let cs=_GS.get("cells");
        for(let row,r=0;r<cs.length;++r){
          row=cs[r];
          for(let rc,n,c=0;c<row.length;++c){
            rc=row[c];
            rc.alive=rc.nextAlive;
            rc.nextAlive=false;
            rc.icon.mojoh5.showFrame(rc.alive?1:0);
          }
        }
      },
      _seed(which="acorn"){
        let cs=_GS.get("cells");
        let data=SEEDS[which];
        let h=data.length;
        let w=-Infinity;
        data.forEach(r=> {
          if(r.length>w)w=r.length; });
        let y=_.max(0,_.floor((cs.length-h)/2));
        let x=_.max(0,_.floor((cs[0].length-w)/2));
        let o;
        data.forEach((r,i)=>{
          r.forEach((c,j)=>{
            if(c!==0){
              o=cs[y+i][x+j];
              o.alive=true;
              o.icon.mojoh5.showFrame(1);
            }
          });
        });
      },
      setup(options){
        this._initLevel(options);
        let self=this;
        let grid=_G.state.get("grid");
        let c0=grid.cell(0,0);
        let box=_S.group(grid.draw());
        box.x=c0.x1;
        box.y=c0.y1;
        box.mojoh5.resize=function(){
          box.removeChildren();
          let z=_G.state.get("cells");
          let g=_G.state.get("grid");
          let c0=g.cell(0,0);
          let cw=c0.x2-c0.x1;
          let ch=c0.y2-c0.y1;
          let b=g.draw();
          box.addChild(b);
          box.x=c0.x1;
          box.y=c0.y1;
          for(let row,r=0;r<z.length;++r){
            row=z[r];
            for(let k,o,c=0;c<row.length;++c){
              k=g.cell(r,c);
              o=row[c];
              o.icon.x=k.x1;
              o.icon.y=k.y1;
              o.icon.width=cw;
              o.icon.height=ch;
            }
          }
        };
        this.insert(box);
        this._seed("random");
        _.delay(_DELAY,()=> this.step());
      }
    });
  }

  function setup(Mojo){
    _scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles:["tiles.png"],
      arena:{width:1200, height:960},
      scaleToWindow:"max",
      backgroundColor: 0,
      start: setup
    })
  });

})(this);






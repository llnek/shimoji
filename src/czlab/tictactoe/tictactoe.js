;(function(window){
  "use strict";

  function setup(Mojo){
    const _S=Mojo.Sprites;
    const _Z=Mojo.Scenes;
    const G= Mojo.Game;
    const _=Mojo.u;

    window["io/czlab/tictactoe/Sprites"](Mojo);
    window["io/czlab/tictactoe/AI"](Mojo);
    window["io/czlab/tictactoe/Scenes"](Mojo);

    const Ext={
      getIcon(v){
        if(v===G.O || v==="O") return 0;//"o.png";
        if(v===G.X || v==="X") return 2;//"x.png";
        return 1;//"z.png";
      },
      getIconValue(v){
        if(v===G.O) return G.O;
        if(v===G.X) return G.X;
      },
      getIconImage(v){
        if(v===G.O) return "O";
        if(v===G.X) return "X";
      },
      switchPlayer(){
        let c=G.pcur;
        let ai= G.ai;
        if(c===G.X)
          G.pcur=G.O;
        if(c===G.O)
          G.pcur=G.X;
        if(ai && ai.pnum !== c)
          Mojo.EventBus.pub(["ai.move",ai]);
      },
      checkTie(){
        let data= G.cells;
        for(let i=0;i<data.length;++i)
          if(data[i]===0)
            return false;
        return true;
      },
      checkState(){
        let goals= G.goals;
        let d= G.cells;
        let v= G.pcur;
        let tied=true;
        for(let i=0;i<d.length;++i) if(d[i]===0) tied=false;
        if(tied)
          return -1;
        for(let ok, arr,g=0; g < goals.length; ++g){
          arr=goals[g];
          ok=0;
          for(let i=0; i<arr.length; ++i){
            if(d[arr[i]]===v) ++ok;
          }
          if(ok===arr.length) return 1;
        }
        return 0;
      },
      /** Calculate position of each individual cells in the grid,
        * so that we can detect when a user clicks on the cell
        */
      mapGridPos(dim){
        let sz = 0.6 * (Mojo.portrait()?Mojo.width:Mojo.height);
        let cx,cy,x0,y0,x1,y1,x2,y2,out= _.jsVec();
        let wb = Mojo.screenCenter();
        //size of cell
        let cz = _.floor(sz/dim);
        //size of grid
        sz = cz * dim;
        //top,left
        y1=y0=(Mojo.height - sz)/2;
        x1=x0=(Mojo.width - sz)/2;
        for(let r=0; r<dim; ++r){
          for(let c= 0; c<dim; ++c){
            y2 = y1 + cz;
            x2 = x1 + cz;
            _.conj(out,_S.bbox4(x1,x2,y1,y2));
            x1 = x2;
          }
          y1 = y2;
          x1 = x0;
        }
        return out;
      },
      mapGoalSpace(){
        let dx=[];
        let dy= [];
        let goals= _.jsVec();
        let dim=Mojo.Game.DIM;
        for(let r=0; r<dim; ++r){
          let h=[], v=[];
          for(let c=0; c<dim; ++c){
            h[c] = r * dim + c;
            v[c] = c * dim + r;
          }
          _.conj(goals,h);
          _.conj(goals,v);
          dx[r] = r * dim + r;
          dy[r] = (dim - r - 1) * dim + r;
        }
        _.conj(goals,dx);
        _.conj(goals,dy);
        return goals;
      },
      DIM:3,
      X:88,
      O:79
    };
    _.inject(Mojo.Game, Ext);
    _Z.runScene("Splash");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles:["bgblack.jpg","icons.png","x.mp3","o.mp3","end.mp3"],
      arena:{width:1600, height:1200},
      scaleToWindow:"max",
      start: setup
    })
  });

})(this);






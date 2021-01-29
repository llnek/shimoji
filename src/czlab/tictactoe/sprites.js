;(function(window){
  "use strict";

  window["io/czlab/tictactoe/Sprites"]= function(Mojo){
    const _N=window["io/czlab/mcfud/negamax"]();
    const _E=Mojo.EventBus;
    const _S=Mojo.Sprites;
    const _Z=Mojo.Scenes;
    const _I=Mojo.Input;
    const _=Mojo.u;
    const is= Mojo.is;
    const G= Mojo.Game;

    G.Backgd=function(){
      let s= _S.sprite("bgblack.jpg");
      let w=s.width;
      let h=s.height;
      s.anchor.set(0.5);
      s.m5.resize=function(){
        s.scale.x=Mojo.width/w;
        s.scale.y=Mojo.height/h;
        s.x=Mojo.width/2;
        s.y=Mojo.height/2;
      };
      s.m5.resize();
      return s;
    };

    G.AI=function(v){
      const o={
        pnum:v,
        board: G.TTToe(G.X, G.O)
      };
      const signal=[["ai.move",o], "aiMove",o];
      o.dispose=function(){
        _E.unsub.apply(_E,signal)
      };
      o.aiMove=function(){
        _.delay(500,()=> o.makeMove())
      };
      o.makeMove=function(){
        let cells= G.cells;
        let pos,rc;
        this.board.syncState(cells, this.pnum);
        pos= this.board.getFirstMove();
        if(pos < 0)
          pos= _N.evalNegaMax(this.board);
        cells[pos] = this.pnum;
        _E.pub(["ai.moved",this.scene],pos);
        G.playSnd();
        rc= G.checkState();
        if(rc===0)
          G.switchPlayer();
        else{
          G.lastWin= rc===1 ? G.pcur : 0;
          _Z.runScene("EndGame",5);
        }
      };
      _E.sub.apply(_E, signal);
      return o;
    };

    G.Tile=function(x,y,tileX,tileY,props){
      let s= _S.sprite(_S.frames("icons.png",tileX,tileY));
      let mo=s.m5;
      const signal= [["ai.moved",s],"aiMoved",mo];

      s.m5.resize=function(){
        let g= G.grid;
        let b=_S.bboxCenter(g[s.m5.gpos]);
        let K=G.iconScale;
        s.scale.x=K[0];
        s.scale.y=K[1];
        s.x=b[0];
        s.y=b[1];
      };

      s.scale.x=props.scale[0];
      s.scale.y=props.scale[1];
      s.x=x;
      s.y=y;
      _.inject(mo,props);
      _I.makeButton(_S.centerAnchor(s));
      mo.button=false;
      mo.showFrame(1);//G.getIcon(props.gval));
      mo.aiMoved=function(){
        mo.enabled=false;
        mo.marked=true;
        mo.showFrame(G.getIcon(G.pcur));
      };
      mo.press=function(){
        let v=G.pcur;
        let ai=G.ai;
        let p1= G.pnum;
        let cells= G.cells;
        //if AI is thinking, back off
        if(ai && v===ai.pnum) { return; }
        //if cell already marked, go away
        if(mo.marked) {return;}
        mo.enabled=false;
        mo.marked=true;
        G.playSnd();
        if(cells[mo.gpos] !== 0)
          throw "Fatal: cell marked already!!!!";
        mo.showFrame(G.getIcon(v));
        //this.p.gval=v;
        cells[mo.gpos]= v;
        let rc= G.checkState();
        if(rc===0)
          G.switchPlayer();
        else{
          G.lastWin= rc===1 ? G.pcur : 0;
          _Z.runScene("EndGame",5);
        }
      }
      _E.sub.apply(_E,signal);
      return s;
    };
  }

})(this);


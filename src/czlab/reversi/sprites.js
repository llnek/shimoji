;(function(window){
  "use strict";

  window["io.czlab.reversi.Sprites"]= function(Mojo){
    const _N=window["io.czlab.mcfud.negamax"]();
    const _E=Mojo.EventBus;
    const _S=Mojo.Sprites;
    const _Z=Mojo.Scenes;
    const _I=Mojo.Input;
    const _=Mojo.u;
    const is= Mojo.is;
    const _G= Mojo.Game;

    _G.Backgd=function(){
      let s= _S.sprite("bggreen.jpg");
      let w=s.width;
      let h=s.height;
      s.anchor.set(0.5);
      s.mojoh5.resize=function(){
        s.scale.x=Mojo.width/w;
        s.scale.y=Mojo.height/h;
        s.x=Mojo.width/2;
        s.y=Mojo.height/2;
      };
      s.mojoh5.resize();
      return s;
    };

/*
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
        let cells= G.state.get("cells");
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
          G.state.set("lastWin", rc===1 ? G.state.get("pcur") : 0);
          _Z.runScene("EndGame",5);
        }
      };
      _E.sub.apply(_E, signal);
      return o;
    };
    */
    _G.flipIcon=function(s,pos){
      for(let v,p,c,i=0,z=s.children.length;i<z;++i){
        c=s.children[i];
        if(c && c.mojoh5 && c.mojoh5.gpos){
          p=c.mojoh5.gpos;
          if(p[0]===pos[0] && p[1]===pos[1]){
            _.assert(c.mojoh5.enabled===false);
            v= c.mojoh5.gval===_G.X?_G.O:_G.X;
            c.mojoh5.showFrame(v);
            c.mojoh5.gval=v;
            break;
          }
        }
      }
    };
    _G.Tile=function(x,y,tileX,tileY,props){
      let s= _S.sprite(_S.frames("tiles.png",tileX,tileY));
      let mo=s.mojoh5;
      const signal= [["ai.moved",s],"aiMoved",mo];

      s.mojoh5.resize=function(){
        let g= _G.state.get("grid");
        let pos=s.mojoh5.gpos;
        let b=_S.bboxCenter(g[pos[0]][pos[1]]);
        let K= _G.state.get("iconScale");
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
      if(props.gval !== 0) mo.enabled=false;
      mo.showFrame(_G.getIcon(props.gval));
      mo.button=false;
      mo.aiMoved=function(){
        mo.enabled=false;
        mo.marked=true;
        //mo.showFrame(G.getIcon(G.state.get("pcur")));
      };
      mo.press=function(){
        let v=_G.state.get("pcur");
        let ai=_G.state.get("ai");
        let p1= _G.state.get("pnum");
        let cells= _G.state.get("cells");
        //if AI is thinking, back off
        if(ai && v===ai.pnum) { return; }
        //if cell already marked, go away
        if(mo.marked) {return;}
        //_G.playSnd();
        if(cells[mo.gpos[0]][mo.gpos[1]] !== 0)
          throw "Fatal: cell marked already!!!!";
        let rc= _G.checkState(mo.gpos);
        if(rc.length>0){
          rc.forEach(c=>{
            _G.flipIcon(s.parent,c);
            cells[c[0]][c[1]]=v;
          });
          cells[mo.gpos[0]][mo.gpos[1]]= v;
          mo.gval=v;
          mo.showFrame(_G.getIcon(v));
          mo.enabled=false;
          mo.marked=true;
          _G.switchPlayer();
        }else{
          //_G.state.set("lastWin", rc===1 ? _G.state.get("pcur") : 0);
          //_Z.runScene("EndGame",5);
        }
      }
      _E.sub.apply(_E,signal);
      return s;
    };
  }

})(this);


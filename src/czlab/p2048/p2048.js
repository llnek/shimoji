;(function(window){
  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;
    let _I=Mojo.Input;
    let _G=Mojo.Game;
    let _=Mojo.u;
    let DIM=4;

    _G.TILES=[];

    _Z.defScene("Bg",{
      setup(){
      }
    });

    function _mkTiles(scene,dim){
      let t=scene.grid[0][0];
      let w= t.x2-t.x1;
      let h= t.y2-t.y1;
      let out=[];
      let K=Mojo.scaleXY([_G.tileW,_G.tileH],[w,h]);
      for(let pos,s,r,y=0;y<dim;++y){
        r=[];
        for(let x=0;x<dim;++x){
          r.push(0);
          s=_S.sprite(scene.tileFrames);
          s.mojoh5.ROW=y;
          s.mojoh5.COL=x;
          pos=scene.grid[y][x];
          s.x=pos.x1;
          s.y=pos.y1;
          s.scale.x=K[0];
          s.scale.y=K[1];
          s.mojoh5.showFrame(_numToFrame(0));
          _G.TILES.push(s);
          scene.insert(s);
        }
        out.push(r);
      }
      return out;
    }

    const _colorMap={
      0: "#c8beb4", //setColor(c::Color3B(200,190,180));
      2: "#f0e6dc", //setColor(c::Color3B(240,230,220));
      4: "#f0dcc8", //setColor(c::Color3B(240,220,200));
      8: "#f0b478", //setColor(c::Color3B(240,180,120));
      16: "#f08c5a", //setColor(c::Color3B(240,140,90));
      32: "#f0785a", //setColor(c::Color3B(240,120,90));
      64: "#f05a3c", //setColor(c::Color3B(240,90,60));
      128: "#f05a3c", //setColor(c::Color3B(240,90,60));
      256: "#f0c846", //setColor(c::Color3B(240,200,70));
      512: "#f0c846", //setColor(c::Color3B(240,200,70));
      1024: "#008200", //setColor(c::Color3B(0,130,0));
      2048: "#008200" //setColor(c::Color3B(0,130,0));
    };

    function _loadTiles(){
      let out= [0,2,4,8,16,32,64,256,1024].map(n=> Mojo.tcached(`${n}.png`));
      _G.tileW=out[0].width;
      _G.tileH=out[1].height;
      return out;
    }

    function _numToFrame(num){
      switch(num){
      case 0:return 0;
      case 2:return 1;
      case 4:return 2;
      case 8:return 3;
      case 16:return 4;
      case 32:return 5;
      case 64:
      case 128:return 6;
      case 256:
      case 512:return 7;
      case 1024:
      case 2048:return 8;
      }
      _.assert(false,"bad num");
    }

    _Z.defScene("level1",{
      setNumber(r,c,num){
        let s= _G.TILES[r*DIM+c];
        s.mojoh5.showFrame(_numToFrame(num));
        this.tiles[r][c]=num;
        let t= _S.text(`${num}`,{fontSize:200,fontFamily:"Arial",fill:0,align:"center"});
        t.x=0;
        t.y=0;
        s.addChild(t);
      },
      initLevel(){
        let v,r,c,E=DIM-1,i=2;
        while(i>0){
          r=_.randInt2(0,E);
          c=_.randInt2(0,E);
          if(this.tiles[r][c]===0){
            this.setNumber(r,c, Math.random()>0.5?2:4);
            --i;
          }
        }
      },
      setup(){
        let g= _S.gridSQ(DIM);
        //let b= _S.drawGridBox(g,4,"white");
        //let n= _S.drawGridLines(g,4,"white");
        this.tileFrames= _loadTiles();
        this.grid=g;
        this.tiles=_mkTiles(this,DIM);
        this.initLevel();
        //this.insert(b);
        //this.insert(n);
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
      assetFiles: ["tiles.png","images/tiles.json"],
      arena: {width:768,height:1024},
      scaleToWindow: "max",
      backgroundColor: 0,
      start:setup
    })
  });
})(this);

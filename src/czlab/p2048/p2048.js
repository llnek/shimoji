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

    let TMP=[0,0,0,0];
    function _resetTMP(){
      TMP[0]=TMP[1]=TMP[2]=TMP[3]=0;
      return 4;
    }
    function compress(arr,mutate){
      let k=arr.length;
      let v2=null;
      let v1=v2;
      let out=_.fill(new Array(k),0);

      for(let j=arr.length-1;j>=0;--j){
        if(arr[j]===0){continue;}
        if(v2===null){
          v2=arr[j]
        }else{
          v1=arr[j]
          if(v1===v2){
            out[--k]=v1+v2;
            v2=v1=null;
          }else{
            out[--k]=v2;
            v2=v1;
          }
        }
      }
      if(v2 !== null){
        out[--k]=v2
      }
      if(mutate)
        for(let i=0;i<out.length;++i) arr[i]=out[i];
      return out;
    }

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
        if(num>0){
          let t= _S.text(`${num}`,{fontSize:200,fontFamily:"Arial",fill:0,align:"center"});
          t.x=0;
          t.y=0;
          s.addChild(t);
        }
      },
      postSwipe(){
        let p,z,out=[];
        for(let y=0;y<4;++y)
          for(let x=0;x<4;++x){
            if(this.tiles[y][x]===0)
              out.push([y,x])
          }
        z=out.length;
        switch(z){
          case 0:
            p=-1;
            break;
          case 1:
            p=0;
            break;
          case 2:
            p=Math.random()>0.5?1:0;
            break;
          default:
            p=_.randInt2(0,z-1);
            break;
        }
        if(p>=0){
          let r=out[p];
          this.setNumber(r[0],r[1],Math.random()>0.5?4:2);
        }
      },
      refreshTiles(){
        _G.TILES.forEach(t=> t.removeChildren());
        for(let v,r,y=0;y<4;++y){
          r=this.tiles[y];
          for(let c=0;c<4;++c){
            this.setNumber(y,c,r[c]);
          }
        }
        this.postSwipe();
      },
      swipeRight(){
        this.tiles.forEach(r => compress(r,true));
        this.refreshTiles();
      },
      swipeLeft(){
        this.tiles.forEach(r => {
          let out=compress(r.reverse()).reverse();
          for(let i=0;i<4;++i) r[i]=out[i];
        });
        this.refreshTiles();
      },
      swipeUp(){
        let out=[];
        for(let x=0;x<4;++x){
          out.length=0;
          for(let y=3;y>=0;--y){
            out.push(this.tiles[y][x]);
          }
          compress(out,true);
          out.reverse();
          for(let y=0;y<4;++y)
            this.tiles[y][x]=out[y];
        }
        this.refreshTiles();
      },
      swipeDown(){
        let out=[];
        for(let x=0;x<4;++x){
          out.length=0;
          for(let y=0;y<4;++y){
            out.push(this.tiles[y][x]);
          }
          compress(out,true);
          for(let y=0;y<4;++y)
            this.tiles[y][x]=out[y];
        }
        this.refreshTiles();
      },
      initLevel(){
        let v,r,c,E=DIM-1,i=2;
        while(i>0){
          r=_.randInt2(0,E);
          c=_.randInt2(0,E);
          if(this.tiles[r][c]===0){
            this.setNumber(r,c, Math.random()>0.5?2:2048);
            --i;
          }
        }
        this.dirRight=_I.keyboard(_I.keyRIGHT);
        this.dirRight.press=()=>{ this.swipeRight() };
        this.dirLeft=_I.keyboard(_I.keyLEFT);
        this.dirLeft.press=()=>{ this.swipeLeft() };
        this.dirUp=_I.keyboard(_I.keyUP);
        this.dirUp.press=()=>{ this.swipeUp() };
        this.dirDown=_I.keyboard(_I.keyDOWN);
        this.dirDown.press=()=>{ this.swipeDown() }
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

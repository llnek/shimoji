(function(window){
  "use strict";
  function scenes(Mojo){
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_=Mojo.u;
    function Player(scene){
      let p= _S.sprite(_S.frame("sprites.png",30,30,0,0));
      p.mojoh5.uuid="player";
      p.mojoh5.speed=200;
      p.mojoh5.gravity[1]=200;
      p.x=410;
      p.y=90;
      Mojo.addMixin(p,"2d","platformer");
      p.mojoh5.step=function(dt){
        //_S.move(p,dt);
      };
      let tiles=scene.world.tiles;
      p.mojoh5.collide=function(){
        for(let i=0;i<tiles.length;++i){
          Mojo["2d"].hit(p,tiles[i]);
        }
      }
      return scene.world.addChild(p);
    }
    function Tower(){
      let t= _S.sprite(_S.frame("sprites.png",32,32,0,64));
      t.mojoh5.uuid="tower";
      return t;
    }
    function Enemy(scene,id,x,y){
      let e= _S.sprite(_S.frame("sprites.png",30,24,0,34));
      e.mojoh5.uuid=id;
      e.mojoh5.gravity[1]=60;
      scene.world.badies.push(e);
      let tiles=scene.world.tiles;
      e.mojoh5.collide=function(){
        for(let i=0;i<tiles.length;++i){
          let m=Mojo["2d"].hit(e,tiles[i]);
          if(m) {
            break;
          }
        }
        for(let b,i=0;i<scene.world.badies.length;++i){
          b=scene.world.badies[i];
          if(b===e)continue;
          Mojo["2d"].collide(e,b);
        }
        Mojo["2d"].hit(e,scene.player);
      };
      e.mojoh5.speed=80;
      e.mojoh5.vel[0]=80;
      e.x=x;
      e.y=y;
      e.mojoh5.step=function(dt){
        _S.move(e,dt);
      };
      scene.world.addChild(e);
      Mojo.addMixin(e,"2d", "aiBounceX");
      e.mojoh5.onbump=function(col){
        if(col.B.mojoh5.uuid==="player"){
          _S.remove(col.B);
          console.log("die!!!");
          //_Z.runScene("endGame",{msg: "You Died"});
        }
      };
      e.mojoh5.onbtop=function(col){
        if(col.B.mojoh5.uuid==="player"){
          _S.remove(e);
          _.disj(scene.world.badies,e);
          col.B.mojoh5.vel[1] = -300;
        }
      };
      Mojo.EventBus.sub(["bump.top",e],e.mojoh5.onbtop);
      Mojo.EventBus.sub(["bump.left,bump.right,bump.bottom",e], e.mojoh5.onbump);
    }

    _Z.defScene("bg",{
      setup(){
        this.wall=_S.tilingSprite("background-wall.png",Mojo.canvas.width,Mojo.canvas.height);
        this.insert(this.wall);
      }
    });

    _Z.defScene("level1",{
      setup(){
        let level= Mojo.resources("level.json").data;
        let world= this.world = _S.container();
        let tiled= world.tiled= {tileW: 32, tileH: 32,
          tilesInX: level[0].length,
          tilesInY: level.length};
        tiled.tiledWidth=32 * tiled.tilesInX;
        tiled.tiledHeight=32 * tiled.tilesInY;
        let layers = tiled.layers = level;
        this.world.tiles=[];
        this.world.badies=[];
        this.insert(world);
        for(let layer,y=0;y<layers.length;++y){
          layer=layers[y];
          for(let gid,x=0;x<layer.length;++x){
            gid=layer[x];
            if(gid !== 0){
              let sprite;
              let px = x * tiled.tileW;
              let py = y * tiled.tileH;
              switch(gid){
              case 1:
                sprite = _S.sprite(_S.frame("tiles.png",32,32,32,0));
              break;
              case 2:
                sprite = _S.sprite(_S.frame("tiles.png", 32,32,64,0));
              break;
              case 3:
                sprite= Tower();
              break;
              }
              if(sprite){
                sprite.x = px;
                sprite.y = py;
                this.world.tiles.push(sprite);
                world.addChild(sprite);
              }
            }
          }
        }
        this.camera=Mojo["2d"].worldCamera(this.world,this.world.tiled.tiledWidth,this.world.tiled.tiledHeight,Mojo.canvas);
        //this.camera.centerOver(Mojo.canvas.width/2,Mojo.canvas.height/2);
        let player = this.player= Player(this);
        //Mojo.addf(this,"camera");
        //Mojo.getf(this,"camera").follow(player);
        // Add in a couple of enemies

        Enemy(this,"e1",26*32,100);
        Enemy(this,"e2", 28*32,100);


        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        this.camera.follow(this.player);
      }
    });

    _Z.defScene("endGame",()=>{
    });

  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("bg");
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "level.json", "tiles.png", "background-wall.png"],
      scaleToWindow: "max",
      start: setup
    })
  });

})(this);



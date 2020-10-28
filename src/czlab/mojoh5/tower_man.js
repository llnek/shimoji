(function(window){
  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_=Mojo.u;
    let _tilePos = (col,row) => {
      return [col*32, row*32];
    };

    Mojo.defMixin("enemyControls", function(e){
      e.mojoh5.speed=100;
      e.mojoh5.direction=Mojo.LEFT;
      e.mojoh5.switchPercent=2;
      let self={
        step(dt){
          if(Math.random() < e.mojoh5.switchPercent/100){
            self.tryDirection();
          }
          switch(e.mojoh5.direction){
            case Mojo.LEFT: e.mojoh5.vel[0] = -e.mojoh5.speed; break;
            case Mojo.RIGHT: e.mojoh5.vel[0] = e.mojoh5.speed; break;
            case Mojo.UP:   e.mojoh5.vel[1] = -e.mojoh5.speed; break;
            case Mojo.DOWN: e.mojoh5.vel[1] = e.mojoh5.speed; break;
          }
        },
        tryDirection(){
          let from = e.mojoh5.direction;
          if(e.mojoh5.vel[1] !== 0 && e.mojoh5.vel[0]=== 0){
            e.mojoh5.direction = Math.random() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
          }else if(e.mojoh5.vel[0] !== 0 && e.mojoh5.vel[1]=== 0){
            e.mojoh5.direction = Math.random() < 0.5 ? Mojo.UP : Mojo.DOWN;
          }
        },
        changeDirection(col){
          if(e.mojoh5.vel[0]=== 0 && e.mojoh5.vel[1]=== 0){
            let c=col.overlapN;
            if(c[1] !== 0){
              e.mojoh5.direction = Math.random() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
            }else if(c[0] !== 0){
              e.mojoh5.direction = Math.random() < 0.5 ? Mojo.UP : Mojo.DOWN;
            }
          }
        }
      };
      Mojo.EventBus.sub(["post.step",e],"step",self);
      Mojo.EventBus.sub(["hit",e],"changeDirection",self);
      return self;
    });

    function Player(scene){
      let p= _S.sprite(_S.frame("sprites.png"));
      p.mojoh5.speed=150;
      Mojo.addMixin(p,"2d","towerManControls");
      return p;
    }

    function Dot(scene){
      let s= _S.sprite(_S.frame("sprites.png",32,32,0,96));
      s.mojoh5.sensor=true;
      s.mojoh5.sensor=function(){
        _.disj(scene.world.tiles,s);
        _S.remove(s);
        scene.dotCount -= 1;
        if(scene.dotCount===0){
          alert("done");
          //Mojo.runScene("level1");
        }
      };
      s.mojoh5.inserted=function(){
        scene.dotCount = scene.dotCount || 0;
        scene.dotCount += 1;
      };
      Mojo.EventBus.sub(["sensor",s],"sensor",s.mojoh5);
      Mojo.EventBus.sub(["inserted",s],"inserted",s.mojoh5);
      return s;
    }
    function Tower(scene){
      return _S.sprite(_S.frame("sprites.png",32,32,0,64));
    }

    Mojo.defMixin("towerManControls", function(e){
      let self={
        step(dt){
          if(e.mojoh5.vel[0] > 0){
            e.angle = 90;
          }else if(e.mojoh5.vel[0] < 0){
            e.angle = -90;
          }else if(e.mojoh5.vel[1] > 0){
            e.angle = 180;
          }else if(e.mojoh5.vel[1] < 0){
            e.angle = 0;
          }
          // grab a direction from the input
          e.mojoh5.direction = _I.keyDown(_I.keyLEFT)  ? Mojo.LEFT :
                               _I.keyDown(_I.keyRIGHT) ? Mojo.RIGHT :
                               _I.keyDown(_I.keyUP) ? Mojo.UP :
                               _I.keyDown(_I.keyDOWN) ? Mojo.DOWN : e.mojoh5.direction;
          switch(e.mojoh5.direction) {
            case Mojo.LEFT: e.mojoh5.vel[0] = -e.mojoh5.speed; break;
            case Mojo.RIGHT: e.mojoh5.vel[0] = e.mojoh5.speed; break;
            case Mojo.UP:   e.mojoh5.vel[1] = -e.mojoh5.speed; break;
            case Mojo.DOWN: e.mojoh5.vel[1] = e.mojoh5.speed; break;
          }
        }
      };
      e.mojoh5.direction=Mojo.UP;
      e.mojoh5.speed=100;
      Mojo.EventBus.sub(["post.step",e],"step",self);
      return self;
    });

    function Enemy(scene,id,pos){
      let s= _S.sprite(_S.frame("sprites.png",32,32,0,32));
      s.anchor.set(0.5);
      s.mojoh5.speed= 150;
      s.mojoh5.vel[0]=150;
      s.mojoh5.vel[1]=150;
      s.mojoh5.uuid=id;
      s.x=pos[0]+s.width/2;
      s.y=pos[1]+s.height/2;
      Mojo.addMixin(s,"2d","enemyControls");
      s.mojoh5.boom=function(col){
        //if(_.inst(Player,col.obj)) { Mojo.runScene("level1"); }
      };
      s.mojoh5.collide=function(){
        for(let w, i=0;i<scene.world.wall.length;++i){
          w=scene.world.wall[i];
          Mojo["2d"].hit(s,w);
        }
      };
      s.mojoh5.step=function(dt){
      };
      Mojo.EventBus.sub(["bump",s],"boom",s.mojoh5);
      return s;
    }

    _Z.defScene("level1",{
      setup(){
        let level= Mojo.resources("tower_man.json").data;
        let world= this.world = _S.container();
        world.tiles=[];
        world.wall=[];
        this.insert(world);
        let tiled= world.tiled= {tileW: 32, tileH: 32,
          tilesInX: level[0].length,
          tilesInY: level.length};
        tiled.tiledWidth=32 * tiled.tilesInX;
        tiled.tiledHeight=32 * tiled.tilesInY;
        let layers = tiled.layers = level;
        for(let layer,y=0;y<layers.length;++y){
          layer=layers[y];
          for(let s,px,py,gid,x=0;x<layer.length;++x){
            gid=layer[x];
            px = x * tiled.tileW+16;
            py = y * tiled.tileH+16;
            s=null;
            switch(gid){
              case 0:
                s=Dot(this);
                s.anchor.set(0.5);
              break;
              case 1:
                s=_S.sprite(_S.frame("tiles.png",32,32,32,0));
                s.anchor.set(0.5);
                this.world.wall.push(s);
              break;
              case 2:
                s=Tower(this);
                s.anchor.set(0.5);
              break;
            }
            if(s){
                s.x = px;
                s.y = py;
                this.world.tiles.push(s);
                world.addChild(s);
            }
          }
        }
        //this.insert(Player(_tilePos(10,7)));
        let e1=Enemy(this,"e1",_tilePos(10,4));
        world.addChild(e1);
        //this.insert(new Enemy(_tilePos(15,10)));
        //this.insert(new Enemy(_tilePos(5,10)));
      },
      postUpdate(){
      }
    });
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "tower_man.json","tiles.png"],
      arena: {width:640,height:480},
      backgroundColor: 0,
      start:setup
    })
  });
})(this);



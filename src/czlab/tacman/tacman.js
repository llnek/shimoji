;(function(window){
  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_=Mojo.u;
    let _T=Mojo.Tiles;

    function _collide(scene,p){
      let wall=scene.world.tiled.getTileLayer("Collision",1);
      for(let w, i=0;i<wall.children.length;++i){
        w=wall.children[i];
        Mojo["2d"].hit(p,w);
      }
    }

    Mojo.defMixin("enemyControls", function(e){
      e.mojoh5.direction=Mojo.LEFT;
      e.mojoh5.switchPercent=2;
      let self={
        motion(dt){
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
      //Mojo.EventBus.sub(["post.step",e],"step",self);
      Mojo.EventBus.sub(["hit",e],"changeDirection",self);
      return self;
    });

    function Player(scene,col,row){
      let p= _S.sprite(_S.frame("sprites.png",32,32,0,0));
      let K=scene.world.tiled.getScaleFactor();
      p.y=row*scene.world.tiled.tileW*K+p.height/2;
      p.x=col*scene.world.tiled.tileH*K+p.width/2;
      p.scale.x=K;
      p.scale.y=K;
      p.anchor.set(0.5);
      p.mojoh5.speed=150 *K;
      p.mojoh5.uuid="player";
      Mojo.addMixin(p,"2d","towerManControls");
      p.mojoh5.step=function(dt){
        p["2d"].motion(dt);
        p["towerManControls"].motion(dt);
      };
      p.mojoh5.collide=()=>_collide(scene,p);
      return scene.player=p;
    }

    Mojo.defMixin("towerManControls", function(e){
      let self={
        motion(dt){
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
      //e.mojoh5.speed=100;
      //Mojo.EventBus.sub(["post.step",e],"step",self);
      return self;
    });

    function Enemy(scene,id,col,row){
      let s= _S.sprite(_S.frame("sprites.png",32,32,0,32));
      let K=scene.world.tiled.getScaleFactor();
      s.mojoh5.speed= 150*K;
      s.mojoh5.vel[0]=150;
      s.mojoh5.vel[1]=150;
      s.mojoh5.uuid=id;
      s.scale.x=K;
      s.scale.y=K;
      s.y=row*scene.world.tiled.tileW*K+s.height/2;
      s.x=col*scene.world.tiled.tileH*K+s.width/2;
      s.mojoh5.boom=function(col){
        //if(_.inst(Player,col.obj)) { Mojo.runScene("level1"); }
      };
      Mojo.EventBus.sub(["bump",s],"boom",s.mojoh5);
      Mojo.addMixin(s,"2d","enemyControls");
      s.mojoh5.collide=()=>_collide(scene,s);
      s.mojoh5.step=function(dt){
        s["2d"].motion(dt);
        s["enemyControls"].motion(dt);
        if(scene.player && Mojo["2d"].hitTest(s,scene.player)){
          _S.remove(scene.player);
          scene.player=null;
        }
      };
      return s;
    }

    _Z.defScene("level1",{
      setup(){
        let world=this.world=_T.tiledWorld("map.json");
        world.x=(Mojo.width-world.width)/2;
        world.y=(Mojo.height-world.height)/2;
        this.insert(world);
        world.addChild(Enemy(this,"e1",10,4));
        world.addChild(Enemy(this,"e2",15,10));
        world.addChild(Enemy(this,"e3",5,10));
        world.addChild(Player(this,10,7));
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        let es=this.world.tiled.getTileLayer("Edibles",1);
        for(let ps,e,i=0;i<es.children.length;++i){
          e=es.children[i];
          ps=e.tiled.props;
          if(this.player && ps && Mojo["2d"].hitTest(e,this.player)){
            ps=ps["Class"];
            if(ps ==="Tower"){
              _S.remove(e);
            }
            if(ps ==="Dot"){
              _S.remove(e);
              break;
            }
          }
        }
      }
    });
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "map.json","tiles.png"],
      arena: {width:640,height:480},
      scaleToWindow:"max",
      backgroundColor: 0,
      start:setup
    })
  });

})(this);



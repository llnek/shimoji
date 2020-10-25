(function(window){
  "use strict";

  function scenes(Mojo){
    let _=Mojo.u,_Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input;

    function Block(x,y,width,height,points){
      let inPoints=points;// && points.slice();
      if(points===undefined){
        let w2=width/2;
        let h2=height/2;
        points=[[-w2,-h2],[w2,-h2],[w2,h2],[-w2,h2]];
      }
      function draw(ctx){
        ctx.beginFill("blue");
        ctx.lineStyle(1, 0, 1);
        ctx.moveTo(points[0][0],points[0][1]);
        for(let i=0;i<points.length;++i){
          ctx.lineTo(points[i][0],points[i][1]);
        }
        ctx.lineTo(points[0][0],points[0][1]);
        ctx.closePath();
        ctx.endFill();
      }
      let s= _S.drawBody(draw);
      if(inPoints)
        s.mojoh5.getContactPoints=function(){ return inPoints };
      s.mojoh5.static=true;
      s.anchor.set(0.5);
      s.alpha=0.5;
      s.x=x;
      s.y=y;
      return s;
    }
    function Player(scene){
      let p=_S.sprite(_S.frame("sprites.png",30,29,0,0));
      let _D=Mojo["2d"];
      scene.insert(p);
      _S.setXY(p,Mojo.canvas.width/2 - 200,-180);
      p.anchor.set(0.5);
      Mojo.addMixin(p,"2d","platformer");
      p.mojoh5.gravity[1]=200;
      p.mojoh5.speed=200;
      p.mojoh5.collide=function(){
        if(_D.hit(p,scene.tower)){
          _S.remove(p);
          //_Z.runScene("endGame",1,{ label: "You Won!" });
        }else{
          _.doseq(scene.blocks,b=> _D.hit(p,b));
        }
      };
      p.mojoh5.step=function(dt){
        if(p.y > Mojo.canvas.height){
          alert("poo! ");
          //_Z.runScene("endGame",1, { label: "You Fell!" });
        }
        //if(p.mojoh5.vel[1] > 600) { p.mojoh5.vel[1] = 600; }
      };
      //Mojo.EventBus.sub(["hit",p],"collide",p.mojoh5);
      return p;
    }

    _Z.defScene("endGame",()=>{
    });

    _Z.defScene("bg",{
      setup(){
        let w= this.wall= _S.tilingSprite("background-wall.png",Mojo.canvas.width,Mojo.canvas.height);
        this.insert(w);
        //Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        this.wall.tilingPosition.x += 1;
        this.wall.tilingPosition.y += 1;
      }
    });
    _Z.defScene("level1",{
      setup(){
        let t= this.tower= _S.sprite(_S.frame("sprites.png",30, 30, 0,54));
        t.mojoh5.CLASS="Tower";
        this.insert(t);
        let player = this.player = Player(this);

        let X=Mojo.canvas.width/2;
        let Y=Mojo.canvas.height/2;
        //this.insert(Block(50, 30, 30, 50));
        //this.insert(Block(0,0, 50,150));
        //this.insert(Block(140, 0, 50, 100, [ [ 0, -15], [ 50, 0 ], [ 0, 15 ], [ -50, 0 ] ]));
        //this.insert(Block(340, 0, 100, 100, [ [ 0, -50], [25, -40] ,[ 50, 0 ], [ 0, 50 ], [ -100, 0 ] ]));
        //this.insert(Block(500, 40, 50, 50));

        this.blocks=[];

        let poo;
        let b1,b2,b3,b4,b5;
        _.conj(this.blocks, b1=Block(X-130, Y-30, 50,30));
        b1.mojoh5.uuid="b1";
        _.conj(this.blocks,b2=Block(X-180,Y, 150,50));
        b2.mojoh5.uuid="b2";
        _.conj(this.blocks,b3=Block(X, Y, 100,50, [ [ 0, -15], [ 50, 0 ], [ 0, 15 ], [ -50, 0 ] ]));
        b3.mojoh5.uuid="b3";
        _.conj(this.blocks,b4=Block(X+180, Y, 100, 140, [[ 0, -50], [25, -40], [ 50, 0 ], [ 0, 50 ], [ -90, 0 ] ]));
        b4.mojoh5.uuid="b4";
        b4.mojoh5.getContactPoints=function(){
          //need to redefine the shape
          return [[70,0],[20,50],[-70,0],[20,-50],[45,-40]]
        }
        _.conj(this.blocks,b5=Block(X+360, Y+40, 50, 50));
        b5.mojoh5.uuid="b5";
        _.doseq(this.blocks, b=> this.insert(b));
        this.tower.y= b5.y - this.tower.height;
        this.tower.x= b5.x ;

        let stage=Mojo.mockStage();
        let camera= this.camera = Mojo["2d"].worldCamera(this,stage.width,stage.height, Mojo.canvas);
        this.camera.follow(player);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        //Mojo["2d"].hit(this.player,this.poo);
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("bg");
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      start: setup,
      scaleToWindow: true,
      assetFiles: ["sprites.png","background-wall.png"]
    })
  });
})(this);


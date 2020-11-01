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
        if(p.y > scene.b5.y+scene.b5.height*3){
          _S.remove(p);
          _Z.runScene("endGame",{msg: "You Fell!"});
        }else{
          p["2d"].motion(dt);
          p.platformer.motion(dt);
        }
        //if(p.mojoh5.vel[1] > 600) { p.mojoh5.vel[1] = 600; }
      };
      //Mojo.EventBus.sub(["hit",p],"collide",p.mojoh5);
      return p;
    }

    _Z.defScene("endGame",{
      dispose(){
        this.btns.forEach(b => _I.removeButton(b))
      },
      setup(options){
        let s1=_S.text("Game Over", {fill:"white",align:"center"});
        let s2=_S.text(options.msg, {fill:"white",align:"center"});
        let s3=_S.text(" ");
        let s4=_I.makeButton(_S.text("Play Again?",{fill:"white",align:"center"}));
        let s5=_S.text("or",{fill:"white",align:"center"});
        let s6=_I.makeButton(_S.text("Quit",{fill:"white",align:"center"}));
        //let g=_Z.layoutX([s1,s3,s4,s5,s6],options);
        let g=_Z.layoutY([s1,s2,s3,s4,s5,s6],options);
        this.btns= [s4,s6];
        this.insert(g);
        s4.mojoh5.press=function(){
          _Z.removeScene("level1","endGame");
          _Z.runScene("level1");
        }
      }
    });

    _Z.defScene("bg",{
      setup(){
        let w= this.wall= _S.tilingSprite("background-wall.png",Mojo.canvas.width,Mojo.canvas.height);
        this.insert(w);
        //Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        //this.wall.tilePosition.x += 1;
        //this.wall.tilePosition.y += 1;
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
        this.tower.y= b5.y - b5.height/2 - this.tower.height;
        this.tower.x= b5.x - this.tower.width/2 ;
        this.b5=b5;

        let stage=Mojo.mockStage();
        let camera= this.camera = Mojo["2d"].worldCamera(this,stage.width,stage.height, Mojo.canvas);
        this.camera.follow(player);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
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


(function(window){
  "use strict";
  function scenes(Mojo){
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input;
    let _=Mojo.u;

    function draw(ctx,points){
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

    function VectorSprite(points){
      return _S.drawBody(draw,points);
    }

    function Asteroid(scene,arg){
      let p = createShape(arg);
      let mo=p.mojoh5;
      if(mo.vel[0]===0){
        mo.startAngle = mo.startAngle || Math.random()*360;
        let speed = Math.random()*100 + 50;
        mo.vel[0] = Math.cos(mo.startAngle)*speed;
        mo.vel[1] = Math.sin(mo.startAngle)*speed;
      }
      mo.omega= Math.random() * 100;
      mo.skipCollide= true;
      //Mojo.addf(this,"2d, reposition");
      //Mojo.EventBus.sub("hit.sprite",this,"collision");
      mo.boom=function(col){
        if(_.inst(Ship,col.obj)) {
          col.obj.reset();
        }
      };
      mo.step=function(dt){
        p.angle += mo.omega * dt;
      };
      function createShape(p){
        let numPoints = 7 + Math.floor(Math.random()*5);
        let angle = Math.random()*2*Math.PI;
        let minX = 0, maxX = 0;
        let minY = 0, maxY = 0;
        let curX, curY;
        let startAmount = p.size || 0;
        for(let i = 0;i < numPoints;++i){
          curX = Math.floor(Math.cos(angle)*startAmount);
          curY = Math.floor(Math.sin(angle)*startAmount);

          if(curX < minX) minX = curX;
          if(curX > maxX) maxX = curX;

          if(curY < minY) minY = curY;
          if(curY > maxY) maxY = curY;

          points.push([curX,curY]);

          startAmount += Math.floor(Math.random()*3);
          angle += (Math.PI * 2) / (numPoints+1);
        }

        maxX += 30;
        minX -= 30;
        maxY += 30;
        minY -= 30;

        p.w = maxX - minX;
        p.h = maxY - minY;

        for(let i = 0;i < numPoints;++i){
          points[i][0] -= minX + p.width/2;
          points[i][1] -= minY + p.height/2;
        }

        p.x = p.x || Math.random()*Mojo.canvas.width;
        p.y = p.y || Math.random()*Mojo.canvas.height;
        p.angle = angle;

        return p;
     }
    }

    function Bullet(scene){
      let points=[[0,0],[4,0],[4,4],[0,4]];
      let s= VectorSprite(points);
      let mo=s.mojoh5;
      //Mojo.addf(this,"2d");
      //Mojo.EventBus.sub("hit.sprite",this,"collision");
      mo.boom=function(col){
        var objP = col.obj.p;
        if(objP.size > 20) {
          this.scene.insert(new Asteroid({
            x: objP.x,
            y: objP.y,
            size: objP.size * 2 / 3,
            startAngle: objP.startAngle + 90
          }));
          this.scene.insert(new Asteroid({
            x: objP.x,
            y: objP.y,
            size: objP.size * 2 / 3,
            startAngle: objP.startAngle - 90
          }));
        }

        col.obj.scene.remove(col.obj);
        this.scene.remove(this);
      };

      mo.step=function(dt){
        if(!Mojo.overlap(this,this.scene)) {
          this.scene.remove(this);
        }
      }

      return s;
    }

    function Ship(scene){
      let points= [ [0, -10 ], [ 5, 10 ], [ -5,10 ]];
      let s= VectorSprite(points);
      let mo=s.mojoh5;
      mo.omega= 0;
      mo.omegaDelta= 700;
      mo.maxOmega= 400;
      mo.acceleration= 8;
      mo.getContactPoints=function(){ return points };
      mo.bulletSpeed= 500;
      mo.activated= false;

      //Mojo.addMixin(s,"2d","reposition");
      //Mojo.EventBus.sub("fire",Mojo.input,"fire",this);

      //s.activationObject = new Mojo.Sprite({ x: Mojo.width/2, y: Mojo.height/2, w: 100, h: 100 });

      let f=_I.keyboard(_I.keySPACE);
      f.press= function(){
        let dx =  Math.sin(s.angle * Math.PI / 180);
        let dy = -Math.cos(s.angle * Math.PI / 180);
        scene.insert(
          new Bullet({ x: this.c.points[0][0],
                         y: this.c.points[0][1],
                         vx: dx * p.bulletSpeed,
                         vy: dy * p.bulletSpeed
                  })
        );
      };

      function checkActivation(){
        if(!this.scene.search(this.activationObject, Mojo.E_ASTEROID)) {
          this.p.activated = true;
        }
      }

      mo.step=function(dt){
        if(!s.activated)
          return checkActivation();

        s.angle += mo.omega * dt;
        mo.omega *=  1 - 1 * dt;

        if(_I.keyDown(_I.keyRIGHT)){
          mo.omega += mo.omegaDelta * dt;
          if(mo.omega > mo.maxOmega) { mo.omega = mo.maxOmega; }
        }else if(_I.keyDown(_I.keyLEFT)){
          mo.omega -= mo.omegaDelta * dt;
          if(mo.omega < -mo.maxOmega) { mo.omega = -mo.maxOmega; }
        }

        if(s.angle > 360) { s.angle -= 360; }
        if(s.angle < 0) { s.angle += 360; }

        if(_I.keyDown(_I.keyUP)){
          let thrustX = Math.sin(s.angle * Math.PI / 180);
          let thrustY = -Math.cos(s.angle * Math.PI / 180);
          mo.vel[0] += thrustX * mo.acceleration;
          mo.vel[1] += thrustY * mo.acceleration;
        }
      };

      mo.reset=function(){
        s.x= Mojo.canvas.width/2;
        s.y= Mojo.canvas.height/2;
        mo.vel[0]= 0;
        mo.vel[1]= 0;
        s.angle= 0;
        mo.omega= 0;
        mo.activated= false;
      }

      return s;
    }

    _Z.defScene("level1",{
      setup(){
        let player = this.insert(Ship(Mojo.canvas.width/2, Mojo.canvas.height/2));
        this.insert(Asteroid(60));
        this.insert(Asteroid(60));
        this.insert(Asteroid(60));
        this.insert(Asteroid(60));
        this.insert(Asteroid(60));
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        //if(Mojo.$("Asteroid").length == 0 && !Mojo.scene(1)) {
          //Mojo.runScene("endGame",1, { label: "You Win!" });
        //}
      }
    })
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
    })
  });

})(this);

/*
      Mojo.defFeature("reposition", {
        added: function() {
          Mojo.EventBus.sub("step",this.entity,"step",this);
        },
        step: function(dt) {
          var p = this.entity.p;
          var maxSide = Math.sqrt(p.h * p.h  + p.w + p.w);
          if(p.x > Mojo.width + maxSide) { p.x -= Mojo.width + maxSide }
          if(p.x < -maxSide) { p.x += Mojo.width + maxSide }

          if(p.y > Mojo.height + maxSide) { p.y -= Mojo.height + maxSide }
          if(p.y < -maxSide) { p.y += Mojo.height + maxSide }
        }
      });
      */





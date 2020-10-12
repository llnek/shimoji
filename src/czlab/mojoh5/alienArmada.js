;(function(global){
  "use strict";

  let _bullets = [], _aliens = [];

  function defScenes(Mojo){

    const I=Mojo.Input, S=Mojo.Sprites, Z=Mojo.Scenes, _2d=Mojo["2d"], G=Mojo.Game;
    let _=Mojo.u, is=Mojo.is;

    Z.defScene("level1",{
      setup: function(){
        let self=this;
        let background = S.sprite("background.png",0,0,false);
        this.insert(background);
        let cannon = S.sprite("cannon.png",0,0,true);
        cannon.mojoh5.uuid="cannon";
        cannon.mojoh5.step=function(dt){
          S.move(cannon);
          _2d.contain(cannon, self);
        };
        this.insert(cannon);
        S.pinBottom(this,cannon,0,-40);

        _bullets.length=0;
        _aliens.length=0;

        G.music.volume=5;
        G.music.loop=true;
        //G.music.play();
        //Pan the `shootSound` so that it's 75% in the left speaker.
        //Panning values range between -1 (left speaker) and 1 (right
        //speaker.) A pan value of 0 means that the sound is equal
        //in both speakers.
        G.shootSound.pan = -0.5;
        //Pan the `explosionSound` so that it's 75% in the right speaker.
        G.boomSound.pan = 0.5;

        //Set up the keyboard arrow keys to move the cannon.
        let leftArrow = I.keyboard(37),
            rightArrow =I.keyboard(39),
            spaceBar = I.keyboard(32);

        leftArrow.press = function(){
          cannon.mojoh5.vel[0] = -5;
          cannon.mojoh5.vel[1] = 0;
        };

        leftArrow.release = function(){
          if(!rightArrow.isDown && cannon.mojoh5.vel[1] === 0){
            cannon.mojoh5.vel[0] = 0;
          }
        };

        rightArrow.press = function(){
          cannon.mojoh5.vel[0] = 5;
          cannon.mojoh5.vel[1] = 0;
        };

        rightArrow.release = function(){
          if(!leftArrow.isDown && cannon.mojoh5.vel[1] === 0) {
            cannon.mojoh5.vel[0] = 0;
          }
        };

        spaceBar.press = function(){
          S.shoot(cannon, //The shooter
            4.71, //The angle at which to shoot (4.71 is up)
            self, //The container to which the bullet should be added
            7, //The bullet's speed (pixels per frame)
            _bullets, //The array used to store the bullets
            function(){
              let b=S.sprite("bullet.png",0,0,true);
              b.mojoh5.step=function(){
                if(!b.mojoh5.dead)
                  S.move(b);
              };
              return b;
            },
            S.halfSize(cannon)[0], //Bullet's x position on the cannon
            0); //Bullet's y position on the canon
          G.shootSound.play();
        };

        G.score= 0;
        G.alienTimer= 0;
        G.winner= null;
        Mojo.EventBus.sub(["post.update",self],"doAliens");
      },
      doAliens: function(){
        let self=this;
        ++G.alienTimer;
        if(G.alienTimer === G.alienFrequency){
          let alienFrames = ["alien.png", "explosion.png"];
          let alien = S.sprite(alienFrames);
          //Define some states on the alien that correspond
          //to the its two frames.
          alien.states = { normal: 0, destroyed: 1 };
          //Set its y position above the screen boundary.
          alien.y = 0 - alien.height;
          //Assign the alien a random x position.
          alien.x = _.randInt2(0, 14) * alien.width;
          alien.mojoh5.vel[1] = 1;
          this.insert(alien);
          alien.mojoh5.step=function(){
            if(!alien.mojoh5.dead) S.move(alien);
          };
          _2d.contain(alien,self);
          _.conj(_aliens,alien);
          G.alienTimer = 0;
          //Reduce `alienFrequency` by one to gradually increase
          //the frequency that aliens are created
          if(G.alienFrequency > 2){
            --G.alienFrequency;
          }
        }
        let cannon= this.getChildById("cannon");
        let hitCannon=false;
        //Check for a collision between the aliens and the bullets.
        //Filter through each alien in the `aliens` array.
        _aliens = _aliens.filter(function(alien){
          let alienIsAlive = true;
          _bullets = _bullets.filter(function(bullet){
            if(_2d.hitTest(alien, bullet)){
              bullet.mojoh5.dead=true;
              alien.mojoh5.showFrame(alien.states.destroyed);
              G.boomSound.play();
              alien.mojoh5.vel[1] = 0;
              alien.mojoh5.dead=true;
              alienIsAlive = false;
              self.future(() => S.remove(alien,bullet),5);
              G.score += 1;
              return false;
            }else{
              return true;
            }
          });
          if(_2d.hitTest(alien,cannon)){ hitCannon=true; }
          return alienIsAlive;
        });

        if(G.score === G.scoreNeededToWin){
          G.winner = "p1";
        }else if(hitCannon){
          G.winner = "p2";
        }else{
          _aliens.forEach(function(alien){
            if(alien.y > Mojo.canvas.height){
              G.winner = "p2";
            }
          });
        }
        if(G.winner){
          Mojo.EventBus.unsub(["post.update",this]);
          this.end();
        }
      },
      end: function(){
        let bg=this.children[0];
        this.removeChildren();
        this.insert(bg);
        let msg = S.text("", {fontFamily: "emulogic", fontSize: 20, fill: "#00FF00"}, 90, 120);
        this.insert(msg);
        G.music.loop=false;
        G.music.pause();
        if(G.winner === "p1"){
          msg.mojoh5.content("Earth Saved!");
          msg.x = 120;
        }
        else if(G.winner === "p2"){
          msg.mojoh5.content("Earth Destroyed!");
        }
        function reset(){
          Mojo.Game.score= 0;
          Mojo.Game.alienFrequency= 100;
          Mojo.Game.alienTimer= 0;
          Mojo.Game.winner= "";
          Mojo.Game.music.volume = 1;
          Z.removeScenes();
          Z.runScene("level1");
          Z.runScene("hud");
        }
        this.future(() => reset(), 120);
      }
    });

    Z.defScene("hud", {
      setup:function(){
        let score= S.text("0", {fontFamily: "emulogic", fontSize: 20, fill: "#00FF00"}, 400, 10);
        score.mojoh5.step=function(){
          score.mojoh5.content(""+G.score);
        };
        this.insert(score);
      }
    });
  }

  window.addEventListener("load", ()=>
    window.MojoH5({
      assetFiles: ["images/alienArmada.json", "explosion.wav", "music.wav", "shoot.wav", "emulogic.ttf"],
      arena: { width: 480, height: 320 },
      scaleToWindow: true,
      fps:60,
      rps:60,
      //i:null,
      start: (Mojo)=>{
        Mojo.Game.boomSound = Mojo.sound("explosion.wav");
        Mojo.Game.shootSound = Mojo.sound("shoot.wav");
        Mojo.Game.music = Mojo.sound("music.wav");
        Mojo.Game.alienFrequency= 100;
        Mojo.Game.scoreNeededToWin= 10;
        defScenes(Mojo);
        Mojo.Scenes.runScene("level1");
        Mojo.Scenes.runScene("hud");
      }
    })
  );

})(this);


;(function(global){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const CIRCLE = Math.PI * 2;
    const int = Math.floor;
    const cos= Math.cos;
    const sin=Math.sin;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const PROJECTIONWIDTH= (function(){
      //return 320
      if(Mojo.width > 1400){
        return 1280
      }else if(Mojo.width > 1040){
        return 960
      }else if(Mojo.width > 800){
        return 640
      }else{
        return 320
      }
    })();

    _G.spacing = Mojo.width / PROJECTIONWIDTH;
    _G.fov = 0.8;
    _G.range = 14;//MOBILE ? 8 : 14;
    _G.lightRange = 5;
    _G.scale = (Mojo.width + Mojo.height) / 1200;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function Player(x, y, dir){
      //this.weapon = new Bitmap('assets/knife_hand.png', 319, 320);
      return{
        x,y,dir,paces:0,
        rotate(angle){
          this.dir += angle;
          if(this.dir>CIRCLE) this.dir -= CIRCLE;
          if(this.dir<0) this.dir += CIRCLE;
        },
        walk(dist, grid){
          let dx = cos(this.dir) * dist;
          let dy = sin(this.dir) * dist;
          if(grid.get(this.x + dx, this.y) <= 0) this.x += dx;
          if(grid.get(this.x, this.y + dy) <= 0) this.y += dy;
          this.paces += dist;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function Arena(size){
      let grid= _.fill(size*size,0);
      for(let i=0, z=size*size; i<z; ++i){
        grid[i] = _.rand() < 0.3 ? 1 : 0;
      }
      return {
        size,grid, light:0,
        get(x, y){
          x = int(x);
          y = int(y);
          if(x<0 || x > this.size-1 || y<0 || y > this.size-1) return -1;
          return this.grid[y * this.size + x];
        },
        cast(point, angle, range){
          let self = this;
          let SIN = sin(angle);
          let COS = cos(angle);
          let noWall = { length2: Infinity };
          return ray({ x: point.x, y: point.y, height: 0, dist: 0 });
          function ray(origin){
            let stepX = step(SIN, COS, origin.x, origin.y);
            let stepY = step(COS, SIN, origin.y, origin.x, true);
            let nextStep = stepX.length2 < stepY.length2
              ? inspect(stepX, 1, 0, origin.dist, stepX.y)
              : inspect(stepY, 0, 1, origin.dist, stepY.x);
            if(nextStep.dist > range)
              return [origin];
            else
              return [origin].concat(ray(nextStep));
          }
          function step(rise, run, x, y, inverted){
            if(run === 0) return noWall;
            let dx = run>0 ? int(x + 1) - x : Math.ceil(x - 1) - x;
            let dy = dx * (rise / run);
            return {
              x: inverted ? y + dy : x + dx,
              y: inverted ? x + dx : y + dy,
              length2: dx * dx + dy * dy
            };
          }
          function inspect(step, shiftX, shiftY, dist, offset){
            let dx = COS < 0 ? shiftX : 0;
            let dy = SIN < 0 ? shiftY : 0;
            step.height = self.get(step.x - dx, step.y - dy);
            step.dist = dist + Math.sqrt(step.length2);
            if(shiftX) step.shading = COS < 0 ? 2 : 0;
            else step.shading = SIN < 0 ? 2 : 1;
            step.offset = offset - int(offset);
            return step;
          }
        },
        update(dt){
          if(this.light > 0) this.light = Math.max(this.light - 10*dt, 0);
          else if(_.rand()*5 < dt) this.light = 2;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        let self=this,
            K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          _G.player = Player(15.3, -1.2, Math.PI * 0.3);
          _G.arena=Arena(20);
          this.insert(this.g.gfx=_S.graphics());
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      preUpdate(dt){
        this.g.gfx.clear();
        this.removeChildren();
        this.insert(this.g.gfx);
      },
      postUpdate(dt){
        _G.arena.update(dt);
        if(_I.keyDown(_I.LEFT)) _G.player.rotate(-Math.PI * dt);
        if(_I.keyDown(_I.RIGHT)) _G.player.rotate(Math.PI * dt);
        if(_I.keyDown(_I.UP)) _G.player.walk(3 * dt, _G.arena);
        if(_I.keyDown(_I.DOWN)) _G.player.walk(-3 * dt, _G.arena);
        this.drawSky();
        this.drawColumns();
        //this.drawWeapon(player.weapon, player.paces);
      },
      drawColumns(){
        for(let col= 0; col< PROJECTIONWIDTH; ++col){
          let x = col/ PROJECTIONWIDTH - 0.5;
          let angle = Math.atan2(x, _G.fov);
          let ray = _G.arena.cast(_G.player, _G.player.dir+ angle, _G.range);
          this.drawColumn(col, ray, angle);
        }
      },
      drawColumn(column, ray, angle){
        let left = int(column * _G.spacing);
        let width = Math.ceil(_G.spacing);
        let hit = -1;
        let base=Mojo.tcached("wall.jpg");

        while(++hit < ray.length && ray[hit].height <= 0);

        for(let step,s = ray.length-1; s >= 0; --s){
          step = ray[s];
          let rainDrops = Math.pow(_.rand(), 3) * s;
          let rain = (rainDrops > 0) && this.project(0.1, angle, step.dist);
            let old;
          if(s=== hit){
            let tX = int(base.width * step.offset);
            let wall = this.project(step.height, angle, step.dist);
            let s= new PIXI.Sprite(new PIXI.Texture(base, new PIXI.Rectangle(tX,0,1,base.height)));
            s.width=width;
            s.height=wall.height;
            s.x=left;
            s.y=wall.top;
            this.insert(_S.extend(s));
            /*
            old=this.g.gfx.alpha;
            this.g.gfx.beginFill(_S.color("#000000"));
            this.g.gfx.alpha= Math.max((step.dist + step.shading) / _G.lightRange - _G.arena.light, 0);
            this.g.gfx.drawRect(left, wall.top, width, wall.height);
            this.g.gfx.endFill();
            this.g.gfx.alpha=old;
            */
          }
          /*
          old=this.g.gfx.alpha;
          this.g.gfx.alpha=0.15;
          while(--rainDrops > 0){
            this.g.gfx.beginFill(_S.color("#ffffff"));
            this.g.gfx.drawRect(left, _.rand() * rain.top, 1, rain.height);
            this.g.gfx.endFill();
          }
          */
        }
      },
      project(height, angle, dist){
        let z = dist * cos(angle);
        let wallHeight = Mojo.height * height / z;
        let bottom = Mojo.height/2 * (1 + 1 / z);
        return {
          height: wallHeight,
          top: bottom - wallHeight
        }
      },
      drawSky(){
        let sky= _S.sprite("deathvalley.jpg");
        let width = sky.width * (Mojo.height / sky.height) * 2;
        let left = (_G.player.dir/ CIRCLE) * -width;
        sky.x=left;
        sky.y=0;
        sky.width=width;
        sky.height=Mojo.height;
        this.insert(_S.extend(sky));
        if(left < width - Mojo.width){
          sky= _S.sprite("deathvalley.jpg");
          sky.x= left+width;
          sky.y=0;
          sky.width=width;
          sky.height=Mojo.height;
          this.insert(_S.extend(sky));
        }
        if(false && _G.arena.light > 0){
          let old=this.g.gfx.alpha;
          this.g.gfx.beginFill(_S.color("#ffffff"));
          this.g.gfx.alpha= _G.arena.light * 0.1;
          this.g.gfx.drawRect(0, Mojo.height * 0.5, Mojo.width, Mojo.height * 0.5);
          this.g.gfx.endFill();
          this.g.gfx.alpha=old;
        }
      },
      drawWeapon(weapon, paces){
        /*
        let bobX = cos(paces * 2) * _G.scale * 6;
        let bobY = sin(paces * 4) * _G.scale * 6;
        let left = Mojo.width * 0.66 + bobX;
        let top = Mojo.height * 0.6 + bobY;
        this.ctx.drawImage(weapon.image, left, top, weapon.width * this.scale, weapon.height * this.scale);
        */
      }

    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["wall.jpg","deathvalley.jpg"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("PlayGame");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);









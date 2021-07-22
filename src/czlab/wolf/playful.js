(function(window){

  "use strict";

  function scenes(Mojo){
    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const CIRCLE = Math.PI * 2;
    const int=Math.floor;
    const sin=Math.sin;
    const cos=Math.cos;

    _Z.defScene("level1",{
      setup(){
        let out={x:0, y:0};
        _G.grid=_S.gridXY([120,40],0.9,0.6,out);
        _G.arena=Mojo.mockStage(out);
        _V.set(this,_G.arena.x,_G.arena.y);
        let pbox={x1:0,y1:0,
                  x2:_G.arena.width,
                  y2:_G.arena.height};
        this.insert(_S.drawGridBox(pbox));
        this.spacing= _G.grid[0][0].x2 - _G.grid[0][0].x1;
        this.light=0;
        this.fov=0.8;
        this.range = 14;//MOBILE ? 8 : 14;
        this.lightRange = 5;
        this.sizeX=32;
        this.sizeY=32;
        this.wallGrid=new Array(this.sizeX*this.sizeY);
        for(let i = 0; i < this.sizeX * this.sizeY; ++i){
          this.wallGrid[i] = Math.random() < 0.3 ? 1 : 0;
        }
        this.sky=_S.sprite("deathvalley_panorama.jpg");
        this.wall=_S.sprite("wall_texture.jpg");
        this.player={x: 15.3, y: -1.2, dir: Math.PI * 0.3, paces:0};
      },
      hitTest(x,y){
        x = Math.floor(x);
        y = Math.floor(y);
        if(x < 0 || x > this.sizeX - 1 || y < 0 || y > this.sizeY - 1) return -1;
        return this.wallGrid[y * this.sizeX + x];
      },
      drawSky(){
        let width = this.sky.width * (_G.arena.height / this.sky.height) * 2;
        let left = (this.player.dir / CIRCLE) * -width;
        let s=_S.sprite("deathvalley_panorama.jpg");
        s.width=width;
        s.height=_G.arena.height;
        s.x=left;
        this.insert(s);
        if(left < width - _G.arena.width){
          s=_S.sprite("deathvalley_panorama.jpg");
          s.width=width;
          s.height=_G.arena.height;
          s.x= left + width;
          this.insert(s);
        }
        if(this.light > 0){
          s= _S.graphics();
          s.beginFill(0xffffff);
          s.alpha = this.light * 0.1;
          s.drawRect(0, _G.arena.height * 0.5, _G.arena.width, _G.arena.height * 0.5);
          s.endFill();
          this.insert(s);
        }
      },
      cast(angle,range){
        angle += this.player.dir;
        let self = this;
        let _sin = sin(angle);
        let _cos = cos(angle);
        let noWall = { length2: Infinity };
        function step(rise, run, x, y, inverted){
          if(run === 0) return noWall;
          let dx = run > 0 ? int(x + 1) - x : Math.ceil(x - 1) - x;
          let dy = dx * (rise / run);
          return {
            x: inverted ? y + dy : x + dx,
            y: inverted ? x + dx : y + dy,
            length2: dx * dx + dy * dy
          };
        }
        function inspect(step, shiftX, shiftY, distance, offset){
          let dx = _cos < 0 ? shiftX : 0;
          let dy = _sin < 0 ? shiftY : 0;
          step.height = self.hitTest(step.x - dx, step.y - dy);
          step.distance = distance + Math.sqrt(step.length2);
          if(shiftX) step.shading = _cos < 0 ? 2 : 0;
          else step.shading = _sin < 0 ? 2 : 1;
          step.offset = offset - int(offset);
          return step;
        }
        function ray(origin){
          let stepX = step(_sin, _cos, origin.x, origin.y);
          let stepY = step(_cos, _sin, origin.y, origin.x, true);
          let nextStep = stepX.length2 < stepY.length2
            ? inspect(stepX, 1, 0, origin.distance, stepX.y)
            : inspect(stepY, 0, 1, origin.distance, stepY.x);
          return (nextStep.distance > range) ? [origin] : [origin].concat(ray(nextStep));
        }
        return ray({ x: this.player.x, y: this.player.y, height: 0, distance: 0 });
      },
      drawColumns(){
        this.gfx=_S.graphics();
        for(let c= 0,z= _G.grid[0].length; c < z; ++c){
          let x = c/z - 0.5;
          let angle = Math.atan2(x, this.fov);
          let ray = this.cast(angle,this.range);
          this.drawCol(c, ray, angle);
        }
        this.insert(this.gfx);
      },
      drawCol(col, ray, angle){
        let left = int(col * this.spacing);
        let width = Math.ceil(this.spacing);
        let hit = -1;
        let texture= this.wall;

        while(++hit < ray.length && ray[hit].height <= 0);

        for(let g,s = ray.length-1; s >= 0; --s){
          let step = ray[s];
          let rainDrops = Math.pow(Math.random(), 3) * s;
          let rain = (rainDrops > 0) && this.project(0.1, angle, step.distance);
          if(s === hit){
            let textureX = int(texture.width * step.offset);
            let wall = this.project(step.height, angle, step.distance);
            //ctx.globalAlpha = 1;
            g=_S.frame("wall_texture.jpg",1,texture.height,textureX,0);
            g.width=width;
            g.height=wall.height;
            g.x=left;
            g.y=wall.top;
            this.insert(g);
            //this.gfx.beginFill(0);
            //this.gfx.alpha = Math.max((step.distance + step.shading) / this.lightRange - this.light, 0);
            //this.gfx.drawRect(left, wall.top, width, wall.height);
          }
          //this.gfx.beginFill(0xffffff);
          //this.gfx.alpha = 0.15;
          //while(--rainDrops > 0) this.gfx.drawRect(left, Math.random() * rain.top, 1, rain.height);
        }
      },
      project(height, angle, distance){
        let z = distance * cos(angle);
        let wallHeight = _G.arena.height * height / z;
        let bottom = _G.arena.height / 2 * (1 + 1 / z);
        return {
          top: bottom - wallHeight,
          height: wallHeight
        };
      },
      turn(angle){
        this.player.dir= (this.player.dir + angle + CIRCLE) % (CIRCLE);
      },
      walk(distance){
        let dx = cos(this.player.dir) * distance;
        let dy = sin(this.player.dir) * distance;
        if(this.hitTest(this.player.x + dx, this.player.y) <= 0) this.player.x += dx;
        if(this.hitTest(this.player.x, this.player.y + dy) <= 0) this.player.y += dy;
        this.player.paces += distance;
      },
      draw(){
        this.removeChildren();
        this.drawSky();
        this.drawColumns();
      },
      postUpdate(dt){
        if(_I.keyDown(_I.LEFT)) this.turn(-Math.PI * dt);
        if(_I.keyDown(_I.RIGHT)) this.turn(Math.PI * dt);
        if(_I.keyDown(_I.UP)) this.walk(3 * dt);
        if(_I.keyDown(_I.DOWN)) this.walk(-3 * dt);
        this.draw();
      }
    })
  }

  const _$={
    assetFiles: ["deathvalley_panorama.jpg"],
    arena: {width: 720, height: 240},
    scaleToWindow:"max",
    scaleFit:"x",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


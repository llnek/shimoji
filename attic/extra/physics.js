(function(global,undefined) {

  let MojoH5=global.MojoH5;

  MojoH5.Physics = function(Mojo) {

    let _ = Mojo.u;
    let B2d = {World: Box2D.Dynamics.b2World,
               Vec: Box2D.Common.Math.b2Vec2,
               BodyDef: Box2D.Dynamics.b2BodyDef,
               Body: Box2D.Dynamics.b2Body,
               FixtureDef: Box2D.Dynamics.b2FixtureDef,
               Fixture: Box2D.Dynamics.b2Fixture,
               PolygonShape: Box2D.Collision.Shapes.b2PolygonShape,
               CircleShape: Box2D.Collision.Shapes.b2CircleShape,
               Listener:  Box2D.Dynamics.b2ContactListener };

    let defOpts = Mojo.PhysicsDefaults = {gravityX: 0,
                                          gravityY: 9.8,
                                          scale: 30,
                                          velocityIterations: 8,
                                          positionIterations: 3};

    Mojo.PhysicsDefaults = defOpts;
    Mojo.B2d=B2d;
    Mojo.feature("world",{
      added: function() {
        this.opts = _.inject({},defOpts);
        this._gravity = new B2d.Vec(this.opts.gravityX,
                                    this.opts.gravityY);
        this._world = new B2d.World(this._gravity, true);

        let physics = this,
            boundBegin = function(contact) { physics.beginContact(contact); },
            boundEnd = function(contact) { physics.endContact(contact); },
            boundPostSolve = function(contact,impulse) { physics.postSolve(contact,impulse); };

        this._listener = new B2d.Listener();
        this._listener.BeginContact = boundBegin;
        this._listener.EndContact = boundEnd;
        this._listener.PostSolve = boundPostSolve;
        this._world.SetContactListener(this._listener);

        this.col = {};
        this.scale = this.opts.scale;
        Mojo.EventBus.sub("step",this.entity,"boxStep",this);
      },
      setCollisionData: function(contact,impulse) {
        let spriteA = contact.GetFixtureA().GetBody().GetUserData(),
            spriteB = contact.GetFixtureB().GetBody().GetUserData();

        this.col["impulse"] = impulse;
        this.col["a"] = spriteA;
        this.col["b"] = spriteB;
        this.col["sprite"] = null;
      },
      beginContact: function(contact) {
        this.setCollisionData(contact,null);
        Mojo.EventBus.pub("contact",this.col.a,this.col.b);
        Mojo.EventBus.pub("contact",this.col.b,this.col.a);
        Mojo.EventBus.pub("contact",this.entity,this.col);
      },
      endContact: function(contact) {
        this.setCollisionData(contact,null);
        Mojo.EventBus.pub("endContact",this.col.a,this.col.b);
        Mojo.EventBus.pub("endContact",this.col.b,this.col.a);
        Mojo.EventBus.pub("endContact",this.entity,this.col);
      },
      postSolve: function(contact, impulse) {
        this.setCollisionData(contact,impulse);
        this.col["sprite"] = this.col.b;
        Mojo.EventBus.pub("impulse",this.col.a,this.col);
        this.col["sprite"] = this.col.a;
        Mojo.EventBus.pub("impulse",this.col.b,this.col);
        Mojo.EventBus.pub("impulse",this.entity,this.col);
      },
      createBody: function(def) {
        return this._world.CreateBody(def);
      },
      destroyBody: function(body) {
        return this._world.DestroyBody(body);
      },
      boxStep: function(dt) {
        if(dt > 1/20) { dt = 1/20; }
        this._world.Step(dt,
                         this.opts.velocityIterations,
                         this.opts.positionIterations);
      }
    });

    let entityDefaults = {density: 1,
                          friction: 1,
                          restitution: 0.1 };

    Mojo.PhysicsEntityDefaults = entityDefaults;
    Mojo.feature("physics",{
      added: function() {
        if(this.entity.layer)
          this.inserted();
        else
          Mojo.EventBus.sub("inserted",this.entity,"inserted",this);
        Mojo.EventBus.sub("step",this.entity,"step",this);
        Mojo.EventBus.sub("removed",this.entity,"removed",this);
      },

      position: function(x,y) {
        let L = this.entity.layer;
        this._body.SetAwake(true);
        this._body.SetPosition(new B2d.Vec(x / L.world.scale,
                                           y / L.world.scale));
      },

      angle: function(angle) {
        this._body.SetAngle(angle / 180 * Math.PI);
      },

      velocity: function(x,y) {
        let L= this.entity.layer;
        this._body.SetAwake(true);
        this._body.SetLinearVelocity(new B2d.Vec(x / L.world.scale,
                                                 y / L.world.scale));
      },

      inserted: function() {
        let entity = this.entity,
            L = entity.layer,
            scale = L.world.scale,
            p = entity.p,
            ops = entityDefaults,
            def = this._def = new B2d.BodyDef(),
            fixtureDef = this._fixture = new B2d.FixtureDef();

        def.position.x = p.x / scale;
        def.position.y = p.y / scale;
        def.type = p.type === "static" ?
                   B2d.Body.b2_staticBody :
                   B2d.Body.b2_dynamicBody;
        def.active = true;

        this._body = L.world.createBody(def);
        this._body.SetUserData(entity);
        fixtureDef.density = p.density || ops.density;
        fixtureDef.friction = p.friction || ops.friction;
        fixtureDef.restitution = p.restitution || ops.restitution;

        switch(p.shape) {
          case "block":
            fixtureDef.shape = new B2d.PolygonShape();
            fixtureDef.shape.SetAsBox(p.w/2/scale, p.h/2/scale);
            break;
          case "circle":
            fixtureDef.shape = new B2d.CircleShape(p.r/scale);
            break;
          case "polygon":
            fixtureDef.shape = new B2d.PolygonShape();
            let pointsObj = _.map(p.points,function(pt) {
              return { x: pt[0] / scale, y: pt[1] / scale };
            });
            fixtureDef.shape.SetAsArray(pointsObj, p.points.length);
            break;
        }

        this._body.CreateFixture(fixtureDef);
        this._body._bbid = p.id;
      },

      removed: function() {
        let entity = this.entity,
            L = entity.stage;
        L.world.destroyBody(this._body);
      },

      step: function() {
        let p = this.entity.p,
            L = this.entity.layer,
            pos = this._body.GetPosition(),
            angle = this._body.GetAngle();
        p.x = pos.x * L.world.scale;
        p.y = pos.y * L.world.scale;
        p.angle = angle / Math.PI * 180;
      }
    });


    return Mojo;
  };



})(this);

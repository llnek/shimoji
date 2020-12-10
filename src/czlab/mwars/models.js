;(function(window){
  "use strict";

  window["io.czlab.mwars.models"]=function(Mojo){
    const _V=window["io.czlab.mcfud.vec2"]();
    const _S=Mojo.Sprites;
    const _G=Mojo.Game;
    const _D=Mojo["2d"];
    const _=Mojo.u;

    _G.seekWithTarget=function(m,target){
      let dir= _V.vecUnitSelf(_V.vecSub(target, [m.x,m.y]));
      return _V.vecMulSelf(dir, m.maxAcceleration);
    };

    let timeToTarget = 0.1;
    _G.arriveWithTarget=function(m,target){
      let vector = _V.vecSub(target, [m.x,m.y]);
      let dist= _V.vecLen(vector);
      let targetRadius = 5;
      let slowRadius = targetRadius + 25;
      if(dist< targetRadius){
        m.mojoh5.vel[0] = m.mojoh5.vel[1] = 0;
        m.mojoh5.acc[0] = m.mojoh5.acc[1]=0;
        return [0,0];
      }
      let targetSpeed= dist>slowRadius? m.maxVelocity: m.maxVelocity*dist/slowRadius;
      let targetVel= _V.vecMulSelf(_V.vecUnit(vector), targetSpeed);
      let acc= _V.vecMulSelf(_V.vecSubSelf(targetVel, m.mojoh5.vel), 1/timeToTarget);
      if(_V.vecLen(acc) > m.maxAcceleration){
        acc= _V.vecMulSelf(_V.vecUnit(acc), m.maxAcceleration);
      }
      return acc;
    };

    let SEPARATE_THRESHHOLD = 20;
    _G.separate=function(m){
      let steering=[0,0];
      let dir;
      let dist;
      m.owner.army.forEach(a=>{
        if(a !== m){
          dir= _V.vecSubSelf([m.x,m.y], [a.x,a.y]);
          dist= _V.vecLen(dir);
          if(dist<SEPARATE_THRESHHOLD){
            dir= _V.vecUnitSelf(dir);
            steering = _V.vecAddSelf(steering, _V.vecMulSelf(dir, m.maxAcceleration));
          }
        }
      });
      return steering;
    };

    let ATTACK_THRESHHOLD = 150;
    _G.updateMove=function(m,dt){
      if(m.maxAcceleration <= 0 || m.maxVelocity <= 0) return;
      let hasTarget = false;
      let moveTarget=[0,0];
      let e= _G.closestEnemy(m);
      let dist= e ? _V.vecDist([m.x,m.y], [e.x,e.y]) : 0;
      if(m.owner.attacking || (e && dist<ATTACK_THRESHHOLD)){
        if(!e){
          e=_G.getOtherPlayer(m.owner);
          dist= _V.vecDist([m.x,m.y], [e.x,e.y]);
        }
        if(e){
          hasTarget = true;
          moveTarget = [e.x,e.y];
          if(m.isRanged){
            let vector = _V.vecUnitSelf(_V.vecSubSelf([m.x,m.y], [e.x,e.y]));
            moveTarget = _V.vecAddSelf([e.x,e.y], _V.vecMulSelf(vector, m.rangedRange));
            dist= _V.vecDist([m.x,m.y], moveTarget);
          }
        }
      }else{
        hasTarget = true;
        moveTarget = [m.owner.x,m.owner.y];
      }
      if(hasTarget){
        // Calculate amount to accelerate, based on goal of arriving at nearest enemy,
        // and separating from nearby enemies
        //CGPoint seekComponent = [self seekWithTarget:moveTarget];
        let arriveComponent = _G.arriveWithTarget(m,moveTarget);
        let separateComponent = _G.separate(m);
        let newAcceleration = _V.vecAdd(arriveComponent, separateComponent);
        // Update current acceleration based on the above, and clamp
        m.mojoh5.acc= _V.vecAddSelf(m.mojoh5.acc, newAcceleration);
        if(_V.vecLen(m.mojoh5.acc) > m.maxAcceleration){
          m.mojoh5.acc= _V.vecMul(_V.vecUnitSelf(m.mojoh5.acc), m.maxAcceleration);
        }
        // Update current velocity based on acceleration and dt, and clamp
        m.mojoh5.vel= _V.vecAddSelf(m.mojoh5.vel, _V.vecMul(m.mojoh5.acc, dt));
        if(_V.vecLen(m.mojoh5.vel) > m.maxVelocity){
          m.mojoh5.vel= _V.vecMulSelf(_V.vecUnitSelf(m.mojoh5.vel), m.maxVelocity);
        }
        // Update position based on velocity
        let newPosition = _V.vecAddSelf([m.x,m.y], _V.vecMul(m.mojoh5.vel, dt));
        m.x = Math.max(Math.min(newPosition[0], Mojo.width), 0);
        m.y = Math.max(Math.min(newPosition[1], Mojo.height), 0);
      }
    };

    _G.checkCollision=function(m,enemy){
      if(m.alive && enemy.alive && _D.hitTest(m, enemy)){
        let now=_.now();
        if(now - m.meleeLastDamageTime > m.meleeDamageRate){
          Mojo.sound(m.meleeSound).play();
          if(m.meleeAoe){
            m._aoeDamageCaused = true;
          }else{
            m.meleeLastDamageTime = now;
          }
          enemy.curHp -= m.meleeDamage;
          if(enemy.curHp<0){
            enemy.curHp = 0;
          }
          if(m.meleeDestroySelf && m.owner){
            _.disj(m.owner.army,m);
            _S.remove(m);
            m.alive=false;
          }
        }
      }
    };

    _G.updateMelee=function(m,dt){
      if(!m.isMelee) return;
      let other= _G.getOtherPlayer(m.owner);
      m._aoeDamageCaused = false;
      for(let i=other.army.length-1;i>=0;--i){
        _G.checkCollision(m,other.army[i]);
      }
      _G.checkCollision(m,other);
      // Special case for AOE damage - let it attack multiple things before we
      // reset the last damage time
      if(m._aoeDamageCaused){
        m.meleeLastDamageTime = _.now();
      }
    };

    let laserPointsPerSecond = 100;
    let laserDistance = 1000;
    let WIGGLE_ROOM = 5;
    _G.updateRanged=function(m,dt){
      if(!m.isRanged) return;
      let e= _G.closestEnemy(m);
      if(!e){
        e= _G.getOtherPlayer(m.owner);
      }
      if(!e) return;
      let dist= _V.vecDist([m.x,m.y], [e.x,e.y]);
      let now=_.now();
      if(Math.abs(dist) <= (m.rangedRange + WIGGLE_ROOM) &&
         now - m.rangedLastDamageTime > m.rangedDamageRate){
        Mojo.sound(m.rangedSound).play();
        m.rangedLastDamageTime = now;
        let laser = _G.createLaser(m.owner);
        laser.x=m.x;
        laser.y=m.y;
        laser.meleeDamage = m.rangedDamage;
        let dir= _V.vecUnitSelf(_V.vecSubSelf([e.x,e.y], [m.x,m.y]));
        let target = _V.vecMulSelf(dir, laserDistance);
        let duration = laserDistance / laserPointsPerSecond;
        laser.rotation= -atan2(dir[1]/dir[0]);
        //laser.zOrder = 1;
        _S.moveBy(laser,duration,target);
      }
    };

  };

})(this);



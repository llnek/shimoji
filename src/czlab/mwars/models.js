/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(window){

  "use strict";

  window["io/czlab/mwars/models"]=function(Mojo){
    const {Sprites:_S,Game:_G,"2d":_D,ute:_,is,EventBus}=Mojo;
    const _V=window["io/czlab/mcfud/vec2"]();
    const MFL=Math.floor;

    _G.seekWithTarget=function(m,target){
      return _V.mul$(_V.unit$(_V.sub(target, _V.vec(m.x,m.y))), m.g.maxAcceleration);
    };

    let timeToTarget = 0.1;
    _G.arriveWithTarget=function(m,target){
      let vector = _V.sub(target, [m.x,m.y]);
      let dist= _V.len(vector);
      let targetRadius = 5;
      let slowRadius = targetRadius + 25;
      if(dist< targetRadius){
        _S.velXY(m,0,0);
        _S.accXY(m,0,0);
        return _V.vec();
      }
      let targetSpeed= dist>slowRadius? m.g.maxVelocity: m.g.maxVelocity*dist/slowRadius;
      let targetVel= _V.mul$(_V.unit(vector), targetSpeed);
      let acc= _V.mul$(_V.sub$(targetVel, m.m5.vel), 1/timeToTarget);
      if(_V.len(acc) > m.g.maxAcceleration){
        acc= _V.mul$(_V.unit$(acc), m.g.maxAcceleration);
      }
      return acc;
    };

    let SEPARATE_THRESHHOLD = 20;
    _G.separate=function(m){
      let steering=_V.vec();
      let dir;
      let dist;
      m.g.owner.g.army.forEach(a=>{
        if(a !== m){
          dir= _V.sub$(_V.vec(m.x,m.y),
                       _V.vec(a.x,a.y));
          dist= _V.len(dir);
          if(dist<SEPARATE_THRESHHOLD){
            dir= _V.unit$(dir);
            steering = _V.add$(steering, _V.mul$(dir, m.g.maxAcceleration));
          }
        }
      });
      return steering;
    };

    let ATTACK_THRESHHOLD = 150;
    _G.updateMove=function(m,dt){
      if(m.g.maxAcceleration <= 0 ||
         m.g.maxVelocity <= 0) {return}
      let hasTarget = false;
      let moveTarget=_V.vec();
      let e= _G.closestEnemy(m);
      let vm=_V.vec(m.x,m.y);
      let ve=e?_V.vec(e.x,e.y):null;
      let dist= e ? _V.dist(vm, ve) : 0;
      if(m.g.owner.attacking || (e && dist<ATTACK_THRESHHOLD)){
        if(!e){
          e=_G.getOtherPlayer(m.g.owner);
          ve=_V.vec(e.x,e.y);
          dist= _V.dist(vm, ve);
        }
        if(e){
          hasTarget = true;
          moveTarget = ve;
          if(m.g.isRanged){
            let vector = _V.unit$(_V.sub(vm, ve));
            moveTarget = _V.add$(ve, _V.mul$(vector, m.g.rangedRange));
            dist= _V.dist(vm, moveTarget);
          }
        }
      }else{
        hasTarget = true;
        moveTarget = _V.vec(m.g.owner.x,m.g.owner.y);
      }
      if(hasTarget){
        // Calculate amount to accelerate, based on goal of arriving at nearest enemy,
        // and separating from nearby enemies
        //CGPoint seekComponent = [self seekWithTarget:moveTarget];
        let arriveComponent = _G.arriveWithTarget(m,moveTarget);
        let separateComponent = _G.separate(m);
        let newAcceleration = _V.add(arriveComponent, separateComponent);
        // Update current acceleration based on the above, and clamp
        _V.add$(m.m5.acc, newAcceleration);
        if(_V.len(m.m5.acc) > m.g.maxAcceleration){
          _V.mul$(_V.unit$(m.m5.acc), m.g.maxAcceleration);
        }
        // Update current velocity based on acceleration and dt, and clamp
        _V.add$(m.m5.vel, _V.mul(m.m5.acc, dt));
        if(_V.len(m.m5.vel) > m.g.maxVelocity){
          _V.mul$(_V.unit$(m.m5.vel), m.g.maxVelocity);
        }
        // Update position based on velocity
        let newPosition = _V.add$(vm, _V.mul(m.m5.vel, dt));
        m.x = Math.max(Math.min(newPosition[0], Mojo.width), 0);
        m.y = Math.max(Math.min(newPosition[1], Mojo.height), 0);
      }
    };

    _G.checkCollision=function(m,enemy){
      if(!m.m5.dead && !enemy.m5.dead && _D.hitTest(m, enemy)){
        let now=_.now();
        if(now - m.g.meleeLastDamageTime > m.g.meleeDamageRate){
          Mojo.sound(m.g.meleeSound).play();
          if(m.g.meleeAoe){
            m.g._aoeDamageCaused = true;
          }else{
            m.g.meleeLastDamageTime = now;
          }
          enemy.g.curHp -= m.g.meleeDamage;
          if(enemy.g.curHp<0){
            enemy.g.curHp = 0;
          }
          if(m.g.meleeDestroySelf && m.g.owner){
            _.disj(m.g.owner.army,m);
            m.m5.dead=true;
            _S.remove(m);
          }
        }
      }
    };

    _G.updateMelee=function(m,dt){
      if(!m.g.isMelee) return;
      let other= _G.getOtherPlayer(m.g.owner);
      m.g._aoeDamageCaused = false;
      for(let i=other.g.army.length-1;i>=0;--i){
        _G.checkCollision(m,other.g.army[i]);
      }
      _G.checkCollision(m,other);
      // Special case for AOE damage - let it attack multiple things before we
      // reset the last damage time
      if(m.g._aoeDamageCaused){
        m.g.meleeLastDamageTime = _.now();
      }
    };

    let laserPointsPerSecond = 100;
    let laserDistance = 1000;
    let WIGGLE_ROOM = 5;
    _G.updateRanged=function(m,dt){
      if(!m.g.isRanged) return;
      let e= _G.closestEnemy(m);
      if(!e){
        e= _G.getOtherPlayer(m.g.owner);
      }
      if(!e) return;
      let vm= _V.vec(m.x,m.y);
      let ve= _V.vec(e.x,e.y);
      let dist= _V.dist(vm,ve);
      let now=_.now();
      if(Math.abs(dist) <= (m.g.rangedRange + WIGGLE_ROOM) &&
         now - m.g.rangedLastDamageTime > m.g.rangedDamageRate){
        Mojo.sound(m.g.rangedSound).play();
        m.g.rangedLastDamageTime = now;
        let laser = _G.createLaser(m.g.owner);
        _S.setXY(laser,m.x, m.y);
        laser.g.meleeDamage = m.g.rangedDamage;
        let dir= _V.unit$(_V.sub(ve, vm));
        let target = _V.mul$(dir, laserDistance);
        let duration = laserDistance / laserPointsPerSecond;
        laser.rotation= -atan2(dir[1]/dir[0]);
        //laser.zOrder = 1;
        _S.moveBy(laser,duration,target);
      }
    };

  };

})(this);



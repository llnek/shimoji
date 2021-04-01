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

"use strict";

const C_RUN="run",
      C_INIT="init",
      C_RESOLVE="resolve",
      C_ALERT="alert",
      C_BCAST="bcast",
      C_TURRET="turret",
      C_FIRE="fire",
      C_TURN="turn",
      C_FORWARD="forward",
      C_BACKWARD="backward";

class WorkerBot {
  constructor(){
    this.x= 0;
    this.y= 0;
    this.hp= 0;
    this.reconnInfo=[];
    this.eventCnt = 0;
    this.callbacks={};
    let me= this;
    self.onmessage=(e)=>{ me.recv(e.data) };
  }
  moveForward(dist, cb=null){
    this.send({cmd: C_FORWARD,
               amount: dist }, cb)
  }
  moveBack(dist, cb=null){
    this.send({cmd: C_BACKWARD,
               amount: dist }, cb)
  }
  turnLeft(angle, cb=null){
    this.send({cmd: C_TURN,
               side: -1,
               amount:angle }, cb)
  }
  turnRight(angle, cb=null){
    this.send({cmd: C_TURN,
               side:1,
               amount:angle }, cb)
  }
  turnTurretLeft(angle, cb=null){
    this.send({cmd: C_TURRET, side:-1,amount: angle })
  }
  turnTurretRight(angle, cb=null){
    this.send({cmd: C_TURRET, side:1,amount: angle })
  }
  fireCannon(){
    this.send({cmd: C_FIRE })
  }
  bcast(msg){
    this.send({cmd: C_BCAST, target: msg })
  }
  onInit(msg){
    Object.assign(this,msg)
  }
  recv(msg){
    let obj=JSON.parse(msg);
    let {cmd,id,data}=obj;
    let me=this;
    switch(cmd){
      case C_INIT:
        this.onInit(data);
        break;
      case C_RUN:
        setTimeout(()=> me.tick(), 0);
        break;
      case C_RESOLVE:
        let cb=this.callbacks[id];
        delete this.callbacks[id]
        if(typeof cb == "function"){
          cb();
        }
        break;
      case C_ALERT:
        if(obj.isOOB){ this.onOOB(obj.dir) }
        if(obj.isHit){ this.onHit() }
        break;
    }
  }
  onOOB(dir){}
  onHit(){}
  tick(){}
  send(msg, cb=null){
    let id = ++this.eventCnt;
    msg.id=id;
    this.callbacks[id] = cb;
    postMessage(JSON.stringify(msg));
  }
}

class UserBot extends WorkerBot{
  constructor(){
    super();
  }
  tick(){
    throw "must implement tick in subclass"
  }
  onHit(){
    throw "must implement onHit in subclass"
  }
  onOOB(dir){
    throw "must implement onOOB in subclass"
  }
}




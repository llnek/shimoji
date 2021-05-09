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

importScripts("../user.js");

class BlueBot extends UserBot{
  constructor(){
    super();
  }
  tick(){
    this.moveForward(100,()=>{
      this.fireCannon()
    });
  }
  onHit(){
    console.log("shit");
  }
  onOOB(dir){
    if(dir>0)
      this.moveBack(this.radius);
    else
      this.moveForward(this.radius);
    this.turnRight(90);
  }
}

var b=new BlueBot();





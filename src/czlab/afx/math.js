// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020, Kenneth Leung. All rights reserved.

;(function(global,undefined){
  const Math=function(Core){
    const EPSILON= 0.0000000001 || Number.EPSILON;
    const NEG_DEG_2PI= -360;
    const DEG_2PI= 360;
    const TWO_PI= 2*Math.PI;
    const PI= Math.PI;
    const ATAN2= Math.atan2;
    const ACOS= Math.acos;
    const COS= Math.cos;
    const SIN= Math.sin;
    const TAN= Math.tan;
    const _M={};
    function _odd(n){ return n%2 !== 0 }
    /**
     * Proper modulo.
     * @public
     * @function
     */
    _M.xmod=function(x,N){
      return x < 0 ? x-(-(N + N*Math.floor(-x/N))) : x%N
    };
    /**
     * @public
     * @function
     */
    _M.fuzzyEq=function(a,b){
      return Math.abs(a-b) < EPSILON
    };
    /**
     * @public
     * @function
     */
    _M.fuzzyZero=function(n){
      return this.fuzzyEq(n, 0.0)
    };
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //;;VECTORS
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * Fuzzy match.
     * @private
     * @function
     */
    function _cmp_eq(x,y){
      return Math.abs(x-y) <= (EPSILON * Math.max(1, Math.max(Math.abs(x), Math.abs(y))))
    }
    /**
     * @public
     * @function
     */
    _M.V2=function(x,y){
      return [x||0, y||0]
    };
    /**
     * @public
     * @function
     */
    _M.V3=function(x,y,z){
      return [x||0, y||0, z||0]
    };
    /**
     * @public
     * @function
     */
    _M.V4=function(x,y,z,a){
      return [x||0, y||0, z||0, a||0]
    };
    /**
     * @private
     * @function
     */
    function _mod_deg(deg){
      return deg<0 ? -(-deg%DEG_2PI) : deg%DEG_2PI
    }
    /**
     * Radian to degree.
     *
     * @function
     * @public
     */
    _M.radToDeg=function(r){
      return _mod_deg(DEG_2PI * r/TWO_PI)
    };
    /**
     * Degree to radian.
     *
     * @public
     * @function
     */
    _M.degToRad=function(d){
      return TWO_PI * _mod_deg(d)/DEG_2PI
    };
    const _4ops={ "+": (a,b)=>a+b, "-": (a,b)=>a-b,
                  "*": (a,b)=>a*b, "/": (a,b)=>a/b };
    function _vecXXX(op,a,b){
      return is.num(b) ? a.map(v => op(v,b))
                       : a.length===b.length && a.map((v,i) => op(v,b[i]))
    }
    /**
     * @public
     * @function
     */
    _M.vecAdd=function(a,b){ return _vecXXX(_4ops["+"],a,b) };
    /**
     * @function
     * @public
     */
    _M.vecSub=function(a,b){ return _vecXXX(_4ops["-"],a,b) };
    /**
     * @public
     * @function
     */
    _M.vecMul=function(a,b){ return _vecXXX(_4ops["*"],a,b) };
    /**
     * @public
     * @function
     */
    _M.vecDiv=function(a,b){ return _vecXXX(_4ops["/"],a,b) };
    /**
     * Dot product of vectors, cosα = a·b / (|a| * |b|).
     *
     * @public
     * @function
     * @returns {number}
     */
    _M.vecDot=function(a,b){
      if(a.length===b.length)
        return a.reduce((S,v,i) => S+v*b[i], 0)
    }
    /**
     * @public
     * @function
     */
    _M.vecLen2=function(a){ return this.vecDot(a,a) }
    /**
     * @public
     * @function
     */
    _M.vecLen=function(a){ return Math.sqrt(this.vecLen2(a)) }
    /**
     * @public
     * @function
     */
    _M.vecDist2=function(a,b){ return this.vecLen2(this.vecSub(b,a)) }
    /**
     * @public
     * @function
     */
    _M.vec2Dist=function(a,b){ return Math.sqrt(this.vecDist2(a,b)) }
    /**
     * Unit-vector.
     * @public
     * @function
     */
    _M.vecUnit=function(a){
      let d=this.vecLen(a);
      return d > EPSILON ? a.map(v => v/d) : a.map(v => 0)
    };
    /**
     * @public
     * @function
     */
    _M.vec2Rot=function(a,rot,center){
      let cx=center ? center[0] : 0;
      let cy=center ? center[1] : 0;
      let x_= x - cx;
      let y_= y - cy;
      let cos= COS(rot);
      let sin=SIN(rot);
      return this.V2(cx + (x_*cos - y_*sin),
                     cy + (x_ * sin + y_ * cos))
    };
    //"normal to 2d-vector."
    //_M.vec2Cross=function(a,v){ return _.p2(-a * y, a*x) };
    /**
     * If positive, b is on top of a,
     * if negative, b below a. Take the absolute value then it will
     * be the sine of the angle between them."
     * @public
     * @function
     */
    _M.vec2Cross=function(a,b){ return a[0] * b[1] - a[1] * b[0] };
    /**
     * @public
     * @function
     */
    _M.vec3Cross=function(a,b){
      return this.V3(a.y * b.z - a.z * b.y,
                     a.z * b.x - a.x * b.z,
                     a.x * b.y - a.y * b.x)
    };
    /**
     * Angle between these 2 vectors.
     * a.b = cos(t)*|a||b|
     * @public
     * @function
     */
    _M.vecAngle=function(a,b){
      return ACOS(this.vecDot(a,b) / (this.vecLen(a) * this.vecLen(b)))
    };
    /**
     * Find scalar projection.
     * @public
     * @function
     * @returns {number}
     */
    _M.proj=function(a,b){
      return this.vecDot(a,b)/this.vecLen(b)
    };
    /**Find vector projection.
     * @public
     * @function
     */
    _M.vecProj=function(a,b){
      return this.vecMul(b, this.vec2Dot(a,b)/this.vec2Len2(b))
    };
    /**
     * Find the perpedicular vector.
     * @public
     * @function
     */
    _M.vecPerp=function(a,b){ return this.vecSub(a, this.vecProj(a,b)) };
    /**
     * Reflect a normal.
     * @public
     * @function
     */
    _M.vecReflect=function(src,normal){
      return this.vecSub(src, this.vecMul(normal, 2*this.vecDot(src,normal)))
    };
    /**
     * Negate a vector.
     * @public
     * @function
     */
    _M.vecNeg=function(v){ return this.vecMul(v, -1) };
    _M.vecFlip=function(v){ return this.vecMul(v, -1) };
    _M.vecReverse=function(v){ return this.vecMul(v, -1) };
    /**
     * Normal of a vector.
     *
     * if v is ------------------> then
     *         |
     *         |
     *         v
     * if s=true, then
     *         ^
     *         |
     *         |
     *         -------------------->
     * @public
     * @function
     */
    _M.vecNormal=function(v,s){
      //origin = (0,0) => x1=0,y1=0, x2= vx, y2=vy
      let x1=0;
      let y1=0;
      let dy= v[1] - y1;
      let dx= v[0] - x1;
      return s ? this.V2(-dy, dx) : this.V2(dy, -dx)
    };
    /**
     * Minimum values of vectors.
     * @public
     * @function
     */
    _M.vecMin=function(a,b){
      let ret=[];
      if(a.length===b.length)
        for(let i=0; i<a.length;++i)
          ret.push(Math.min(a[i],b[i]));
      return ret
    };
    /**
     * Maximum values of vectors.
     * @public
     * @function
     */
    _M.vecMax=function(a,b){
      let ret=[];
      if(a.length===b.length)
        for(let i=0; i<a.length;++i)
          ret.push(Math.max(a[i],b[i]));
      return ret
    };
    /**
     * @private
     * @function
     */
    function _arrayEq(a1,a2){
      //2 numeric arrays are equal?
      for(let i=0;i<a1.length;++i){
        if(!_M.fuzzyEq(a1[i],a2[i]))
          return false;
      }
      return true
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //MATRIX
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //index where matrix is mapped to 1D array.
    function _cell(rows,cols,r,c){
      return (c-1) + ((r-1)*cols)
    }
    function _matnew(rows,cols,cells){
      return {dim: [rows,cols], cells: cells}
    }
    function _new_mat(rows,cols){
      return _matnew(rows,cols, _.fill(new Array(rows*cols),0))
    }
    /**
     * @public
     * @function
     */
    _M.matrix=function(dim,...args){
      let rows=dim[0];
      let cols=dim[1];
      let sz= rows*cols;
      return args.length===0 ? _new_mat(rows,cols)
                             : _.assert(sz===args.length) && _matnew(rows,cols,args)
    };
    /**
     * @public
     * @function
     */
    _M.matIdentity=function(sz){
      let out=_.fill(new Array(sz*sz),0);
      for(let i=0;i<sz;++i)
        out[_cell(sz,sz,i+1,i+1)] = 1;
      return _matnew(sz, sz, out)
    };
    /**
     * Matrix with zeroes.
     * @public
     * @function
     */
    _M.matZero=function(sz){
      return _.assert(sz>0) &&
             _matnew(sz,sz,_.fill(new Array(sz*sz),0))
    };
    /**
     * A 2x2 matrix.
     * @public
     * @function
     */
    _M.mat2=function(_11,_12,_21,_22){
      return this.matrix([2,2], _11,_12,_21,_22)
    };
    /**
     * A 3x3 matrix.
     * @public
     * @function
     */
    _M.mat3=function(_11,_12,_13,_21,_22,_23,_31,_32,_33){
      return this.matrix([3,3], _11,_12,_13,_21,_22,_23,_31,_32,_33)
    };
    /**
     * A 4x4 matrix.
     * @public
     * @function
     */
    _M.mat4=function(_11,_12,_13,_14,_21,_22,_23,_24,
                     _31,_32,_33,_34, _41,_42,_43,_44){
      return this.matrix([4,4],
                         _11,_12,_13,_14,_21,_22,_23,_24,
                         _31,_32,_33,_34,_41,_42,_43,_44)
    };
    /**
     * Matrices are equals.
     * @public
     * @function
     */
    _M.matEq=function(a,b){
      return a.dim[0]===b.dim[0] &&
             a.dim[1]===b.dim[1] ? this.arrayEq(a.cells,b.cells) : false
    };
    /**
     * Matrices are different.
     * @public
     * @function
     */
    _M.matNeq=function(a,b){ return !this.matEq(a,b) };
    /**
     * Transpose a matrix.
     * @function
     * @public
     */
    _M.matXpose=function(m){
      let rows=m.dim[0];
      let cols=m.dim[1];
      let sz=rows*cols;
      let tmp=[];
      for(let i=0;i<sz;++i)
        tmp.push(m.cells[(i/rows) + cols*(i%rows)]);
      return _matnew(cols,rows,tmp)
    };
    /**
     * Inverse a 3x3 matrix - fast.
     * @public
     * @function
     */
    _M.mat3FastInverse=function(m){
      return _.assert(m.dim[0]===3 && m.dim[1]===3) && this.matXpose(m)
    };
    /**
     * Inverse a 4x4 matrx - fast.
     * @public
     * @function
     */
    _M.mat4FastInverse=function(m){
      _assert(m.dim[0]===4&&m.dim[1]===4);
      let rows=m.dim[0],cols=m.dim[1];
      let out=this.matXpose(m);
      let p=_.partition(cols,m.cells);
      let m1=p[0],m2=p[1],m3=p[2],m4=p[3];
      let right=m1.slice(0,3);
      let up=m2.slice(0,3);
      let forward=m3.slice(0,3);
      let position=m4.slice(0,3);
      m.cells[_cell(4,4,1,4)]= 0;
      m.cells[_cell(4,4,2,4)]= 0;
      m.cells[_cell(4,4,3,4)]=0;
      m.cells[_cell(4,4,4,1)]= -this.vecDot(right,position);
      m.cells[_cell(4,4,4,2)]= -this.vecDot(up,position);
      m.cells[_cell(4,4,4,3)]= -this.vecDot(forward,position);
      return out;
    };
    /**
     * Scalar multiply a matrix.
     * @public
     * @function
     */
    _M.matScale=function(m,n){
      return _matnew(m.dim[0],m.dim[1],m.cells.map(x => x*n))
    };
    /**
     * Multiply 2 matrices.
     * @public
     * @function
     */
    _M.matMult=function(a,b){
      let aRows=a.dim[0], aCols=a.dim[1], aCells=a.cells;
      let bRows=b.dim[0], bCols=b.dim[1], bCells=b.cells;
      _.assert(aCols===bRows, "mismatch matrices");
      let out=new Array(aRows*bCols);
      for(let i=0; i<aRows; ++i)
        for(let j=0; j<bCols; ++j){
          out[j+i*bCols]=
            _.range(bRows).reduce((acc,k) => {
              return acc + aCells[k+i*aCols] * bCells[j+ k*bCols] },0);
        }
      return _matnew(aRows,bCols,out)
    };
    /** Determinent.
     *
     * @public
     * @function
     */
    _M.matDet=function(m){
      let rows=m.dim[0], cols=m.dim[1];
      let tmp=[];
      for(let c=0; c< cols;++c)
        _.conj(tmp,this.matDet(this.matCut(m,1,c+1)));
      return _.range(cols).reduce((acc,j) => {
        let v=tmp[j];
        return acc + m.cells[j] * (_odd(j) ? -v : v)
      },0)
    };
    /**
     * Matrix determinent.
     * @public
     * @function
     */
    _M.matDet2x2=function(m){
      _.assert(m.cells.length===4);
      return m.cells[0]*m.cells[3] - m.cells[1] * m.cells[2]
    };
    /**
     * Extract a portion of a matrix.
     * Get rid of a row and col.
     * @public
     * @function
     */
    _M.matCut=function(m,row,col){
      let rows=m.dim[0], cols=m.dim[1];
      //change to zero indexed
      let _row = row-1;
      let _col= col-1;
      let tmp=[];
      for(let i=0; i<rows; ++i)
        for(let j=0; j<cols; ++j){
          if(!(i === _row || j === _col))
            _.conj(tmp, m.cells[j+i*cols]);
        }
      return _matnew(rows-1,cols-1, tmp)
    };
    /**
     * Matrix minor.
     * @public
     * @function
     */
    _M.matMinor=function(m){
      let rows=m.dim[0], cols=m.dim[1];
      let tmp=[];
      for(let i=0; i< rows;++i)
        for(let j=0; j<cols; ++j){
          //mat-cut is 1-indexed
          _.conj(tmp,this.matDet(this.matCut(m,i+1,j+1)));
        }
      return _matnew(rows,cols,tmp)
    };
    /**
     * @public
     * @function
     */
    _M.matMinor2x2=function(m){
      return _.assert(m.cells.length===4) &&
             this.mat2(m.cells[3],m.cells[2],m.cells[1],m.cells[0])
    };
    /**
     * Matrix co-factor.
     * @public
     * @function
     */
    _M.matCofactor=function(m){
      let minor=this.matMinor(m);
      let rows=minor.dim[0];
      let cols=minor.dim[1];
      let tmp=m.cells.slice();
      for(let len=rows*cols,i=0; i< len; ++i){
        if(_odd(i))
          tmp[i]= -tmp[i];
      }
      return _matnew(rows,cols,tmp)
    };
    /**
     * Matrix adjugate.
     * @public
     * @function
     */
    _M.matAdjugate=function(m){
      return this.matXpose(this.matCofactor(m))
    };
    /**
     * Inverse matrix.
     * @public
     * @function
     */
    _M.matInverse2x2=function(m){
      let rows=m.dim[0], cols=m.dim[1];
      _.assert(m.cells.length===4&&rows===2&&cols===2);
      let r,c=m.cells;
      let det= c[0]*c[3] - c[1]*c[2];
      if(this.fuzzyZero(det))
        r=this.matIdentity(rows);
      else{
        let _det= 1/det;
        r= this.mat2(c[3]*_det, -c[1] * _det,
                     -c[2] * _det, c[0] * _det);
      }
      return r
    };
    /**
     * @function
     * @public
     */
    _M.matInverse=function(m){
      let rows=m.dim[0],cols=m.dim[1];
      let d= this.matDet(m);
      return this.fuzzyZero(d) ? this.matIdentity(rows)
                               : this.matScale(this.matAdjugate(m), 1/d)
    };
    /**
     * Matrix from column major.
     * @function
     * @public
     */
    _M.matFromColMajor=function(m){
      return this.matXpose(m)
    };
    /**
     * Matrix to column major.
     * @public
     * @function
     */
    _M.matToColMajor=function(m){
      return this.matXpose(m)
    };
    /**
     * Translate a 3x3 matrix.
     * @public
     * @function
     */
    _M.mat4Txlate=function(v3){
      let out= _.assert(v3.length===3) && this.matIdentity(4);
      out.cells[_cell(4,4,4,1)]= v3[0];
      out.cells[_cell(4,4,4,2)]= v3[1];
      out.cells[_cell(4,4,4,3)]= v3[2];
      return out
    };
    /**
     * Matrix from matrix-translation.
     *
     * @public
     * @function
     * @param m a 3x3 matrix
     * @returns 4x4 matrix
     */
    _M.matFromMX_3x3=function(m){
      _.assert(m.cells.length===9);
      let rows=m.dim[0], cols=m.dim[1];
      let p=_.partition(cols,m.cells);
      let r1=p[0], r2=p[1], r3=p[2];
      return _matnew(rows+1,cols+1, r1.concat(0, r2, 0, r3, 0, [0,0,0,1]))
    };
    /**
     * Get the translation of a matrix.
     * @public
     * @function
     * @param m 4x4 matrix
     * @returns 3d vector
     */
    _M.getTranslation4x4=function(m){
      _.assert(m.cells.length===16);
      let c=m.cells;
      return this.V3(c[_cell(4,4,4,1)],
                     c[_cell(4,4,4,2)],
                     c[_cell(4,4,4,3)])
    };
    /**
     * Matrix from vector-translation.
     * @public
     * @function
     * @param v3 3d vector
     * @returns 4x4 matrix
     */
    _M.matFromVX_V3=function(v3){
      _.assert(v3.length===3);
      let out=this.matIdentity(4);
      let c=out.cells;
      c[_cell(4,4,1,1)]= v3[0];
      c[_cell(4,4,2,2)]= v3[1];
      c[_cell(4,4,3,3)]= v3[2];
      return out
    };
    /**
     * Get scale from matrix-translation.
     * @public
     * @function
     * @param m4 4x4 matrix
     * @returns 3d vector
     */
    _M.getScaleFromMX_4x4=function(m4){
      _.assert(m4.cells.length===16);
      let rows=m4.dim[0], cols=m4.dim[1];
      let p= _.partition(cols,m4.cells);
      let r1=p[0],r2=p[1],r3=p[2];
      return this.V3(r1[0], r2[1], r3[2])
    };
    /**
     * Multiply matrix and  vector.
     * @public
     * @function
     * @returns vector
     */
    _M.matVMult=function(m,v){
      let cols=m.dim[1];
      let rows=v.length;
      _.assert(cols===rows);
      let r= this.matMult(m, _matnew(rows, 1, v));
      let c=r.cells;
      r.cells=null;
      return c
    };
    /**
     * Rotate a 2x2 matrix, counter-clockwise
     * @function
     * @public
     */
    _M.rotation2x2=function(rot){
      return this.mat2(COS(rot),-SIN(rot),SIN(rot),COS(rot))
    };
    /**
     * 3D rotation.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.yawPitchRoll=function(yaw,pitch,roll){
      return this.mat4(COS(roll) * COS(yaw) +
                       SIN(roll)*SIN(pitch)*SIN(yaw),
                       SIN(roll)*COS(pitch),
                       COS(roll)* -SIN(yaw) +
                       SIN(roll)*SIN(pitch)*COS(yaw),
                       0,
                       -SIN(roll)*COS(yaw) +
                       COS(roll)*SIN(pitch)*SIN(yaw),
                       COS(roll)*COS(pitch),
                       SIN(roll)*SIN(yaw) +
                       COS(roll)*SIN(pitch)*COS(yaw),
                       0,
                       COS(pitch)*SIN(yaw),
                       -SIN(pitch),
                       COS(pitch)*COS(yaw),
                       0,
                       0,0,0,1)
    };
    /**
     * Rotate on x-axis in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.xRotation=function(rad){
      return this.mat4(1,0,0,0,
                       0,COS(rad),SIN(rad),0,
                       0,-SIN(rad),COS(rad),0,
                       0,0,0,1)
    };
    /**
     * Rotate on x-axis in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _M.xRotation3x3=function(rad){
      return this.mat3(1,0,0,
                       0, COS(rad), SIN(rad),
                       0, -SIN(rad), COS(rad))
    };
    /**
     * Rotate on y-axis in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.yRotation=function(rad){
      return this.mat4(COS(rad),0,-SIN(rad),0,
                       0,1, 0, 0,
                       SIN(rad), 0, COS(rad), 0,
                       0,0,0,1)
    };
    /**
     * Rotate on y-axis in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _M.yRotation3x3=function(rad){
      return this.mat3(COS(rad), 0, -SIN(rad),
                       0, 1, 0,
                       SIN(rad), 0, COS(rad))
    };
    /**
     * Rotate in z-axis in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.zRotation=function(rad){
      return this.mat4(COS(rad), SIN(rad), 0, 0,
                       -SIN(rad),COS(rad), 0, 0,
                       0, 0, 1, 0,
                       0, 0, 0, 1)
    };
    /**
     * Rotate in z-axis in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _M.zRotation3x3=function(rad){
      return this.mat3(COS(rad),SIN(rad), 0,
                       -SIN(rad),COS(rad), 0,
                       0, 0, 1)
    };
    /**
     * Rotation in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.mat4Rotation=function(pitch,yaw,roll){
      return this.matMult(
               this.matMult(this.zRotation(roll),
                            this.xRotation(pitch)), this.yRotation(yaw))
    };
    /**
     * Rotation in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _M.mat3Rotation=function(pitch,yaw,roll){
      return this.matMult(
               this.matMult(this.zRotation3x3(roll),
                            this.xRotation3x3(pitch)),this.yRotation3x3(yaw))
    };
    /**
     * Orthogonal of matrix.
     * @public
     * @function
     * @param m 4x4 matrix
     * @returns 4x4 matrix
     */
    _M.matOrthogonal4x4=function(m){
      _.assert(m.cells.length===16);
      let rows=m.dim[0],cols=m.dim[1];
      let p= _.partition(cols,m.cells);
      let r1=p[0], r2=p[1], r3=p[2], r4=p[3];
      let xAxis=r1.slice(0,3);
      let yAxis=r2.slice(0,3);
      let zAxis=this.vec3Cross(xAxis,yAxis);
      let _x=this.vec3Cross(yAxis,zAxis);
      let _y=this.vec3Cross(zAxis,xAxis);
      let _z=this.vec3Cross(xAxis,yAxis);
      return this.mat4(_x[0],_x[1],_x[2],r1[3],
                       _y[0],_y[1],_y[2],r2[3],
                       _z[0],_z[1],_z[2],r3[3],
                       r4[0],r4[1],r4[2],r4[3])
    };
    /**
     * @public
     * @function
     * @param m 3x3 matrix
     * @returns 3x3 matrix
     */
    _M.matOrthogonal3x3=function(m){
      _.assert(m.cells.length===9);
      let rows=m.dim[0], cols=m.dim[1];
      let p= _.partition(cols,m.cells);
      let r1=p[0], r2=p[1], r3=p[2];
      let xAxis=r1;//this.V3(r1[0],r1[1],r1[2]);
      let yAxis=r2;//this.V3(r2[0],r2[1],r2[2]);
      let zAxis=this.vec3Cross(xAxis,yAxis);
      let _x=this.vec3Cross(yAxis,zAxis);
      let _y=this.vec3Cross(zAxis,xAxis);
      let _z=this.vec3Cross(xAxis,yAxis);
      return this.mat3(_x[0],_x[1],_x[2],
                       _y[0],_y[1],_y[2],
                       _z[0],_z[1],_z[2])
    };
    /**
     * Rotate on this axis by this angle in 4D.
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.mat4AxisAngle=function(axis ,rad){
      _.assert(axis.length===3);
      let x=axis[0],y=axis[1],z=axis[2];
      let d= this.vecLen(axis);
      let c=COS(rad);
      let s=SIN(rad);
      let t= 1-c;
      if(!this.fuzzyEq(d,1)){
        let ilen= 1/d;
        x *= ilen;
        y *= ilen;
        z *= ilen;
      }
      return this.mat4(c+t*x*x,
                       t*x*y+s*z,
                       t*x*z-s*y,
                       0,
                       t*x*y-s*z,
                       c + t*y*y,
                       t*y*z+s*x,
                       0,
                       t*x*z+s*y,
                       t*y*z-s*x,
                       c + t*z*z,
                       0,
                       0,0,0,1)
    };
    /**
     * Rotate on this axis by this angle in 3D.
     * @public
     * @function
     * @returns 3x3 matrix
     */
    _M.axisAngle3x3=function(axis,rad){
      _.assert(axis.length===3);
      let x=axis[0],y=axis[1],z=axis[2];
      let c=COS(rad);
      let s=SIN(rad);
      let t= 1-c;
      let d= this.vecLen(axis);
      if(!this.fuzzyEq(d,1)){
        let ilen=1/d;
        x *= ilen;
        y *= ilen;
        z *= ilen;
      }
      return this.mat3(c + t*x*x,
                       t*x*y + s*z,
                       t*x*z - s*y,
                       t*x*y - s*z,
                       c + t*y*y,
                       t*y*z + s*x,
                       t*x*z + s*y,
                       t*y*z - s*x,
                       c + t*z*z)
    };
    /**
     * Multiply vector and 4x4 matrix.
     * @function
     * @public
     * @returns 3d vector
     */
    _M.matMultV3M4=function(v3,m4){
      _.assert(v3.length===3&&m4.cells.length===16);
      let x=v3[0],y=v3[1],z=v3[2];
      let p=_.partition(4,m4.cells);
      let r1=p[0],r2=p[1],r3=p[2],r4=p[3];
      return this.V3(x*r1[0] + y*r2[0] + z*r3[0] + 1*r4[0],
                     x*r1[1] + y*r2[1] + z*r3[1] + 1*r4[1],
                     x*r1[2] + y*r2[2] + z*r3[2] + 1*r4[2])
    };
    /**
     * Multiply vector and 4x4 matrix.
     * @public
     * @function
     * @returns 3d vector
     */
    _M.mat3MultVX_4x4=function(v3,m4){
      _.assert(v3.length===3&&m4.cells.length===16);
      let x=v3[0],y=v3[1],z=v3[2];
      let p=_.partition(4,m4.cells);
      let r1=p[0],r2=p[1],r3=p[2],r4=p[3];
      return this.V3(x*r1[0] + y*r2[0] + z*r3[0] + 0*r4[0],
                     x*r1[1] + y*r2[1] + z*r3[1] + 0*r4[1],
                     x*r1[2] + y*r2[2] + z*r3[2] + 0*r4[2])
    };
    /**
     * Multiply vector and 3x3 matrix.
     * * @public
     * @function
     * @returns 3d vector
     */
    _M.mat3MultVX_3x3=function(v3,m3){
      _.assert(v3.length===3&&m3.cells.length===9);
      let x=v3[0],y=v3[1],z=v3[2];
      let p=_.partition(3,m3.cells);
      let r1=p[0],r2=p[1],r3=p[2];
      return this.V3(
        this.vecDot(v3, this.V3(r1[0],r2[0],r3[0])),
        this.vecDot(v3, this.V3(r1[1],r2[1],r3[1])),
        this.vecDot(v3, this.V3(r1[2],r2[2],r3[2])))
    };
    /**
     * Transform a 4x4 matrix.
     * @public
     * @function
     * @param eulerRotation 3d vector
     * @returns 4x4 matrix
     */
    _M.mat4TxformViaRotation=function(scale,eulerRotation,translate){
      _.assert(eulerRotation.length===3);
      let x=eulerRotation[0];
      let y=eulerRotation[1];
      let z=eulerRotation[2];
      return this.matMult(
        this.matMult(this.matFromVX(scale),
                     this.mat4Rotation(x,y,z)),
        this.mat4Txlate(translate))
    };
    /**
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.mat4TxformViaAxisAngle=function(scale,rotationAxis, rotationAngle,translate){
      return this.matMult(
        this.matMult(this.matFromVX(scale),
                     this.mat4AxisAngle(rotationAxis,
                                        rotationAngle)),
        this.mat4Txlate(translate))
    };
    /**
     * View of a 4D matrix.
     * @public
     * @function
     */
    _M.mat4LookAt=function(pos,target,up){
      let fwd=this.vecUnit(this.vecSub(target,pos));
      let right=this.vecUnit(this.vec3Cross(up,fwd));
      let newUp=this.vecCross(fwd,right);
      return this.mat4(right[0],newUp[0],fwd[0],0,
                       right[1],newUp[1],fwd[1],0,
                       right[2],newUp[2],fwd[2],0,
                       -this.vecDot(right,pos),
                       -this.vecDot(newUp,pos),
                       -this.vecDot(fwd,pos), 1)
    };
    /**
     * 4D projection.
     * https://msdn.microsoft.com/en-us/library/windows/desktop/bb147302(v=vs.85).aspx
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.mat4Proj=function(fov,aspect,zNear,zFar){
      let tanHalfFov= TAN(fov*0.5);
      let fovY=1/tanHalfFov;//cot(fov/2)
      let fovX=fovY/aspect; //cot(fov/2) / aspect
      let r33= zFar / (zFar - zNear);// far/range
      let ret= this.matIdentity(4);
      ret.cells[_cell(4,4,1,1)]= fovX;
      ret.cells[_cell(4,4,2,2)]=fovY;
      ret.cells[_cell(4,4,3,3)]= r33;
      ret.cells[_cell(4,4,3,4)]= 1;
      ret.cells[_cell(4,4,4,3)]= -zNear*r33; //-near * (far / range)
      ret.cells[_cell(4,4,4,4)]=0;
      return ret
    };
    /**
     * Orthogonal to this 4x4 matrix.
     * Derived following: http://www.songho.ca/opengl/gl_projectionmatrix.html
     * Above was wrong, it was OpenGL style, our matrices are DX style
     * Correct impl:
     * https://msdn.microsoft.com/en-us/library/windows/desktop/bb205347(v=vs.85).aspx
     * @public
     * @function
     * @returns 4x4 matrix
     */
    _M.mat4Ortho=function(left,right,bottom,top,zNear,zFar){
      let _11= (right-left)/2;
      let _22= (top-bottom)/2;
      let _33= (zFar-zNear)/1;
      let _41= (left+right)/(left-right);
      let _42= (top+bottom)/(bottom-top);
      let _43= zNear/(zNear-zFar);
      return this.mat4(_11,0,0,0,
                       0,_22,0, 0,
                       0, 0, _33, 0,
                       _41, _42, _43, 1)
    };
    /**
     * Decompose matrix.
     * @public
     * @function
     * @param rot1 3x3 matrix
     * @returns 3d vector
     */
    _M.matDecompose3x3=function(rot1){
      let rot= this.matXpose(rot1);
      let p= _.partition(3, rot);
      let r1=p[0],r2=p[1],r3=p[2];
      let sy= Math.sqrt(r1[0]*r1[0] + r2[0]*r2[0]);
      let singular= sy< 1e-6;
      return !singular ? this.V3(ATAN2(r3[1],r3[2]),
                                 ATAN2(-r3[0],sy),
                                 ATAN2(r2[0],r1[0]))
                       : this.V3(ATAN2(-r2[2],r2[1]),
                                 ATAN2(-r3[0],sy), 0)
    };
    /**
     * Hypotenuse squared.
     * @public
     * @function
     */
    _M.pythagSQ=function(x,y){ return x*x + y*y };
    /**
     * Hypotenuse.
     * @public
     * @function
     */
    _M.pythag=function(x,y){ return Math.sqrt(x*x + y*y) };
    /**
     * Modulo of the next increment.
     * @function
     * @public
     */
    _M.wrap=function(i,len){ return (i+1) % len };
    /**
     * Is it more a or b?
     * @public
     * @function
     */
    _M.biasGreater=function(a,b){
      const biasRelative= 0.95;
      const biasAbsolute= 0.01;
      return a >= (b*biasRelative + a*biasAbsolute)
    };

    return Core.Math=_M;
  };
  //export--------------------------------------------------------------------
  let CZLab=global.CZLab;
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    CZLab=module.exports.CZLab;
  }

  if(!CZLab)
    throw "Fatal: CZLab not loaded";

  if(!CZLab.AfxCore) CZLab.AfxCore={};
  Math(CZLab.AfxCore);
  return CZLab;

})(this);



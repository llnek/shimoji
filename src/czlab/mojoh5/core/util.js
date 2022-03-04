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
// Copyright © 2013-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create the module.
   */
  function _module(Mojo){
    const {Stack,StdCompare:CMP}= gscope["io/czlab/mcfud/algo_basic"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const {is, ute:_}=Mojo;
    const int=Math.floor;

    /**
     * @module mojoh5/util
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // stably merge a[lo .. mid] with a[mid+1 ..hi] using aux[lo .. hi]
    // precondition: a[lo .. mid] and a[mid+1 .. hi] are sorted subarrays
    function _merge(a, aux, lo, mid, hi){
      for(let k = lo; k <= hi; ++k) _V.copy(aux[k], a[k]); // copy to aux[]
      // merge back to a[]
      let i = lo, j = mid+1;
      for(let k = lo; k <= hi; ++k){
        if(i > mid) _V.copy(a[k], aux[j++]);
        else if(j > hi) _V.copy(a[k], aux[i++]);
        else if(Point2D.compareTo(aux[j], aux[i])<0) _V.copy(a[k],aux[j++]);
        else _V.copy(a[k], aux[i++]);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @memberof module:mojoh5/util
     * @class
     */
    class Interval1D{
      constructor(min, max){
        _.assert(min<=max,"bad interval1D");
        if(_.feq0(min)) min = 0;
        if(_.feq0(max)) max = 0;
        this.min = min;
        this.max = max;
      }
      min(){ return this.min }
      max(){ return this.max }
      intersects(that){ return (this.max < that.min || that.max < this.min) ? false : true }
      contains(x){ return (this.min <= x) && (x <= this.max) }
      length(){ return this.max - this.min }
      // ascending order of min endpoint, breaking ties by max endpoint
      static MinEndpointComparator(a,b){
        if(a.min < b.min) return -1;
        if(a.min > b.min) return 1;
        if(a.max < b.max) return -1;
        if(a.max > b.max) return 1;
        return  0;
      }
      // ascending order of max endpoint, breaking ties by min endpoint
      static MaxEndpointComparator(a, b){
        if(a.max < b.max) return -1;
        if(a.max > b.max) return 1;
        if(a.min < b.min) return -1;
        if(a.min > b.min) return 1;
        return  0;
      }
      // ascending order of length
      static LengthComparator(a, b){
        let alen = a.length(),
            blen = b.length();
        return alen < blen ? -1 : ( alen > blen ? 1 : 0);
      }
      static test(){
        let ps = [new Interval1D(15.0, 33.0),
                  new Interval1D(45.0, 60.0),
                  new Interval1D(20.0, 70.0),
                  new Interval1D(46.0, 55.0)];
        console.log("Unsorted");
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
        console.log("Sort by min endpoint");
        ps.sort(Interval1D.MinEndpointComparator);
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
        console.log("Sort by max endpoint");
        ps.sort(Interval1D.MaxEndpointComparator);
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
        console.log("Sort by length");
        ps.sort(Interval1D.LengthComparator);
        ps.forEach(p=> console.log(`min=${p.min}, max=${p.max}`));
      }
    }
    //Interval1D.test();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**
     * @memberof module:mojoh5/util
     * @class
     */
    class Interval2D{
      constructor(x, y){
        this.x = x;
        this.y = y;
      }
      intersects(that){
        if(!this.x.intersects(that.x)) return false;
        if(!this.y.intersects(that.y)) return false;
        return true;
      }
      contains(p){
        return x.contains(p[0])  && y.contains(p[1]);
      }
      area(){
        return x.length() * y.length();
      }
      static test(){
      }
    }

    /**
     * @memberof module:mojoh5/util
     * @class
     */
    class Point2D{
      /** Returns the angle of this point in polar coordinates.
       * @return the angle (in radians) of this point in polar coordiantes (between –&pi; and &pi;)
       */
      static theta(p){
        return Math.atan2(p[1], p[0]);
      }
      /**Returns the angle between this point and that point.
       * @return the angle in radians (between –&pi; and &pi;) between this point and that point (0 if equal)
       */
      static angleTo(a,b){
        return Math.atan2(b[1] - a[1], b[0] - a[0]);
      }
      /**Returns true if a-> b-> c is a counterclockwise turn.
       * @param a first point
       * @param b second point
       * @param c third point
       * @return {number} -1, 0, 1  if a-> b-> c is a { clockwise, collinear; counterclocwise } turn.
       */
      static ccw(a, b, c){
        let area2 = (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
        if(area2 < 0) return -1;
        if(area2 > 0) return 1;
        return  0;
      }
      /**Returns twice the signed area of the triangle a-b-c.
       * @param a first point
       * @param b second point
       * @param c third point
       * @return twice the signed area of the triangle a-b-c
       */
      static area2(a, b, c){
        return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]);
      }
      /**Returns the Euclidean distance between this point and that point.
       * @param that the other point
       * @return the Euclidean distance between this point and that point
       */
      static distanceTo(a,b){
        let dx= a[0] - b[0],
            dy= a[1] - b[1];
        return Math.sqrt(dx*dx + dy*dy);
      }
      /**Returns the square of the Euclidean distance between this point and that point.
       * @param that the other point
       * @return the square of the Euclidean distance between this point and that point
       */
      static distanceSquaredTo(a,b){
        let dx= a[0] - b[0],
            dy= a[1] - b[1];
        return dx*dx + dy*dy;
      }
      /**Compares two points by y-coordinate, breaking ties by x-coordinate.
       * Formally, the invoking point (x0, y0) is less than the argument point (x1, y1)
       * if and only if either {@code y0 < y1} or if {@code y0 == y1} and {@code x0 < x1}.
       *
       * @param  that the other point
       * @return the value {@code 0} if this string is equal to the argument
       *         string (precisely when {@code equals()} returns {@code true});
       *         a negative integer if this point is less than the argument
       *         point; and a positive integer if this point is greater than the
       *         argument point
       */
      static compareTo(a,b){
        if(a[1] < b[1]) return -1;
        if(a[1] > b[1]) return 1;
        if(a[0] < b[0]) return -1;
        if(a[0] > b[0]) return 1;
        return 0;
      }
      // compare points according to their x-coordinate
      static XOrderComparator(p, q){
        return p[0] < q[0] ? -1 : (p[0] > q[0] ? 1:0)
      }
      // compare points according to their y-coordinate
      static YOrderComparator(p, q){
        return p[1] < q[1] ? -1 : (p[1] > q[1] ? 1 : 0)
      }
      // compare points according to their polar radius
      static ROrderComparator(p, q){
        let delta = (p[0]*p[0] + p[1]*p[1]) - (q[0]*q[0] + q[1]*q[1]);
        return delta < 0 ? -1 : (delta > 0 ? 1: 0)
      }
      // compare other points relative to atan2 angle (bewteen -pi/2 and pi/2) they make with this Point
      static Atan2OrderComparator(q1, q2){
        let angle1 = Point2D.angleTo(q1);
        let angle2 = Point2D.angleTo(q2);
        return angle1 < angle2 ? -1 : (angle1 > angle2 ? 1 : 0)
      }
      // compare other points relative to polar angle (between 0 and 2pi) they make with this Point
      static PolarOrderComparator(q){
        return (q1,q2)=>{
          let dx1 = q1[0] - q[0];
          let dy1 = q1[1] - q[1];
          let dx2 = q2[0] - q[0];
          let dy2 = q2[1] - q[1];
          if(dy1 >= 0 && dy2 < 0) return -1;    // q1 above; q2 below
          if(dy2 >= 0 && dy1 < 0) return 1;    // q1 below; q2 above
          if(_.feq0(dy1) && _.feq0(dy2)){ // 3-collinear and horizontal
            if(dx1 >= 0 && dx2 < 0) return -1;
            if(dx2 >= 0 && dx1 < 0) return 1;
            return  0;
          }
          return - Point2D.ccw(q, q1, q2);     // both above or below
          // Note: ccw() recomputes dx1, dy1, dx2, and dy2
        };
      }
      // compare points according to their distance to this point
      static DistanceToOrderComparator(p, q){
        let dist1 = Point2D.distanceSquaredTo(p);
        let dist2 = Point2D.distanceSquaredTo(q);
        return dist1 < dist2 ? -1 : (dist1 > dist2 ? 1 : 0)
      }
      static equals(a,b){
        if(b === a) return true;
        if(!b) return false;
        return a[0]== b[0] && a[1] == b[1];
      }
      static farthestPair(points){
        let best1=[0,0], best2=[0,0], bestDistance=0,bestDistSQ= -Infinity;
        let m,H = Point2D.calcConvexHull(points);
        // single point
        if(H===false ||
           points.length <= 1) return false;
        // number of points on the hull
        m = H.length;
        // the hull, in counterclockwise order hull[1] to hull[m]
        H.unshift(null);
        // points are collinear
        if(m == 2){
          best1 = H[1];
          best2 = H[2];
          bestDistance= Point2D.distanceTo(best1,best2);
        }else{
          // k = farthest vertex from edge from hull[1] to hull[m]
          let j,k = 2;
          while(Point2D.area2(H[m], H[1], H[k+1]) > Point2D.area2(H[m], H[1], H[k])){ ++k }
          j = k;
          for(let d2,i = 1; i <= k && j <= m; ++i){
            if(Point2D.distanceSquaredTo(H[i],H[j]) > bestDistSQ){
              bestDistSQ= Point2D.distanceSquaredTo(H[i],H[j]);
              _V.copy(best1,H[i]);
              _V.copy(best2,H[j]);
            }
            while((j < m) &&
                  Point2D.area2(H[i], H[i+1], H[j+1]) > Point2D.area2(H[i], H[i+1], H[j])){
              ++j;
              //console.log(`${H[i]} and ${H[j]} are antipodal`);
              d2 = Point2D.distanceSquaredTo(H[i], H[j]);
              if(d2 > bestDistSQ){
                bestDistSQ= Point2D.distanceSquaredTo(H[i], H[j]);
                _V.copy(best1, H[i]);
                _V.copy(best2, H[j]);
              }
            }
          }
        }
        return {best1,best2,bestDistance: Math.sqrt(bestDistSQ)};
      }
      static closestPair(points){
        // sort by x-coordinate (breaking ties by y-coordinate via stability)
        let best1=[0,0],best2=[0,0],bestDistance=Infinity;
        let pointsByX = points.slice();
        const n=points.length;
        pointsByX.sort(Point2D.YOrderComparator);
        pointsByX.sort(Point2D.XOrderComparator);
        // check for coincident points
        for(let i = 0; i < n-1; ++i){
          if(Point2D.equals(pointsByX[i],pointsByX[i+1])){
            _V.copy(best1, pointsByX[i]);
            _V.copy(best2, pointsByX[i+1]);
            return{ bestDistance:0, best1, best2 }
          }
        }
        // sort by y-coordinate (but not yet sorted)
        let pointsByY = pointsByX.slice();
        let aux = _.fill(n,()=> [0,0]);
        // find closest pair of points in pointsByX[lo..hi]
        // precondition:  pointsByX[lo..hi] and pointsByY[lo..hi] are the same sequence of points
        // precondition:  pointsByX[lo..hi] sorted by x-coordinate
        // postcondition: pointsByY[lo..hi] sorted by y-coordinate
        function _closest(pointsByX, pointsByY, aux, lo, hi){
          if(hi <= lo) return Infinity;
          let mid = lo + _M.ndiv(hi - lo, 2);
          let median = pointsByX[mid];
          // compute closest pair with both endpoints in left subarray or both in right subarray
          let delta1 = _closest(pointsByX, pointsByY, aux, lo, mid);
          let delta2 = _closest(pointsByX, pointsByY, aux, mid+1, hi);
          let delta = Math.min(delta1, delta2);
          // merge back so that pointsByY[lo..hi] are sorted by y-coordinate
          _merge(pointsByY, aux, lo, mid, hi);
          // aux[0..m-1] = sequence of points closer than delta, sorted by y-coordinate
          let m = 0;
          for(let i = lo; i <= hi; ++i)
            if(Math.abs(pointsByY[i][0] - median[0]) < delta) _V.copy(aux[m++],pointsByY[i]);
          // compare each point to its neighbors with y-coordinate closer than delta
          for(let i = 0; i < m; ++i){
            // a geometric packing argument shows that this loop iterates at most 7 times
            for(let d,j = i+1; (j < m) && (aux[j][1] - aux[i][1] < delta); ++j){
              d= Point2D.distanceTo(aux[i],aux[j]);
              if(d< delta){
                delta = d;
                if(d< bestDistance){
                  bestDistance = delta;
                  _V.copy(best1, aux[i]);
                  _V.copy(best2, aux[j]);
                  //console.log(`better distance = ${delta} from ${best1} to ${best2}`);
                }
              }
            }
          }
          return delta;
        }
        _closest(pointsByX, pointsByY, aux, 0, n-1);
        return {bestDistance,best1,best2};
      }
      /**Computes the convex hull of the specified array of points.
       *  The {@code GrahamScan} data type provides methods for computing the
       *  convex hull of a set of <em>n</em> points in the plane.
       *  <p>
       *  The implementation uses the Graham-Scan convex hull algorithm.
       *  It runs in O(<em>n</em> log <em>n</em>) time in the worst case
       *  and uses O(<em>n</em>) extra memory.
       * @param  points the array of points
       */
      static calcConvexHull(points){
        _.assert(points && points.length>0, "invalid points");
        let a0, n=points.length, a= _.deepCopyArray(points);
        let hull=new Stack();
        // preprocess so that a[0] has lowest y-coordinate; break ties by x-coordinate
        // a[0] is an extreme point of the convex hull
        // (alternatively, could do easily in linear time)
        a.sort(Point2D.compareTo);
        a0=a[0];
        // sort by polar angle with respect to base point a[0],
        // breaking ties by distance to a[0]
        //Arrays.sort(a, 1, n, Point2D.polarOrder(a[0]));
        a.shift();//pop head off
        a.sort(Point2D.PolarOrderComparator(a0));
        //put head back
        a.unshift(a0);

        // a[0] is first extreme point
        hull.push(a[0]);
        // find index k1 of first point not equal to a[0]
        let k1;
        for(k1 = 1; k1 < n; ++k1)
          if(!Point2D.equals(a[0],a[k1])) break;
        if(k1 == n) return false; // all points equal
        // find index k2 of first point not collinear with a[0] and a[k1]
        let k2;
        for(k2 = k1+1; k2 < n; ++k2)
          if(Point2D.ccw(a[0], a[k1], a[k2]) != 0) break;
        // a[k2-1] is second extreme point
        hull.push(a[k2-1]);
        // Graham scan; note that a[n-1] is extreme point different from a[0]
        for(let top,i = k2; i < n; ++i){
          top = hull.pop();
          while(Point2D.ccw(hull.peek(), top, a[i]) <= 0){
            top = hull.pop();
          }
          hull.push(top);
          hull.push(a[i]);
        }
        //Returns the extreme points on the convex hull in counterclockwise order.
        let H = new Stack();
        for(let p,it= hull.iterator();it.hasNext();) H.push(it.next());
        //check if convex
        n = H.size();
        points = [];
        for(let p,it= H.iterator();it.hasNext();){
          points.push(_V.clone(it.next()));
        }
        if(n > 2){
          for(let i = 0; i < n; ++i){
            if(Point2D.ccw(points[i], points[(i+1) % n], points[(i+2) % n]) <= 0)
            return false;
          }
        }
        return points;
      }
      static test_convexHull(){
        let D=`9230 13137 4096 24064 8192 26112 22016  9344 4440  8028 6505 31422 28462 32343 17152 19200 9561 11599
               4096 20992 21538  2430 21903 23677 17152 16128 7168 25088 10162 18638 822 32301 16128 12032 18989  3797
               8192 28160 16128 20224 14080 20224 26112  7296 20367 20436 7486   422 17835  2689 22016  3200 22016  5248
               24650 16886 15104 20224 25866  4204 13056 15104 13662 10301 17152 20224 15104 12032 6144 20992 26112  3200
               6144 29184 13056 12032 8128 20992 5076 19172 17152 17152 823 15895 25216  3200 6071 29161 5120 20992
               10324 22176 29900  9390 27424  7945 4096 23040 12831 27971 29860 12437 28668  2061 1429 12561 29413   596
               17152 18176 8192 27136 5120 29184 22016 11392 1444 10362 32011  3140 15731 32661 26112  4224 13120 20224
               30950  2616 4096 22016 4096 25088 24064  3200 26112  5248 4862 30650 5570  8885 21784 18853 23164 32371
               4160 29184 13056 13056 8192 29184 23040  7296 5120 25088 22016  7296 7168 29184 25216  7296 23040  3200
               4718  4451 14080 16128 7168 20992 19546 17728 13056 16128 17947 17017 26112  6272 20658  1204 23553 13965
               13056 14080 14080 12032 24064  7296 21377 26361 17088
               12032 16128 16128 30875 28560 2542 26201 8192 25088 11444 16973`.split(/\s+/).map(n=>{return +n});
        let p=[];
        for(let i=0;i<D.length;i+=2){
          p.push([D[i],D[i+1]])
        }
        p=[[5,15], [5,-20], [-60,10], [70,-10], [-60,-10], [70,10]];
        //p=[[5,1], [5,-2], [-60,10], [70,-10], [-60,-10], [70,10]];//concave
        let hull=Point2D.calcConvexHull(p);
        if(hull===false || hull.length!=p.length){
          console.log("not convex!");
        }else{
          hull.forEach(v=>{ console.log(`${v[0]}, ${v[1]}`) });
        }
      }
      static test_closestPair(){
        let D=`954 11163 1125 11331 1296 11499 1467 11667 1657 11796 1847 11925 2037 12054 2238 12207 2439 12360
               2640 12513 2878 12523 3116 12533 3354 12543 3518 12493 3682 12443 3846 12393
               8463 7794 8022 7527 7581 7260 7140 6993 6731 6624 6322 6255 5913 5886
               5521 5494 5129 5102 4737 4710 4599 5158`.split(/\s+/).map(n=>{return +n});
        let ps=[];
        for(let i=0;i<D.length;i+=2){
          ps.push([D[i],D[i+1]]);
        }
        let {bestDistance,best1, best2}= Point2D.closestPair(ps)
        console.log(`bestDist=${bestDistance}, p1=${best1}, p2=${best2}`);
      }
      static test_farthestPair(){
        let D=`9230 13137 4096 24064 8192 26112 22016  9344 4440  8028 6505 31422 28462 32343 17152 19200 9561 11599 4096 20992 21538  2430
               21903 23677 17152 16128 7168 25088 10162 18638 822 32301 16128 12032 18989  3797 8192 28160 16128 20224 14080 20224 26112  7296
               20367 20436 7486   422 17835  2689 22016  3200 22016  5248 24650 16886 15104 20224 25866  4204 13056 15104 13662 10301 17152 20224
               15104 12032 6144 20992 26112  3200 6144 29184 13056 12032 8128 20992 5076 19172 17152 17152 823 15895 25216  3200 6071 29161
               5120 20992 10324 22176 29900  9390 27424  7945 4096 23040 12831 27971 29860 12437 28668  2061 1429 12561 29413   596 17152 18176
               8192 27136 5120 29184 22016 11392 1444 10362 32011  3140 15731 32661 26112  4224 13120 20224 30950  2616 4096 22016
               4096 25088 24064  3200 26112  5248 4862 30650 5570  8885 21784 18853 23164 32371 4160 29184 13056 13056 8192 29184 23040  7296
               5120 25088 22016  7296 7168 29184 25216  7296 23040  3200 4718  4451 14080 16128 7168 20992 19546 17728 13056 16128 17947 17017
               26112  6272 20658  1204 23553 13965 13056 14080 14080 12032 24064  7296 21377 26361 17088 12032 16128 16128
               30875 28560 2542 26201 8192 25088 11444 16973`.split(/\s+/).map(n=>{return +n});
        let ps=[];
        for(let i=0;i<D.length;i+=2){
          ps.push([D[i],D[i+1]]);
        }
        let {bestDistance,best1, best2}= Point2D.farthestPair(ps)
        console.log(`bestDist=${bestDistance}, p1=${best1}, p2=${best2}`);
      }
    }

    const _$={
      Point2D, Interval1D, Interval2D
    };

    return (Mojo["util"]= _$);
  }

  //export--------------------------------------------------------------------
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/util"]=(M)=>{
      return M["util"] ? M["util"] : _module(M) } }

})(this);



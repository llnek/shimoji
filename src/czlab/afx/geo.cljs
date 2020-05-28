;; Licensed under the Apache License, Version 2.0 (the "License");
;; you may not use this file except in compliance with the License.
;; You may obtain a copy of the License at
;;
;;     http://www.apache.org/licenses/LICENSE-2.0
;;
;; Unless required by applicable law or agreed to in writing, software
;; distributed under the License is distributed on an "AS IS" BASIS,
;; WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
;; See the License for the specific language governing permissions and
;; limitations under the License.
;;
;; Copyright © 2013-2020, Kenneth Leung. All rights reserved.

(ns czlab.shimoji.afx.geo

  (:require [czlab.shimoji.afx.math :as m :refer [V2]]
            [czlab.shimoji.afx.core :as c :refer [_1 _2 n#]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:dynamic *coordinate-system* :right-handed)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(def ^:dynamic *cocos2dx* false)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defrecord Rect [x y width height])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defrecord Area [width height])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn area
  [width height]
  (new Area width height))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect

  "Create a rect object."

  ([x y width height]
   (new Rect x y width height))

  ([origin area]
   (new Rect (_1 origin) (_2 origin) (:width area) (:height area))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- poly-area

  "Calculate the area of this polygon."
  [{:keys [vertices] :as P}]

  (loop [i 0
         area 0
         SZ (n# vertices)]
    (if (>= i SZ)
      (/ (c/abs* area) 2)
      (let [i2 (m/wrap?? i SZ)
            [xi yi] (nth vertices i)
            [xn yn] (nth vertices i2)]
        (recur (+ 1 i)
               (+ area (- (* xi yn) (* xn yi))) SZ)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn calc-poly-center

  "Find the center point of this polygon."
  [{:keys [vertices] :as P}]

  (loop [A (* 6 (poly-area P))
         i 0
         cx 0 cy 0
         SZ (n# vertices)]
    (if (>= i SZ)
      (V2 (/ cx A) (/ cy A))
      (let [i2 (m/wrap?? i SZ)
            [xi yi] (nth vertices i)
            [xn yn] (nth vertices i2)]
        (recur A
               (+ 1 i)
               (+ cx (* (+ xi xn) (- (* xi yn) (* xn yi))))
               (+ cy (* (+ yi yn) (- (* xi yn) (* xn yi)))) SZ)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defrecord Polygon [vertices])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defrecord Line [v1 v2])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defrecord Circle [radius])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn polygon
  [vertices]
  (assoc (new Polygon vertices) :type :polygon))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn circle
  [radius]
  (assoc (new Circle radius) :type :circle))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn shift-vertices

  "Shift a set of points."
  [vs delta]

  (mapv #(m/vec-add % delta) vs))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rot-vertices

  "Rotate a set of points."
  [vs pivot angle]

  (let [angle' (if *cocos2dx*
                 (- angle) angle)]
    (mapv #(m/vec-rot % angle' pivot) vs)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn calc-rect-vertices

  "Find the vertices of a rectangle."

  ([center area]
   (calc-rect-vertices (_1 center)
                       (_2 center)
                       (:width area) (:height area)))
  ([x y width height]
   (let [[hw hh] (c/mapfv / 2 width height)]
     [(V2 (+ x hw) (- y hh))
      (V2 (+ x hw) (+ y hh))
      (V2 (- x hw) (+ y hh))
      (V2 (- x hw) (- y hh))])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rectangle

  ([area]
   (rectangle (:width area) (:height area)))

  ([width height]
   (-> (calc-rect-vertices 0 0 width height)
       (polygon)
       (assoc :type :rectangle
              :width width :height height))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn line
  [ptA ptB]
  (new Line ptA ptB))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-equals-rect?

  [{x1 :x y1 :y w1 :width t1 :height :as R1}
   {x2 :x y2 :y w2 :width t2 :height :as R2}]

  (and (== x1 x2) (== y1 y2) (== w1 w2) (== t1 t2)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-contains-rect?

  [{x1 :x y1 :y w1 :width t1 :height :as R}
   {x2 :x y2 :y w2 :width t2 :height :as r}]

  (not (or (>= x1 x2)
           (>= y1 y2)
           (<= (+ x1 w1) (+ x2 w2))
           (<= (+ y1 t1) (+ y2 t2)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-get-maxX
  [{:keys [x width]}]
  (+ x width))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-get-midX

  "Mid rect on the x-axis."
  [{:keys [x width]}]

  (+ x (* .5 width)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-get-minX
  [r]
  (:x r))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-get-maxY

  [{:keys [y height]}]
  (+ y height))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-get-midY

  "Mid point of rect on the y-axis."
  [{:keys [y height]}]

  (+ y (* .5 height)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-get-minY
  [r]
  (:y r))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn contains-pt?

  "If point lies inside rect."
  [rect [px py :as P]]

  (and (>= px (rect-get-minX rect))
       (<= px (rect-get-maxX rect))
       (>= py (rect-get-minY rect))
       (<= py (rect-get-maxY rect))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-intersects-rect?

  [{x1 :x y1 :y w1 :width t1 :height :as R1}
   {x2 :x y2 :y w2 :width t2 :height :as R2}]

  (not (or (< (+ x1 w1) x2)
           (< (+ x2 w2) x1)
           (< (+ y1 t1) y2)
           (< (+ y2 t2) y1))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-unions-rect

  "Find the union of two rects."
  [{x1 :x y1 :y w1 :width t1 :height :as R1}
   {x2 :x y2 :y w2 :width t2 :height :as R2}]

  (let [x (min x1 x2)
        y (min y1 y2)]
    (rect x y
          (- (max (+ x1 w1) (+ x2 w2)) x)
          (- (max (+ y1 t1) (+ y2 t2)) y))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect-intersects-rect

  [{x1 :x y1 :y w1 :width t1 :height :as rect1}
   {x2 :x y2 :y w2 :width t2 :height :as rect2}]

  (let [x (max x1 x2)
        y (max y1 y2)]
    (rect x y
          (- (min (rect-get-maxX rect1) (rect-get-maxX rect2)) x)
          (- (min (rect-get-maxY rect1) (rect-get-maxY rect2)) y))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn out-of-bound?

  "outside of B?"
  [r B]

  (not (rect-contains-rect? B r)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn rect?
  [obj]
  (instance? Rect obj))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF


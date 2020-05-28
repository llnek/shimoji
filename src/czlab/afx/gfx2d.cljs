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

(ns czlab.shimoji.afx.gfx2d

  (:require [czlab.shimoji.afx.math :as m :refer [TWO-PI V2]]
            [czlab.shimoji.afx.core
             :as c :refer [if-func let->nil do->nil atom? cc+ _1 _2 n# num??]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- canvas-batch!

  "Apply a sequence of operations to the html5 canvas,
  with each op being [method arg1 arg2 ...]"
  [ctx & callArgs]

  (doseq [a callArgs
          :let [[m & args] a]] (c/apply-js! ctx m args)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;graphics
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defrecord TextStyle
  [font fill align base])

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn text-style

  "Html5 Text Style object."
  [font fill align base]

  ;"14px 'Arial'" "#dddddd" "left" "top"
  (new TextStyle font fill align base))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn draw-shape

  "Draw the shape onto the html5 canvas."
  [s canvas & args]

  (if-func [f (:draw (cond (atom? s) @s
                           (map? s) s
                           :t (c/raise! "Bad shape.")))]
    (apply f s canvas args)
    (c/raise! "Missing shape::draw function")) nil)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn cfg-style!

  "Apply styles to the canvas."
  [canvas styleObj]

  (let->nil
    [{:keys [line stroke]} styleObj
     {:keys [cap width]} line
     {:keys [style]} stroke]
    (when line
      (if cap (c/set-js! canvas "lineCap" cap))
      (if width (c/set-js! canvas "lineWidth" width)))
    (when stroke
      (if style (c/set-js! canvas "strokeStyle" style)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn draw-poly*

  "Draw and connect this set of points onto the canvas."
  [vertices canvas]
  {:pre [(sequential? vertices)]}

  (do->nil
    (c/call-js! canvas "beginPath")
    (loop [i 0
           SZ (n# vertices)]
      (when (< i SZ)
        (let [i2 (m/wrap?? i SZ)
              [x1 y1] (nth vertices i)
              [x2 y2] (nth vertices i2)]
          (c/jsto canvas
                  ["moveTo" x1 y1]
                  ["lineTo" x2 y2])
          (recur (+ 1 i) SZ))))
    (c/call-js! canvas "stroke")))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn draw-poly
  [p canvas]
  (draw-poly* (:vertices p) canvas))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn draw-circle*

  "Draw a circle onto the canvas.  If a starting point
  is provided, draw a line to the center."

  ([center radius angle canvas]
   (draw-circle* center radius angle canvas false))

  ([center radius angle canvas startPt?]
   (let->nil
     [[cx cy] center
      angle' (num?? angle 0)]
     (c/jsto canvas
             ["beginPath"]
             ["arc" cx cy radius 0 TWO-PI true])
     (when startPt?
       (let [[x y] (-> (V2 (+ cx radius) cy)
                       (m/vec-rot angle' center))]
         (c/jsto canvas
                 ["moveTo" cx cy]
                 ["lineTo" x y])))
     (c/jsto canvas
             ["closePath"] ["stroke"]))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn draw-circle

  ([C canvas center]
   (draw-circle C canvas center 0))

  ([C canvas center angle]
   (draw-circle C canvas center angle false))

  ([C canvas center angle startPt?]
   (let [{:keys [radius]} C]
     (draw-circle* center radius angle canvas startPt?))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn draw-rect

  "not used."

  ([R canvas pos]
   (draw-rect R canvas pos 0))

  ([R canvas pos angle]
   (let->nil
     [{:keys [width height]} R
      [hw hh] (c/mapfv / 2 width height)
      [cx cy] pos
      left (- cx hw)
      top (- cy hh)]
    (c/jsto canvas
            ["save"]
            ["translate" left top]
            ["rotate" (num?? angle 0)]
            ["strokeRect" 0 0 width height] ["restore"]))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn draw-line

  [line canvas]

  (let->nil
    [{:keys [v1 v2]} line
     [ax ay] v1
     [ex ey] v2]
    (c/jsto canvas
            ["beginPath"]
            ["moveTo" ax ay] ["lineTo" ex ey] ["stroke"])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF


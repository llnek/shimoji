;; Copyright © 2013-2020, Kenneth Leung. All rights reserved.
;; The use and distribution terms for this software are covered by the
;; Eclipse Public License 1.0 (http://opensource.org/licenses/eclipse-1.0.php)
;; which can be found in the file epl-v10.html at the root of this distribution.
;; By using this software in any fashion, you are agreeing to be bound by
;; the terms of this license.
;; You must not remove this notice, or any other, from this software.

(ns czlab.shimoji.webgl

  ""

  (:require [clojure.string :as cs]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn gl-init

  [cid]

  (let [c (some-> (js/document.getElementById cid)
                  (.getContext "webgl"))]
    (if (nil? c)
        (js/document.write "<br><b>WebGL is not supported!</b>")
        (do
          (.clearColor  c 0.9 0.9 0.9 1.0)
          ;;1. initialize the buffer with the vertex positions for the unit square
          (init-square-buffer)
          ;;2. now load and compile the vertex and fragment shaders
          (init-simple-shader "VertexShader" "FragmentShader")))
    c))



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn gl-clear

  [ctx]

  ;clear to the color previously set
  (.clear ctx (.-COLOR_BUFFER_BIT ctx)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn gl-draw

  []

  (let [x (gl-init "GLCanvas")]
    (gl-clear x)))



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF


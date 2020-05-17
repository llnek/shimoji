(require '[cljs.build.api :as b])

(b/watch "src"
  {:main 'shimoji.core
   :output-to "out/shimoji.js"
   :output-dir "out"})

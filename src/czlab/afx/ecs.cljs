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

(ns czlab.shimoji.afx.ecs

  (:require [czlab.shimoji.afx.core
             :as c :refer [do-with do-with-atom
                           nloop n# _1 _2 fn_1 in? =? cc+ cc+1 raise! num??]]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn new-jspool

  "New js-object pool.  Each object has a property
  that points back to the parent - pool object.
  The caller needs to provide 2 functions -
  1. constructor - how to create new objects
  2. rinse - upon reclaiming the object, need to clean up object.
  Each object is injected with a back-ptr back to the pool."

  ([ctor rinse]
   (new-jspool ctor rinse 10))

  ([ctor rinse batch]
   {:pre [(fn? ctor)(fn? rinse)]}
   (c/assoc!! (atom {:batch (num?? batch 10)
                     :ctor ctor :rinse rinse
                     :size 0 :next 0 :slots #js[]})
              :grow
              #(let [{:keys [next size
                             ctor batch slots]} (deref %)
                     z' (if (< next size)
                          size
                          (do-with [z (+ size batch)]
                            (nloop batch
                                   (.push slots
                                          (c/set-js! (ctor) "____pool" %)))))]
                 [(aget slots next) (+ 1 next) z']))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn pool-count
  [pool]
  (:next @pool))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn pool-size
  [pool]
  (:size @pool))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn pool-take!

  "Take a object from the pool.  If there is no free object,
  the pool will grow in size."
  [pool]

  (do-with-atom [out (atom nil)]
    (swap! pool
           #(let [{:keys [grow]} %
                  [obj n' z'] (grow pool)]
              ;take a free obj, set it's slot,
              ;up the pool's free ptr
              (c/set-js! obj "____slot" (- n' 1))
              (reset! out obj)
              (assoc % :next n' :size z')))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn pool-drop!

  "Put object back into the pool."
  [pool obj]

  (do-with [pool]
    (when (and obj
               (=? (c/get-js obj "____pool") pool))
      ;jiggle the free slot to reuse the one just dropped
      (swap! pool
             (fn [{:keys [rinse next slots] :as root}]
               (let [n' (- next 1)
                     tail (c/get-js slots n')
                     epos' (c/get-js obj "____slot")
                     slot' (c/get-js tail "____slot")]
                 ;set free ptr to dropped,
                 ;move the tail to old slot
                 (if (fn? rinse) (rinse obj))
                 (aset slots n' obj)
                 (aset slots epos' tail)
                 ;swap the 2 slots
                 (c/set-js! tail "____slot" epos')
                 (c/set-js! obj "____slot" slot')
                 (assoc root :next n')))))))

  ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  (defn new-entity-store

    "Create a new entity-component store. Entities are
    just labels, not objects, such as strings or numbers.
    In this case, we use a sequence number.
    Components are just simple js data objects, no methods.
    Each component is registered by an id and a function
    returning that data object, such as
    :person-name (fn [] #js {:name \"\" :lastname \"\"}).
    Instances of each component-type are stored in its
    own object-pool.
    Optionally, a rinse function is provided to clean up
    the object for reuse.
    A registry is used to keep track of all component
    types - :registry {:c1 c1ctor :c2 c2ctor ...}
    A tree is used to store all component instances -
    :data {:c1 {1 i1 2 i2 ...} :c4 {5 i1 9 i2} ...}.
    Templates can be added to predefine an entity such
    as :t1 {:components [:c4 :c8 :c9]}
    :t3 {:components [:c6 :c2]}.
    For runtime, systems can be added to manipulate
    entities and components."
    []

    (atom {;list of entities
           :entities #{}
           ;component templates
           :templates {}
           ;component types
           :registry {}
           ;component instances
           :data {}
           ;run time systems
           :systems []
           ;entity identity
           :entity-uid 1}))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- gen-uid

  "Next entity id."
  [ecs]

  (do-with-atom [out (atom 0)]
    (swap! ecs
           (fn [{uid :entity-uid :as root}]
             (reset! out uid)
             (assoc root :entity-uid (+ 1 uid))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- retused

  "Put object(s) back into the store."
  [obj]

  (cond (or (list? obj)
            (vector? obj))
        (doseq [c obj] (retused c))
        (map? obj)
        (retused (vals obj))
        (object? obj)
        (when-some [p (c/get-js obj "____pool")] (pool-drop! p obj) nil)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- rement

  "Remove entity and all its components."
  [data entities ent]

  (loop [data' data
         [cid & cs] (keys data')]
    (if (nil? cid)
      [data' (disj entities ent)]
      (let [d (get data' cid)]
        (recur (if-some [e (get d ent)]
                 (do (retused e)
                     (update-in data' [cid] dissoc ent)) data') cs)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn remove-entity!

  "Remove an entity, or entities."
  [ecs entity & more]

  (do-with [ecs]
    (let [{:keys [data entities]} @ecs]
      (loop [data' data
             ents entities
             [e & es] (cc+1 entity more)]
          (if (nil? e)
            (swap! ecs assoc :data data' :entities ents)
            (let [[dt' es']
                  (rement data' ents e)] (recur dt' es' es)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn add-component!

  "Add a component definition, or definitions."
  [ecs id funcs & more]
  {:pre [(sequential? funcs)]}

  (do-with [ecs]
    (swap! ecs
           (fn [{:keys [registry data] :as root}]
             (->> (cc+ [id funcs] more)
                  (partition 2)
                  (map (fn [[k fs]]
                         (vector k
                                 (new-jspool (_1 fs)
                                             (or (_2 fs) identity)))))
                  (into {})
                  (merge registry)
                  (assoc root :registry))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn remove-component!

  "Remove a component, or components.  All existing instances are purged."
  [ecs cid & more]

  (do-with [ecs]
    (swap! ecs
           (fn [{:keys [data registry] :as root}]
             (let [cids (cc+1 cid more)]
               (doseq [c cids
                       :let [v (get data c)]
                       :when (some? v)] (retused v))
               (assoc root
                      :data (apply dissoc data cids)
                      :registry (apply dissoc registry cids)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn- add-to-entity

  "Add a component to an entity, or components."
  [root entity cids]

  (loop [[c & cs] cids
         data (:data root)
         rego (:registry root)]
    (if (nil? c)
      (assoc root :data data)
      (let [r (get rego c)]
        (assert (some? r)
                (str "Unknown component: " c))
        (recur cs
               (update-in data
                          [c]
                          assoc entity (pool-take! r)) rego)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn add->entity!

  "Add a component to an entity, or components."
  [ecs entity cid & more]

  (do-with [ecs]
    (swap! ecs add-to-entity entity (cc+1 cid more))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn new-entity!

  "Create a new entity with this component, or components."
  [ecs & cids]

  (do-with [entity (gen-uid ecs)]
    (swap! ecs
           (fn [root]
             (-> (update-in root
                            [:entities] conj entity)
                 (add-to-entity entity cids))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn remove->entity!

  "Remove component from entity, or components."
  [ecs entity cid & more]

  (do-with [ecs]
    (swap! ecs
           (fn [{:keys [data] :as root}]
             (loop [[c & cs] (cc+1 cid more) data' data]
               (if (nil? c)
                 (assoc root :data data')
                 (recur cs
                        (if-some [v (get (get data' c) entity)]
                          (do (retused v)
                              (update-in data'
                                         [c]
                                         dissoc entity)) data'))))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn get-entity-data

  "Get the component data."
  [ecs entity cid]

  (let [{:keys [data]} @ecs] (get (get data cid) entity)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn update-entity!

  "Apply function to the component data."
  [ecs entity cid func]
  {:pre [(fn? func)]}

  (when-some [c (get-entity-data ecs entity cid)] (func c) c))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn get-components-data

  "component data."
  [ecs cid]

  (let [{:keys [data]} @ecs]
    (if-some [c (get data cid)] (vals c) [])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn get-component-keys

  "component-ids."
  [ecs]

  (keys (:registry @ecs)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn find-component

  "Find component."
  [ecs cid]

  (get (:registry @ecs) cid))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn component-in-entity?

  "If entity has this component, or components."
  [ecs entity cid & more]

  (let [{:keys [data]} @ecs]
    (every? #(if-some
               [co (get data %)]
               (in? co entity)) (cc+1 cid more))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn find-entities

  "Find all entities with this component, or components."
  [ecs cid & more]

  (let [{:keys [data]} @ecs
        cids (cc+1 cid more)]
    ;make sure all components are registered
    (if (every? #(in? data %) cids)
      (let [ccs (sort (c/compare-asc* #(count %))
                      (mapv #(get data %) cids))
            c0 (_1 ccs)
            ccsz (n# ccs)]
        ;;find the smallest data tree via sort
        (loop [[eid & es] (keys c0)
               ret (c/tvec*)]
          (if (nil? eid)
            (c/ps! ret)
            ;; look for intersection
            (recur es
                   (loop [[c & cs] ccs
                          arr ret sum 0]
                     (if (nil? c)
                       ;; if found in all caches...
                       (if (= sum ccsz) (conj! arr eid) arr)
                       (recur cs
                              arr
                              (if (or (=? c c0)
                                      (in? c eid)) (+ 1 sum) sum)))))))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn add-template!

  "Add a entity template."
  [ecs id template & more]

  (do-with [ecs]
    (swap! ecs
           (fn [root]
             (update-in root
                        [:templates]
                        (fn [t]
                          (->> (cc+ [id template] more)
                               (partition 2)
                               (mapv #(vec %))
                               (into {})
                               (merge t))))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn get-template-keys

  "template-ids."
  [ecs]

  (keys (:templates @ecs)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn find-template
  [ecs tid]
  (get (:templates @ecs) tid))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn remove-template!
  [ecs tid & more]
  (do-with [ecs]
    (swap! ecs
           (fn [{:keys [templates] :as root}]
             (update-in root
                        [:templates]
                        #(apply dissoc % (cc+1 tid more)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn new-template-entity

  "Create entity from template."
  [ecs tid & [initor]]

  (if-some [t (get (:templates @ecs) tid)]
    (do-with
      [e (apply new-entity!
                (cc+1 ecs (:components t)))] (if (fn? initor) (initor e)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;EOF


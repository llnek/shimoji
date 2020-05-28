(function() {
  let optimizeCb = (func, ctx, argCount) => {
    if (ctx === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1:
        return (value) => {
          return func.call(ctx, value); };
      case 3:
        return (value, i, coll) => {
          return func.call(ctx, value, i, coll); };
      case 4:
        return (acc, value, i, coll) => {
          return func.call(ctx, acc, value, i, coll); };
    }
    return () => { return func.apply(ctx, arguments); };
  };

  let E = {};

  E._each = (obj, select, ctx) => {
    select = optimizeCb(select, ctx);
    if (isArray(obj)) {
      for (let i=0, z = obj.length; i< z; ++i)
      select(obj[i], i, obj);
    }
    else if (obj) {
      let ks = Object.keys(obj);
      for (let i=0, z = ks.length; i<z; ++i)
      select(obj[ks[i]], ks[i], obj);
    }
    return obj;
  };

  E._map = (obj, select, ctx) => {
    if (E._isArray(obj)) {
      return obj.map(select, ctx);
    } else if (obj) {
      let ks = Object.keys(obj);
      let z= ks.length;
      let res= Array(z);
      for (let i= 0; i<z; ++i) {
        let c= ks[i];
        res[i] = select.call(ctx, obj[c], c, obj);
      }
      return res;
    } else {
      return [];
    }
  };

  E._find = (obj, pred, ctx) => {
    let res = void 0;
    if (E._isArray(obj)) {
      res = obj.find(pred, ctx);
    } else if (obj) {
      let s = optimizeCb(pred,ctx);
      let ks= Object.keys(obj);
      for (let i=0, z=ks.length; i<z; ++i) {
        let v=obj[ks[i]];
        if (s(v, ks[i],obj)) {
          res=v;
          break;
        }
      }
    }
    return res;
  };

  return E;

})();

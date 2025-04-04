export class Recipe {
  static store = new Map();

  constructor(selectorOrStore, dataOrSetup, options = {}) {
    // Handle store setup
    if (selectorOrStore === "store") {
      this._isStore = true;
      this._storeName = options.name || "store";
      this._useLocalStorage = options.localStorage || false;

      this.store = this._initStore(dataOrSetup);

      // Optional API sugar for external watching

      this.watch = (key, fn) => {
        this._storeWatchers ??= {};
        this._storeWatchers[key] ??= [];
        this._storeWatchers[key].push(fn);
      };

      Recipe.store.set(this._storeName, this.store);
      Recipe._storeInstanceMap ??= new Map();
      Recipe._storeInstanceMap.set(this._storeName, this);
      return;
    }

    // Handle normal DOM component
    this.root = document.querySelector(selectorOrStore);
    this.queue = [];
    this.bindings = {};
    this.watchers = {};
    this._state = {};

    this.store = new Proxy(
      {},
      {
        set: (obj, prop, value) => {
          obj[prop] = value;

          if (!isNaN(prop) || prop === "length") {
            this._saveStore(obj);

            // Trigger loop reactivity
            subscribers.forEach((fn) => fn(obj));

            // 🔥 Trigger external watchers
            const instance = Recipe._storeInstanceMap?.get(this._storeName);
            const externalWatchers = instance?._storeWatchers?.[prop];
            if (externalWatchers) {
              externalWatchers.forEach((fn) => {
                fn(value, instance._getRuntime?.(document.body));
              });
            }
          }

          return true;
        },
        get: (obj, key) => obj[key],
      }
    );

    // Defer queue execution
    setTimeout(() => this._runQueue(), 0);
  }

  text(key, value) {
    const target =
      this.root.querySelector(`[r-text="${key}"]`) ||
      this.root.querySelector(`[data-r-text="${key}"]`);

    if (target) {
      target.textContent = value;
    }
  }

  loop() {
    const template = this.root.querySelector("[r-loop]");
    if (!template) return { effect: () => {}, bind: {} };

    const parent = template.parentElement;
    const templateHTML = template.cloneNode(true);

    const bindings = {
      click: [],
    };

    const loopApi = {
      effect: (store, keys = []) => {
        const render = (data) => {
          parent
            .querySelectorAll("[data-r-loop-item]")
            .forEach((el) => el.remove());

          data.forEach((item, index) => {
            const clone = templateHTML.cloneNode(true);
            clone.removeAttribute("r-loop");
            clone.setAttribute("data-r-loop-item", "");
            clone.setAttribute("data-r-item", JSON.stringify(item));

            keys.forEach((key) => {
              const target = clone.querySelector(`[r-text="${key}"]`);
              if (target) target.textContent = item[key];
            });

            // Apply click bindings
            bindings.click.forEach(({ selector, handler }) => {
              const targets = clone.querySelectorAll(selector);

              targets.forEach((target) => {
                target.addEventListener("click", () => {
                  const R = this._getRuntime(target);
                  handler(index, R);
                });
              });
            });

            parent.appendChild(clone);
          });
        };

        if (store?.__subscribe) store.__subscribe(render);
        render(store);
        template.remove();

        return loopApi;
      },

      bind: {
        click: (selector) => (handler) => {
          console.log("✅ registered bind.click for", selector);
          bindings.click.push({ selector, handler });
          return loopApi;
        },
      },
    };

    return loopApi;
  }

  _initStore(initialData) {
    let stored = null;

    if (this._useLocalStorage) {
      const raw = localStorage.getItem(this._storeName);
      if (raw) {
        try {
          stored = JSON.parse(raw);
        } catch (e) {
          console.warn(
            "📚 Recipe Failed to parse localStorage data for store:",
            this._storeName
          );
        }
      }
    }

    const base = stored || initialData;
    const subscribers = [];

    const proxy = new Proxy([...base], {
      set: (obj, prop, value) => {
        obj[prop] = value;

        if (!isNaN(prop) || prop === "length") {
          this._saveStore(obj);
          subscribers.forEach((fn) => fn(obj));

          //  Trigger external watchers
          const watchers = this._storeWatchers?.[prop];
          if (watchers) {
            watchers.forEach((fn) => {
              fn(value, this._getRuntime?.(document.body));
            });
          }
        }

        return true;
      },
      get: (obj, prop) => {
        if (prop === "__subscribe") {
          return (cb) => subscribers.push(cb);
        }
        return obj[prop];
      },
    });

    this._saveStore(proxy);
    return proxy;
  }

  _saveStore(data) {
    if (this._useLocalStorage) {
      localStorage.setItem(this._storeName, JSON.stringify(data));
    }
  }

  bindMouseEvent(selector) {
    const ctx = this;

    const wrapper = (handler) => {
      ctx.queue.push(() => {
        const elements = selector
          ? ctx.root.querySelectorAll(selector)
          : [ctx.root]; // ← default to root if no selector

        elements.forEach((el, index) => {
          if (!el) {
            console.warn(
              `📚 Recipe Element not found for selector: ${selector}`
            );
            return;
          }

          el.addEventListener("click", () => {
            const target = ctx._getRuntime(el);
            handler(target, index);
            if (wrapper._label) {
              ctx._dispatch(wrapper._label, target, index);
            }
          });
        });
      });

      return wrapper;
    };

    wrapper.label = function (labelName) {
      wrapper._label = labelName;
      return wrapper;
    };

    return wrapper;
  }

  click(selector) {
    return this.bindMouseEvent(selector);
  }

  mouseover(selector) {
    return this.bindMouseEvent(selector);
  }

  mouseout(selector) {
    return this.bindMouseEvent(selector);
  }

  bind(label, handler) {
    this.bindings[label] = (payload, R) => {
      handler(payload, R);
    };
  }

  watch(key, handler) {
    this.watchers[key] = (value, R) => {
      handler(value, R);
    };
  }

  _dispatch(label, target, payload) {
    if (this.bindings[label]) {
      this.bindings[label](target, payload);
    }
  }

  _runQueue() {
    this.queue.forEach((fn) => fn());
    this.queue = [];
  }

  _getRuntime(el) {
    const ctx = this;
    return {
      el,
      class: {
        add: (cls) => el.classList.add(cls),
        remove: (cls) => el.classList.remove(cls),
      },
      q(selector) {
        const base = ctx.root || document; // fallback!
        return wrap(base.querySelectorAll(selector));
      },

      parent: {
        data: {
          set: (key, value) => {
            ctx.store[key] = value;
            ctx.root.setAttribute(`data-${key}`, value); // ✨ update DOM attribute
          },
          get: (key) => ctx.store[key],
        },
      },
      getItem() {
        // get data-r-item attribute
        const item = el.getAttribute("data-r-item");
        if (!item) {
          // traverse up the DOM to find the closest parent with data-r-item
          const parent = el.closest("[data-r-item]");
          if (parent) {
            return JSON.parse(parent.getAttribute("data-r-item"));
          }
        }
        try {
          return JSON.parse(item);
        } catch (e) {
          console.warn(
            "📚 Recipe Failed to parse data-r-item attribute:",
            item
          );
          return null;
        }
      },
    };
  }
}

function wrap(elements) {
  return {
    class: {
      add(cls) {
        elements.forEach((el) => el.classList.add(cls));
        return this;
      },
      remove(cls) {
        elements.forEach((el) => el.classList.remove(cls));
        return this;
      },
      toggle(cls) {
        elements.forEach((el) => el.classList.toggle(cls));
        return this;
      },
    },
    click(handler) {
      elements.forEach((el) =>
        el.addEventListener("click", (e) => handler(e, el))
      );
      return this;
    },
    mouseover(handler) {
      elements.forEach((el) =>
        el.addEventListener("mouseover", (e) => handler(e, el))
      );
      return this;
    },
    mouseout(handler) {
      elements.forEach((el) =>
        el.addEventListener("mouseout", (e) => handler(e, el))
      );
      return this;
    },
    eq(i) {
      const el = elements[i];
      return {
        el,
        class: {
          add: (cls) => {
            el?.classList.add(cls);
            return this;
          },
          remove: (cls) => {
            el?.classList.remove(cls);
            return this;
          },
          toggle: (cls) => {
            el?.classList.toggle(cls);
            return this;
          },
        },
        text(key, value) {
          const target =
            el?.querySelector(`[r-text="${key}"]`) ||
            el?.querySelector(`[data-r-text="${key}"]`);
          if (target) target.textContent = value;
        },
      };
    },
    text(key, value) {
      elements.forEach((el) => {
        if (
          el.getAttribute("r-text") === key ||
          el.getAttribute("data-r-text") === key
        ) {
          el.textContent = value;
          return;
        }
        const target =
          el.querySelector(`[r-text="${key}"]`) ||
          el.querySelector(`[data-r-text="${key}"]`);
        if (target) target.textContent = value;
      });
    },
  };
}

// Global $r object
window.$r = {
  q(selector) {
    return wrap(document.querySelectorAll(selector));
  },
  getItem() {
    console.log("the document dont have data-r-item");
    return null; // not relevant globally but for consistency
  },
  parent: {
    data: {
      set: () => {},
      get: () => {},
    },
  },
};

Recipe.fromJSON = function (config) {
  config.recipes.forEach((item) => {
    if (item.type === "store") {
      new Recipe("store", item.data, {
        name: item.name,
        localStorage: item.localStorage || false,
      });
      return;
    }

    if (item.type === "component") {
      const R = new Recipe(item.target);

      (item.events || []).forEach((event) => {
        const handler = (el, index) => {
          event.actions?.forEach((action) => applyAction(el, action, index));
        };

        let ev = R[event.event](event.selector)(handler);
        if (event.label) ev.label(event.label);
      });

      Object.entries(item.bind || {}).forEach(([label, actions]) => {
        R.bind(label, (el, index) => {
          actions.forEach((action) => applyAction(el, action, index));
        });
      });

      Object.entries(item.watch || {}).forEach(([key, actions]) => {
        R.watch(key, (el, value) => {
          actions.forEach((action) => applyAction(el, action, value));
        });
      });

      if (item.loop) {
        const loop = R.loop();

        Object.entries(item.loop.bind || {}).forEach(([evt, handlers]) => {
          Object.entries(handlers).forEach(([selector, actions]) => {
            loop.bind[evt](selector)((el, index) => {
              actions.forEach((action) => applyAction(el, action, index));
            });
          });
        });

        if (item.loop.effect) {
          const { storeName, keys } = item.loop.effect;
          const store = Recipe.store.get(storeName);
          loop.effect(store, keys);
        }
      }
    }

    if (item.type === "global") {
      item.watch?.forEach((watchItem) => {
        const storeInstance = Recipe._storeInstanceMap.get(watchItem.store);
        if (!storeInstance)
          return console.warn("Missing store for", watchItem.store);

        storeInstance.watch(watchItem.key, (el, value) => {
          applyAction({ q: $r.q }, watchItem.action, value);
        });
      });
    }
  });
};

// Helper for executing JSON actions
function applyAction(R, action, ctxVar) {
  const [key, value] = Object.entries(action)[0];

  if (key.startsWith("q")) {
    const query = R.q(value);
    return;
  }

  if (key === "q") {
    const q = R.q(value);
    return q;
  }

  if (key.startsWith("class.")) {
    const method = key.split(".")[1];
    R.class[method](value);
    return;
  }

  if (key.startsWith("parent.data.set")) {
    const [k, v] = value;
    R.parent.data.set(k, v === "index" || v === "value" ? ctxVar : v);
    return;
  }

  if (key === "text") {
    R.q(value.selector).text(value.key, ctxVar);
    return;
  }
}

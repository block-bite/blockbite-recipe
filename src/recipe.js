// REFACTORED Recipe.js — bind, label, and loop.bind removed

export class Recipe {
  static store = new Map();

  constructor(selectorOrStore, dataOrSetup, options = {}) {
    if (selectorOrStore === "store") {
      this._isStore = true;
      this._storeName = options.name || "store";
      this._useLocalStorage = options.localStorage || false;
      this.store = this._initStore(dataOrSetup);

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

    this.root = document.querySelector(selectorOrStore);
    this.queue = [];
    this.watchers = {};
    this._state = {};
    this._stateWatchers = {};

    this.store = new Proxy(
      {},
      {
        set: (obj, prop, value) => {
          obj[prop] = value;

          if (!isNaN(prop) || prop === "length") {
            this._saveStore(obj);
            subscribers.forEach((fn) => fn(obj));

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
    if (!template) return { effect: () => {}, click: () => {} };

    const parent = template.parentElement;
    const templateHTML = template.cloneNode(true);

    const clickBindings = [];

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

            clickBindings.forEach(({ selector, handler }) => {
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

      click: (selector) => (handler) => {
        clickBindings.push({ selector, handler });
        return loopApi;
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
            "📚 Recipe Failed to parse localStorage for store:",
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

    return (handler) => {
      ctx.queue.push(() => {
        const elements = selector
          ? ctx.root.querySelectorAll(selector)
          : [ctx.root];

        elements.forEach((el, index) => {
          if (!el) {
            console.warn(`📚 Recipe Element not found: ${selector}`);
            return;
          }

          el.addEventListener("click", () => {
            const target = ctx._getRuntime(el);
            handler(target, index);
          });
        });
      });

      return ctx;
    };
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

  watch(key, handler) {
    this.watchers[key] = (value, R) => handler(value, R);
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
        const base = ctx.root || document;
        return wrap(base.querySelectorAll(selector), ctx);
      },
      data: {
        set: (key, value) => {
          ctx._state[key] = value;
          el?.setAttribute(`data-${key}`, value);
          if (ctx._stateWatchers?.[key]) {
            ctx._stateWatchers[key].forEach((fn) => fn(value));
          }
        },
        get: (key) => ctx._state[key],
        watch: (key) => (fn) => {
          ctx._stateWatchers ??= {};
          ctx._stateWatchers[key] ??= [];
          ctx._stateWatchers[key].push(fn);
        },
      },
      parent(selector) {
        const parentEl = selector ? el.closest(selector) : el.parentElement;
        return {
          data: {
            set: (key, value) => {
              ctx._state[key] = value;
              parentEl?.setAttribute(`data-${key}`, value);
              if (ctx._stateWatchers?.[key]) {
                ctx._stateWatchers[key].forEach((fn) => fn(value));
              }
            },
            get: (key) => ctx._state[key],
            watch: (key) => (fn) => {
              ctx._stateWatchers ??= {};
              ctx._stateWatchers[key] ??= [];
              ctx._stateWatchers[key].push(fn);
            },
          },
        };
      },
      getItem() {
        const item =
          el.getAttribute("data-r-item") ||
          el.closest("[data-r-item]")?.getAttribute("data-r-item");
        try {
          return item ? JSON.parse(item) : null;
        } catch {
          console.warn("📚 Recipe Failed to parse data-r-item:", item);
          return null;
        }
      },
    };
  }
}

const globalWatchers = {};

function wrap(elements, ctx) {
  const stateWatchers = ctx?._stateWatchers ?? globalWatchers;
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
    data: {
      set(key, value) {
        elements.forEach((el) => {
          el.setAttribute(`data-${key}`, value);
          if (stateWatchers?.[key]) {
            stateWatchers[key].forEach((fn) => fn(value));
          }
        });
        return this;
      },
      get(key) {
        return elements[0]?.getAttribute(`data-${key}`);
      },
      watch(key) {
        return (fn) => {
          stateWatchers[key] ??= [];
          stateWatchers[key].push(fn);
        };
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
        data: {
          set: (key, value) => {
            el?.setAttribute(`data-${key}`, value);
            if (stateWatchers?.[key]) {
              stateWatchers[key].forEach((fn) => fn(value));
            }
            return this;
          },
          get: (key) => el?.getAttribute(`data-${key}`),
          watch: (key) => (fn) => {
            stateWatchers[key] ??= [];
            stateWatchers[key].push(fn);
          },
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
    return null;
  },
};

# 🍳 Recipe.js — A Reactive DSL for UI Interactions

**Recipe.js** is a lightweight, expressive, and reactive JavaScript DSL designed to simplify interactive UIs without a heavy framework.

> Think: jQuery meets Alpine.js meets Vue reactivity — all in < ~5KB of custom DSL.

---

## ✨ Features

- ✅ Declarative event binding: `.click()`, `.bind()`, `.watch()`
- ✅ Scoped runtime with `R.q(...)`, `.class.add()`, `.getItem()`
- ✅ Reactive store with `Proxy`, localStorage sync, `.watch()`
- ✅ DOM rendering via `.loop().effect()`
- ✅ Global runtime via `$r` for toasts, modals, and counters
- ✅ jQuery-style class chaining: `.class.add("x").remove("y")`
- ✅ No dependencies. Pure, extensible JavaScript.

## 💡 Runtime Helpers

| Function                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `el.q(selector)`        | Scoped query selector inside the component          |
| `el.class.add/remove()` | Class manipulation with chaining support            |
| `el.getItem()`          | Reads data from `data-r-item` on self or parent     |
| `el.parent.data.set()`  | Set reactive values that trigger `.watch()`         |
| `$r.q(selector)`        | Global document-level query selector                |
| `.text(key, value)`     | Updates `[r-text="key"]` content inside the element |

---

## 📦 Store Setup

```js
const team = new Recipe(
  "store",
  [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
  ],
  {
    name: "team",
    localStorage: true,
  }
);
```

## Acces it anywhere

```
const store = Recipe.store.get("team");
store.push({ id: "3", name: "Charlie" });
```

## Add simple template loops

init

```
const products = new Recipe(".products-grid");
const loop = products.loop();

loop.bind.click(".add-to-cart")((R, index) => {
  const item = R.getItem();
  Recipe.store.get("basket").push(item);
});

loop.effect(Recipe.store.get("team"), ["name", "id"]);
```

render

```
<div class="products-grid">
  <div r-loop>
    <p r-text="name"></p>
    <button class="add-to-cart">Add</button>
  </div>
</div>
```

## Component events (does not work)

```
const tabs = new Recipe(".tabs");

tabs.click(".tab")((R, index) => {
  R.q(".tab").class.remove("active");
  R.class.add("active");
  R.parent.data.set("active", index);
});

tabs.watch("active", (R, value) => {
  R.q(".tab-contents > div").class.add("hidden");
  R.q(".tab-contents > div").eq(value).class.remove("hidden");
});
```

## Global runtime

```
$r.q(".toast").class.add("show").remove("hidden");

$r.q(".toast").click(() => {
  $r.q(".toast").class.remove("show").add("hidden");
});
```

## Toast example

```
addPerson.click()((R) => {
  Recipe.store.get("team").push({
    id: Date.now().toString(),
    name: "New Person",
    age: Math.floor(Math.random() * 100)
  });

  const toast = $r.q(".toast");
  toast.class.add("show").remove("hidden");

  setTimeout(() => {
    toast.class.add("hidden").remove("show");
  }, 3000);
});
```

## Basket example

```
basket.watch("length", (R, value) => {
  $r.q(".product-basket").text("count", value);
});
```

## Dom Structure

```
<div class="tabs-watch">
  <button class="tab">Tab 1</button>
  <button class="tab">Tab 2</button>
  <div class="tab-contents">
    <div>Tab 1 Content</div>
    <div class="hidden">Tab 2 Content</div>
  </div>
</div>

<div class="products-grid">
  <div r-loop>
    <span r-text="name"></span>
    <button class="add-to-cart">Add</button>
  </div>
</div>

<div class="product-basket">
  🧺 <span r-text="count">0</span>
</div>

<div class="toast hidden">✅ Product added!</div>
```

## 🛠 Roadmap

- r-if, r-class, r-attr, r-bind directive support
- .sync() for two-way data binding
- Plugin system: Recipe.use(plugin)
- Event modifiers: .click().once() or .click().prevent()
- Devtools overlay for state inspection

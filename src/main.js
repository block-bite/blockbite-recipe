import { Recipe } from "./recipe.js";

// Tabs with bind
const tabsBind = new Recipe(".tabs-bind");

tabsBind
  .click(".tab")((index, R) => {
    R.q(".tab").class.remove("ring-2");
    R.class.add("ring-2");
  })
  .label("tab-click");

tabsBind.bind("tab-click", (index, R) => {
  R.q(".tab").class.remove("active");
  R.q(".tab").eq(index).class.add("active");
  R.q(".tab-contents > div").class.add("hidden");
  R.q(".tab-contents > div").eq(index).class.remove("hidden");
  R.parent.data.set("active", index);
});

// Tabs with watch
const tabsWatch = new Recipe(".tabs-watch");

tabsWatch.click(".tab")((index, R) => {
  R.q(".tab").class.remove("active");
  R.class.add("active");
  R.parent.data.set("active", index);
});

tabsWatch.watch("active", (value, R) => {
  R.q(".tab-contents > div").class.add("hidden");
  R.q(".tab-contents > div").eq(value).class.remove("hidden");
});

// Store
const store = new Recipe(
  "store",
  [
    { id: "1", name: "John Doe", age: 30 },
    { id: "2", name: "Jane Smith", age: 25 },
    { id: "3", name: "Alice Johnson", age: 28 },
    { id: "4", name: "Bob Brown", age: 35 },
    { id: "5", name: "Charlie Davis", age: 22 },
    { id: "6", name: "Diana Prince", age: 27 },
    { id: "7", name: "Ethan Hunt", age: 32 },
    { id: "8", name: "Fiona Green", age: 29 },
    { id: "9", name: "George White", age: 31 },
    { id: "10", name: "Hannah Black", age: 26 },
  ],
  { name: "team" }
);
// Store
const basket = new Recipe("store", [], { name: "basket", localStorage: true });

const products = new Recipe(".products-grid");
const loop = products.loop();

loop.bind.click(".add-to-cart")((index, R) => {
  const item = R.getItem();
  const basket = Recipe.store.get("basket");
  basket.push(item);
});

loop.effect(store.store, ["id", "name", "age"]);

const addProduct = new Recipe(".add-product");

addProduct.click()((index) => {
  const teamStore = Recipe.store.get("team");
  teamStore.push({
    id: (teamStore.length + 1).toString(),
    name: "New Product",
    age: Math.floor(Math.random() * 100),
  });
});

const removeProduct = new Recipe(".remove-product");
removeProduct.click()((index) => {
  const teamStore = Recipe.store.get("team");

  if (teamStore.length > 0) {
    teamStore.pop();
  }
});

const basketCount = new Recipe(".basket-count");

console.log(basket);

basket.watch("length", (value, R) => {
  basketCount.text("count", value);
});

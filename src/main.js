import { Recipe } from "./recipe.js";

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

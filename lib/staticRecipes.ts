/**
 * Hardcoded recipe data for the demo/static recipes shown on the home page,
 * favorites carousel, and cook page. recipe.tsx checks this map before hitting
 * Supabase so clicking any of these cards shows full recipe details.
 */

export type StaticRecipeData = {
  title: string;
  by: string;
  photoSource: number | null; // local require()
  prep: string;
  cook: string;
  servings: string;
  tip: string;
  ingredients: { id: string; text: string }[];
  steps: string[];
};

const LASAGNA: StaticRecipeData = {
  title: "Mom's Famous Lasagna",
  by: "Mom",
  photoSource: require("../assets/lasagna.png"),
  prep: "20 min",
  cook: "45 min",
  servings: "6",
  tip: "The nutmeg in the ricotta is Grandma's secret — don't skip it.",
  ingredients: [
    { id: "i1", text: "1 lb Ground Beef" },
    { id: "i2", text: "2 cups Ricotta Cheese" },
    { id: "i3", text: "1 package Lasagna Noodles" },
    { id: "i4", text: "2 cups Shredded Mozzarella" },
    { id: "i5", text: "1 jar Marinara Sauce" },
    { id: "i6", text: "1 Egg" },
    { id: "i7", text: "Pinch of Nutmeg" },
    { id: "i8", text: "Salt & Pepper to taste" },
  ],
  steps: [
    "Preheat your oven to 375°F (190°C). Bring a large pot of salted water to a boil.",
    "Brown the ground beef in a large skillet over medium heat until no longer pink. Drain excess fat and season with salt and pepper.",
    "Stir the marinara sauce into the cooked beef. Reduce heat and simmer for 10 minutes, stirring occasionally.",
    "In a bowl, mix the ricotta cheese with the egg and a pinch of nutmeg until smooth.",
    "Cook the lasagna noodles according to package directions. Drain and lay flat on a lightly oiled baking sheet.",
    "Spread a thin layer of meat sauce on the bottom of a 9×13 baking dish. Layer noodles, ricotta mixture, meat sauce, and mozzarella. Repeat until all ingredients are used.",
    "Top with remaining mozzarella. Cover tightly with foil and bake for 25 minutes.",
    "Remove foil and bake an additional 20 minutes until the top is golden and bubbly. Let rest for 10 minutes before slicing.",
  ],
};

const SUNDAY_ROAST: StaticRecipeData = {
  title: "Grandma's Sunday Roast",
  by: "Grandma",
  photoSource: require("../assets/beefstew.jpg"),
  prep: "20 min",
  cook: "2 hr 30 min",
  servings: "8",
  tip: "Low and slow is the only way — Grandma never rushed this one.",
  ingredients: [
    { id: "i1", text: "3 lb Beef Chuck Roast" },
    { id: "i2", text: "4 medium Potatoes, quartered" },
    { id: "i3", text: "3 large Carrots, cut into chunks" },
    { id: "i4", text: "2 Onions, sliced" },
    { id: "i5", text: "4 cloves Garlic, minced" },
    { id: "i6", text: "2 cups Beef Stock" },
    { id: "i7", text: "2 tbsp Olive Oil" },
    { id: "i8", text: "Fresh Rosemary & Thyme" },
    { id: "i9", text: "Salt & Pepper to taste" },
  ],
  steps: [
    "Preheat your oven to 325°F (165°C). Pat the roast completely dry with paper towels and season generously all over with salt and pepper.",
    "Heat olive oil in a large Dutch oven over high heat. Sear the roast on all sides until deeply browned, about 3–4 minutes per side. Remove and set aside.",
    "Reduce heat to medium. Add onions and garlic to the pot and cook for 3 minutes until softened. Stir in the beef stock, scraping up any browned bits from the bottom.",
    "Return the roast to the pot. Tuck the potatoes and carrots around it and lay the rosemary and thyme on top.",
    "Cover tightly and transfer to the oven. Roast for 2.5–3 hours until the meat is fall-apart tender.",
    "Remove the roast and vegetables to a platter. Skim the fat from the juices and simmer on the stovetop for 5 minutes to make a simple gravy. Serve everything together.",
  ],
};

const SUMMER_SALAD: StaticRecipeData = {
  title: "Dad's Summer Salad",
  by: "Dad",
  photoSource: require("../assets/salad1.avif"),
  prep: "15 min",
  cook: "0 min",
  servings: "2",
  tip: "Soak the red onion in cold water first — raw onion ruins a salad if you skip this.",
  ingredients: [
    { id: "i1", text: "1 large head Romaine Lettuce, chopped" },
    { id: "i2", text: "1 cup Cherry Tomatoes, halved" },
    { id: "i3", text: "1 Cucumber, sliced" },
    { id: "i4", text: "½ Red Onion, thinly sliced" },
    { id: "i5", text: "½ cup Kalamata Olives" },
    { id: "i6", text: "100g Feta Cheese, crumbled" },
    { id: "i7", text: "3 tbsp Olive Oil" },
    { id: "i8", text: "1½ tbsp Red Wine Vinegar" },
    { id: "i9", text: "1 tsp Dried Oregano" },
    { id: "i10", text: "Salt & Pepper to taste" },
  ],
  steps: [
    "Soak the sliced red onion in cold water for 10 minutes, then drain.",
    "In a large bowl, combine the romaine, cherry tomatoes, cucumber, and drained red onion.",
    "Whisk together the olive oil, red wine vinegar, oregano, salt, and pepper in a small bowl until combined.",
    "Add the olives and drizzle the dressing over the salad. Toss gently to coat everything evenly.",
    "Top with crumbled feta. Serve immediately — this salad waits for no one.",
  ],
};

const TACO_NIGHT: StaticRecipeData = {
  title: "Sister's Taco Night Special",
  by: "Sister",
  photoSource: require("../assets/tacos.webp"),
  prep: "10 min",
  cook: "20 min",
  servings: "4",
  tip: "Add a splash of hot sauce to the meat while it simmers — Sister's signature move.",
  ingredients: [
    { id: "i1", text: "1 lb Ground Beef or Turkey" },
    { id: "i2", text: "1 packet Taco Seasoning" },
    { id: "i3", text: "8 small Flour or Corn Tortillas" },
    { id: "i4", text: "1 cup Shredded Cheddar Cheese" },
    { id: "i5", text: "1 cup Salsa" },
    { id: "i6", text: "1 cup Sour Cream" },
    { id: "i7", text: "1 Avocado, sliced" },
    { id: "i8", text: "½ cup Fresh Cilantro" },
    { id: "i9", text: "1 Lime, cut into wedges" },
  ],
  steps: [
    "Brown the ground beef in a large skillet over medium-high heat until cooked through. Break it up as it cooks. Drain excess fat.",
    "Add the taco seasoning packet plus ⅔ cup of water. Stir well and simmer for 5 minutes until the sauce thickens and coats the meat.",
    "Warm the tortillas directly over a gas flame for 20 seconds per side, or in a dry skillet, until slightly charred and pliable.",
    "Set out all the toppings in bowls so everyone can build their own: cheese, salsa, sour cream, avocado, cilantro, and lime wedges.",
    "Spoon the seasoned meat into each tortilla, load up your toppings, and squeeze a lime wedge over the top before eating.",
  ],
};

const PANCAKES: StaticRecipeData = {
  title: "Weekend Fluffy Pancakes",
  by: "Dad",
  photoSource: require("../assets/pancakes.webp"),
  prep: "10 min",
  cook: "15 min",
  servings: "4",
  tip: "The lumps are your friend — overmixing kills the fluff.",
  ingredients: [
    { id: "i1", text: "1½ cups All-Purpose Flour" },
    { id: "i2", text: "3½ tsp Baking Powder" },
    { id: "i3", text: "1 tsp Salt" },
    { id: "i4", text: "1 tbsp Sugar" },
    { id: "i5", text: "1¼ cups Milk" },
    { id: "i6", text: "1 Egg" },
    { id: "i7", text: "3 tbsp Melted Butter" },
    { id: "i8", text: "1 tsp Vanilla Extract" },
  ],
  steps: [
    "In a large bowl, whisk together the flour, baking powder, salt, and sugar.",
    "In a separate bowl, beat the egg lightly, then mix in the milk, melted butter, and vanilla.",
    "Pour the wet ingredients into the dry and stir until just combined. A few lumps are fine — don't overmix.",
    "Let the batter rest for 5 minutes while you heat a lightly greased pan or griddle over medium heat.",
    "Pour ¼ cup of batter per pancake. Cook until bubbles form on the surface and the edges look set, about 2–3 minutes. Flip and cook 1–2 minutes more until golden.",
    "Serve immediately with butter and maple syrup. These are best eaten straight off the griddle.",
  ],
};

/**
 * All static recipe IDs mapped to their full data.
 * Covers favorites (default-*), home family cards (static-*), and cook page (s*).
 */
export const STATIC_RECIPES_MAP: Record<string, StaticRecipeData> = {
  // Favorites carousel IDs
  "default-1": LASAGNA,
  "default-2": SUMMER_SALAD,
  "default-3": SUNDAY_ROAST,

  // Home page family member card IDs
  "static-1": LASAGNA,
  "static-2": SUNDAY_ROAST,
  "static-3": SUMMER_SALAD,

  // Cook page IDs
  "s1": LASAGNA,
  "s2": SUNDAY_ROAST,
  "s3": SUMMER_SALAD,
  "s4": TACO_NIGHT,
  "s5": PANCAKES,
};

/** Returns true if the given ID refers to a hardcoded static recipe. */
export function isStaticRecipe(id: string): boolean {
  return id in STATIC_RECIPES_MAP;
}

import pepperoni from "@/assets/pizza-pepperoni.jpg";
import margherita from "@/assets/pizza-margherita.jpg";
import bbq from "@/assets/pizza-bbq.jpg";
import burger from "@/assets/burger.jpg";
import fries from "@/assets/fries.jpg";
import wings from "@/assets/wings.jpg";
import pasta from "@/assets/pasta.jpg";
import shawarma from "@/assets/shawarma.jpg";
import drink from "@/assets/drink.jpg";

export type Category =
  | "All"
  | "Pizza"
  | "Burgers"
  | "Pasta"
  | "Shawarma"
  | "Fries"
  | "Wings"
  | "Drinks";

export type MenuItem = {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  image: string;
  tag?: "Bestseller" | "New" | "Hot" | "Deal";
  desc: string;
};

export const CATEGORIES: { id: Category; icon: string }[] = [
  { id: "All", icon: "Sparkles" },
  { id: "Pizza", icon: "Pizza" },
  { id: "Burgers", icon: "Beef" },
  { id: "Pasta", icon: "UtensilsCrossed" },
  { id: "Shawarma", icon: "Wrap" },
  { id: "Wings", icon: "Drumstick" },
  { id: "Fries", icon: "Soup" },
  { id: "Drinks", icon: "CupSoda" },
];

export const MENU: MenuItem[] = [
  { id: "p1", name: "Pepperoni Inferno", category: "Pizza", price: 14.5, image: pepperoni, tag: "Bestseller", desc: "Double pepperoni, mozzarella, fire-roasted tomato" },
  { id: "p2", name: "Margherita Royale", category: "Pizza", price: 12.0, image: margherita, tag: "New", desc: "Buffalo mozzarella, basil, San Marzano" },
  { id: "p3", name: "BBQ Smokehouse", category: "Pizza", price: 15.5, image: bbq, tag: "Hot", desc: "BBQ chicken, red onion, fresh cilantro" },
  { id: "b1", name: "Wagyu Smash", category: "Burgers", price: 11.0, image: burger, tag: "Bestseller", desc: "Wagyu patty, aged cheddar, brioche bun" },
  { id: "f1", name: "Truffle Fries", category: "Fries", price: 5.5, image: fries, desc: "Hand-cut, truffle oil, parmesan" },
  { id: "w1", name: "Buffalo Wings", category: "Wings", price: 9.0, image: wings, tag: "Hot", desc: "Crispy wings, buffalo glaze, blue cheese" },
  { id: "pa1", name: "Alfredo Bianco", category: "Pasta", price: 10.5, image: pasta, desc: "Creamy alfredo, parmesan, fresh parsley" },
  { id: "s1", name: "Chicken Shawarma", category: "Shawarma", price: 7.5, image: shawarma, desc: "Marinated chicken, garlic toum, pickles" },
  { id: "d1", name: "Cola Glacé", category: "Drinks", price: 2.5, image: drink, desc: "Ice-cold cola, fresh lime" },
];

"use client";

import { useEffect, useState } from "react";
import styles from "./About.module.css";

/**
 * Produce Recs (about page): the current month in brackets (Figma's "[month]") and five things in
 * season across the US that month. Worked out in the visitor's browser, so the page never goes
 * stale; the build-time month shows until then.
 */
const SEASON: [string, string, string, string, string][] = [
  ["Grapefruit", "Oranges", "Kale", "Leeks", "Turnips"], // January
  ["Blood Oranges", "Lemons", "Cabbage", "Cauliflower", "Parsnips"], // February
  ["Artichokes", "Asparagus", "Broccoli", "Radishes", "Spinach"], // March
  ["Asparagus", "Rhubarb", "Fava Beans", "Ramps", "Peas"], // April
  ["Strawberries", "Rhubarb", "Snap Peas", "Radishes", "Morels"], // May
  ["Cherries", "Strawberries", "Apricots", "Zucchini", "Green Beans"], // June
  ["Peaches", "Blueberries", "Watermelon", "Sweet Corn", "Tomatoes"], // July
  ["Tomatoes", "Sweet Corn", "Peaches", "Melons", "Eggplant"], // August
  ["Apples", "Figs", "Grapes", "Pears", "Bell Peppers"], // September
  ["Apples", "Pumpkins", "Pears", "Brussels Sprouts", "Sweet Potatoes"], // October
  ["Cranberries", "Persimmons", "Pomegranates", "Sweet Potatoes", "Butternut Squash"], // November
  ["Clementines", "Pomegranates", "Kale", "Parsnips", "Winter Squash"], // December
];

const monthName = (m: number) =>
  new Date(2000, m, 1).toLocaleString("en-US", { month: "long" });

/** starts from the month the page was built in (`initial`, so server and browser agree), then
    moves to the visitor's own month */
function useMonth(initial: number) {
  const [m, setM] = useState(initial);
  useEffect(() => setM(new Date().getMonth()), []);
  return m;
}

export function RecsMonth({ initial, style }: { initial: number; style?: React.CSSProperties }) {
  const m = useMonth(initial);
  return (
    <p className={styles.month} data-reveal="up" style={style}>
      [{monthName(m)}]
    </p>
  );
}

export function RecsList({ initial }: { initial: number }) {
  const m = useMonth(initial);
  return (
    <ul className={styles.produce} data-reveal="up" aria-label={`In season in ${monthName(m)}`}>
      {SEASON[m].map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}

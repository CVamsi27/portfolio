import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CHANDALURI, KRISHNA, VAMSI } from "./const";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRandomWord(words: { word: string; language: string }[]): {
  word: string;
  language: string;
} {
  return words[Math.floor(Math.random() * words.length)];
}

export function getUniqueLanguageCombination() {
  let randomVamsi = getRandomWord(VAMSI);
  let randomKrishna = getRandomWord(KRISHNA);
  let randomChandaluri = getRandomWord(CHANDALURI);

  while (
    randomVamsi.language === randomKrishna.language ||
    randomVamsi.language === randomChandaluri.language ||
    randomKrishna.language === randomChandaluri.language
  ) {
    randomVamsi = getRandomWord(VAMSI);
    randomKrishna = getRandomWord(KRISHNA);
    randomChandaluri = getRandomWord(CHANDALURI);
  }

  return { randomVamsi, randomKrishna, randomChandaluri };
}

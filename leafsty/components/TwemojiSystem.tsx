"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  X,
  Clock,
  Smile,
  Hand,
  Leaf,
  Pizza,
  Gamepad2,
  Lightbulb,
  Hash,
} from "lucide-react";

export interface TwemojiEntry {
  char: string;
  hex: string;
  name: string;
  shortcode: string;
  cat:
    | "Smileys"
    | "People"
    | "Nature"
    | "Food"
    | "Activities"
    | "Objects"
    | "Symbols";
  skinTones?: boolean;
}

export const TWEMOJI_CATALOG: TwemojiEntry[] = [
  { char: "😀", hex: "1f600", name: "grinning face smile happy", shortcode: "grinning", cat: "Smileys" },
  { char: "😂", hex: "1f602", name: "joy laugh tears lol", shortcode: "joy", cat: "Smileys" },
  { char: "😊", hex: "1f60a", name: "blush smiling happy", shortcode: "blush", cat: "Smileys" },
  { char: "😍", hex: "1f60d", name: "heart eyes love", shortcode: "heart_eyes", cat: "Smileys" },
  { char: "😎", hex: "1f60e", name: "sunglasses cool", shortcode: "sunglasses", cat: "Smileys" },
  { char: "🥳", hex: "1f973", name: "partying celebrate birthday", shortcode: "partying_face", cat: "Smileys" },
  { char: "🤔", hex: "1f914", name: "thinking hmm", shortcode: "thinking", cat: "Smileys" },
  { char: "😭", hex: "1f62d", name: "sob crying sad", shortcode: "sob", cat: "Smileys" },
  { char: "😱", hex: "1f631", name: "scream shocked", shortcode: "scream", cat: "Smileys" },
  { char: "💀", hex: "1f480", name: "skull dead", shortcode: "skull", cat: "Smileys" },
  { char: "👻", hex: "1f47b", name: "ghost spooky", shortcode: "ghost", cat: "Smileys" },
  { char: "🤡", hex: "1f921", name: "clown", shortcode: "clown", cat: "Smileys" },
  { char: "👍", hex: "1f44d", name: "thumbs up like yes", shortcode: "thumbsup", cat: "People", skinTones: true },
  { char: "👎", hex: "1f44e", name: "thumbs down dislike no", shortcode: "thumbsdown", cat: "People", skinTones: true },
  { char: "👋", hex: "1f44b", name: "wave hello hi bye", shortcode: "wave", cat: "People", skinTones: true },
  { char: "👏", hex: "1f44f", name: "clap applause", shortcode: "clap", cat: "People", skinTones: true },
  { char: "🙏", hex: "1f64f", name: "pray please thanks", shortcode: "pray", cat: "People", skinTones: true },
  { char: "👀", hex: "1f440", name: "eyes look watching", shortcode: "eyes", cat: "People" },
  { char: "🌿", hex: "1f33f", name: "herb leaf green leafsty", shortcode: "herb", cat: "Nature" },
  { char: "🍃", hex: "1f343", name: "leaves wind flutter", shortcode: "leaves", cat: "Nature" },
  { char: "🌱", hex: "1f331", name: "seedling sprout plant", shortcode: "seedling", cat: "Nature" },
  { char: "🔥", hex: "1f525", name: "fire flame lit", shortcode: "fire", cat: "Nature" },
  { char: "⭐", hex: "2b50", name: "star", shortcode: "star", cat: "Nature" },
  { char: "✨", hex: "2728", name: "sparkles magic shine", shortcode: "sparkles", cat: "Nature" },
  { char: "🌙", hex: "1f319", name: "moon night", shortcode: "crescent_moon", cat: "Nature" },
  { char: "🍕", hex: "1f355", name: "pizza", shortcode: "pizza", cat: "Food" },
  { char: "☕", hex: "2615", name: "coffee hot", shortcode: "coffee", cat: "Food" },
  { char: "🎮", hex: "1f3ae", name: "video game controller", shortcode: "video_game", cat: "Activities" },
  { char: "🎉", hex: "1f389", name: "party popper tada", shortcode: "tada", cat: "Activities" },
  { char: "🔒", hex: "1f512", name: "lock encrypted secure", shortcode: "lock", cat: "Objects" },
  { char: "🚀", hex: "1f680", name: "rocket launch", shortcode: "rocket", cat: "Objects" },
  { char: "❤️", hex: "2764", name: "red heart love", shortcode: "heart", cat: "Symbols" },
  { char: "💚", hex: "1f49a", name: "green heart leafsty", shortcode: "green_heart", cat: "Symbols" },
  { char: "💯", hex: "1f4af", name: "100 hundred perfect", shortcode: "100", cat: "Symbols" },
  { char: "⚡", hex: "26a1", name: "zap lightning bolt", shortcode: "zap", cat: "Symbols" },
];

const INLINE_TWEMOJI_SVGS: Record<string, string> = {
  "1f600": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><path fill="#664500" d="M18 21c-3.623 0-6.027-.422-9-1-.679-.131-2 0-2 2 0 4 4.595 9 11 9 6.404 0 11-5 11-9 0-2-1.321-2.132-2-2-2.973.578-5.377 1-9 1z"/><path fill="#FFF" d="M9 22s3 1 9 1 9-1 9-1-2 4-9 4-9-4-9-4z"/><ellipse fill="#664500" cx="12" cy="13.5" rx="2.5" ry="3.5"/><ellipse fill="#664500" cx="24" cy="13.5" rx="2.5" ry="3.5"/></svg>`,
  "1f602": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><path fill="#664500" d="M18 21.8c-3 0-4.9-.3-7.4-.8-.6-.1-1.6 0-1.6 1.6 0 3.3 3.8 7.4 9 7.4s9-4.1 9-7.4c0-1.6-1.1-1.7-1.6-1.6-2.5.5-4.4.8-7.4.8"/><path fill="#FFF" d="M10.6 22.7s2.5.8 7.4.8 7.4-.8 7.4-.8-1.6 3.3-7.4 3.3-7.4-3.3-7.4-3.3"/><path fill="#5DADEC" d="M9.1 18.7c-1 3.8-3.8 6.3-6.4 5.6-2.5-.7-3.4-4.3-2.5-8.1 1-3.8 6.5-5.9 7.1-5.8.6.2 2.8 4.5 1.8 8.3zm17.8 0c1 3.8 3.8 6.3 6.4 5.6 2.5-.7 3.4-4.3 2.5-8.1-1-3.8-6.5-5.9-7.1-5.8-.6.2-2.8 4.5-1.8 8.3z"/><path fill="none" stroke="#664500" stroke-width="2.2" stroke-linecap="round" d="M14.5 14.5c-1.5-2-3.5-2-5 0m17 0c-1.5-2-3.5-2-5 0"/></svg>`,
  "1f60a": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><circle fill="#FF7892" cx="7.5" cy="21" r="3.5" opacity=".6"/><circle fill="#FF7892" cx="28.5" cy="21" r="3.5" opacity=".6"/><path fill="none" stroke="#664500" stroke-width="2.4" stroke-linecap="round" d="M9.5 15c1.5-2 3.5-2 5 0m7 0c1.5-2 3.5-2 5 0M12 23c2 3 10 3 12 0"/></svg>`,
  "1f60d": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><path fill="#664500" d="M18 22c-3.6 0-6-.4-9-1-.7-.1-2 0-2 2 0 4 4.6 9 11 9s11-5 11-9c0-2-1.3-2.1-2-2-3 .6-5.4 1-9 1z"/><path fill="#DD2E44" d="M15.6 10.5c-.9-.9-2.4-.9-3.3 0l-.3.3-.3-.3c-.9-.9-2.4-.9-3.3 0-.9.9-.9 2.4 0 3.3l3.6 3.6 3.6-3.6c.9-.9.9-2.4 0-3.3zm12 0c-.9-.9-2.4-.9-3.3 0l-.3.3-.3-.3c-.9-.9-2.4-.9-3.3 0-.9.9-.9 2.4 0 3.3l3.6 3.6 3.6-3.6c.9-.9.9-2.4 0-3.3z"/></svg>`,
  "1f60e": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><path fill="#292F33" d="M35.5 12.5H.5c-.3 0-.5.2-.5.5v2c0 .3.2.5.5.5h1.1l1.2 4.3c.4 1.5 1.8 2.7 3.4 2.7h6.1c1.6 0 3-1.1 3.4-2.6l1.1-3.9h2.4l1.1 3.9c.4 1.5 1.8 2.6 3.4 2.6h6.1c1.6 0 3-1.2 3.4-2.7l1.2-4.3h1.1c.3 0 .5-.2.5-.5v-2c0-.3-.2-.5-.5-.5z"/><path fill="none" stroke="#664500" stroke-width="2.2" stroke-linecap="round" d="M23.5 27.5c-2.8 1.5-8.2 1.5-11 0"/></svg>`,
  "1f973": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><path fill="#3B88C3" d="M4 11L15 2l3 11z"/><path fill="#FFAC33" d="M6.5 8.8L15.8 5l.8 3.2z"/><circle fill="#DD2E44" cx="15" cy="2" r="2"/><path fill="none" stroke="#664500" stroke-width="2.2" stroke-linecap="round" d="M10 17c1.5-1.5 3.5-1.5 5 0m6 0c1.5-1.5 3.5-1.5 5 0"/><circle fill="#664500" cx="18" cy="25" r="3"/></svg>`,
  "1f914": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><ellipse fill="#664500" cx="12" cy="14" rx="2.3" ry="3"/><ellipse fill="#664500" cx="24" cy="13" rx="2.3" ry="3"/><path fill="none" stroke="#664500" stroke-width="2.2" stroke-linecap="round" d="M13 24c2.5-1 6.5-1 9 0"/><path fill="#F4900C" d="M11 26h9c1.5 0 2.5 1 2.5 2.5S21.5 31 20 31h-5v3c0 1.1-.9 2-2 2s-2-.9-2-2v-8z"/></svg>`,
  "1f62d": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><path fill="#5DADEC" d="M9 16h4v18H9zm14 0h4v18h-4z"/><ellipse fill="#664500" cx="18" cy="25.5" rx="4.5" ry="5.5"/><path fill="#E75A70" d="M18 27.5c-1.8 0-3.2.9-3.8 2.2 1 .8 2.3 1.3 3.8 1.3s2.8-.5 3.8-1.3c-.6-1.3-2-2.2-3.8-2.2z"/><path stroke="#664500" stroke-width="2.2" stroke-linecap="round" fill="none" d="M8.5 15.5c2 1.5 4.5 1.5 6.5 0m6 0c2 1.5 4.5 1.5 6.5 0"/></svg>`,
  "1f631": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><path fill="#5DADEC" d="M0 18C0 8.1 8.1 0 18 0s18 8.1 18 18H0z" opacity=".5"/><ellipse fill="#FFF" cx="12" cy="14" rx="3.5" ry="4.5"/><ellipse fill="#FFF" cx="24" cy="14" rx="3.5" ry="4.5"/><ellipse fill="#664500" cx="18" cy="26" rx="4" ry="5.5"/></svg>`,
  "1f480": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#CCD6DD" d="M32 15c0 7.7-6.3 13-14 13S4 22.7 4 15 10.3 1 18 1s14 6.3 14 14z"/><path fill="#CCD6DD" d="M25 25v6c0 1.7-1.3 3-3 3h-8c-1.7 0-3-1.3-3-3v-6h14z"/><circle fill="#292F33" cx="12" cy="17" r="4"/><circle fill="#292F33" cx="24" cy="17" r="4"/><path fill="#292F33" d="M18 21l-2 4h4z"/></svg>`,
  "1f47b": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#E1E8ED" d="M18 2C10.3 2 5 7.8 5 16v15c0 1.5 1.8 2.2 2.8 1.1l3.2-3.4 3.5 3.6c.8.8 2.2.8 3 0l3.5-3.6 3.2 3.4c1 1.1 2.8.4 2.8-1.1V16c0-8.2-5.3-14-13-14z"/><circle fill="#292F33" cx="14" cy="14" r="2.3"/><circle fill="#292F33" cx="23" cy="14" r="2.3"/><ellipse fill="#292F33" cx="18.5" cy="20" rx="2.5" ry="3"/></svg>`,
  "1f921": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFF" cx="18" cy="18" r="17"/><circle fill="#DD2E44" cx="5" cy="11" r="4.5"/><circle fill="#DD2E44" cx="31" cy="11" r="4.5"/><circle fill="#DD2E44" cx="18" cy="19" r="3.5"/><circle fill="#292F33" cx="12.5" cy="13" r="2"/><circle fill="#292F33" cx="23.5" cy="13" r="2"/><path fill="none" stroke="#DD2E44" stroke-width="2.5" stroke-linecap="round" d="M10 24c3 4 13 4 16 0"/></svg>`,
};
const EXTRA_TWEMOJI_SVGS: Record<string, string> = {
  "1f44d": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFDC5D" d="M31 19c0-1.3-.8-2.4-2-2.8.8-.6 1.3-1.5 1.3-2.5 0-1.7-1.4-3.1-3.1-3.1h-6.4c.5-1.7 1.2-4.3 1.2-6.1 0-2.5-1.5-3.5-3-3.5-1.2 0-2 .8-2.3 2-.6 2.5-2.5 6.8-5.7 9.5V29h14.5c1.8 0 3.2-1.4 3.2-3.2 0-.8-.3-1.5-.8-2.1 1.2-.4 2.1-1.5 2.1-2.8 0-.7-.3-1.4-.7-1.9.9-.5 1.7-1.4 1.7-2.5z"/><rect fill="#55ACEE" x="4" y="13" width="7" height="17" rx="2"/></svg>`,
  "1f44e": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFDC5D" d="M31 17c0 1.3-.8 2.4-2 2.8.8.6 1.3 1.5 1.3 2.5 0 1.7-1.4 3.1-3.1 3.1h-6.4c.5 1.7 1.2 4.3 1.2 6.1 0 2.5-1.5 3.5-3 3.5-1.2 0-2-.8-2.3-2-.6-2.5-2.5-6.8-5.7-9.5V7h14.5c1.8 0 3.2 1.4 3.2 3.2 0 .8-.3 1.5-.8 2.1 1.2.4 2.1 1.5 2.1 2.8 0 .7-.3 1.4-.7 1.9.9.5 1.7 1.4 1.7 2.5z"/><rect fill="#55ACEE" x="4" y="6" width="7" height="17" rx="2"/></svg>`,
  "1f44b": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFDC5D" d="M29.5 14.5c-.9-.5-2-.2-2.5.7l-2.8 4.8V7.5c0-1.1-.9-2-2-2s-2 .9-2 2v10h-1V5.5c0-1.1-.9-2-2-2s-2 .9-2 2v12h-1V7.5c0-1.1-.9-2-2-2s-2 .9-2 2v11h-1v-8c0-1.1-.9-2-2-2s-2 .9-2 2v13c0 5.5 4.5 10 10 10 4.2 0 7.9-2.6 9.3-6.5l3.6-9.9c.4-.9 0-2-.9-2.6z"/></svg>`,
  "1f44f": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFDC5D" d="M27 17l-6-9c-.7-1-2-1.2-3-.5s-1.2 2-.5 3l4 6-7-7c-.8-.8-2.2-.8-3 0s-.8 2.2 0 3l6 6-6.5-4.5c-.9-.6-2.2-.4-2.8.5s-.4 2.2.5 2.8l7.5 5.5c3.5 2.6 8.4 2 11.2-1.3 2.1-2.5 2.3-6 .6-8.5z"/></svg>`,
  "1f64f": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFDC5D" d="M17.5 4L11 19v11h6.5V4zm1 0L25 19v11h-6.5V4z"/><path fill="#55ACEE" d="M7 27h10v7H7zm12 0h10v7H19z"/></svg>`,
  "1f440": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><ellipse fill="#FFF" stroke="#CCD6DD" stroke-width="1.5" cx="11" cy="18" rx="6.5" ry="11"/><ellipse fill="#FFF" stroke="#CCD6DD" stroke-width="1.5" cx="25" cy="18" rx="6.5" ry="11"/><ellipse fill="#292F33" cx="9" cy="18" rx="3" ry="4.5"/><ellipse fill="#292F33" cx="23" cy="18" rx="3" ry="4.5"/></svg>`,
  "1f33f": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="none" stroke="#5C913B" stroke-width="2.5" stroke-linecap="round" d="M6 32c8-8 16-16 24-26"/><ellipse fill="#77B255" cx="14" cy="17" rx="6" ry="3.5" transform="rotate(-35 14 17)"/><ellipse fill="#77B255" cx="21" cy="11" rx="5.5" ry="3" transform="rotate(-35 21 11)"/><ellipse fill="#77B255" cx="20" cy="23" rx="6" ry="3.5" transform="rotate(25 20 23)"/><ellipse fill="#77B255" cx="26" cy="16" rx="5.5" ry="3" transform="rotate(25 26 16)"/></svg>`,
  "1f343": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#77B255" d="M29 6C17 6 9 14 9 25c0 2 .5 3.5 1 5 11 0 19-8 19-24z"/><path fill="#5C913B" d="M8 31c6-6 12-13 18-21" stroke="#5C913B" stroke-width="2" stroke-linecap="round"/></svg>`,
  "1f331": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="none" stroke="#5C913B" stroke-width="3" stroke-linecap="round" d="M18 33V16"/><path fill="#77B255" d="M18 18C18 10 10 7 4 9c0 7 6 11 14 9zm0-3c0-8 8-11 14-9 0 7-6 11-14 9z"/></svg>`,
  "1f525": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#F4900C" d="M31 23c0 7.2-5.8 13-13 13S5 30.2 5 23C5 13 15 5 16 1c3 4 4 8 2 11 4-1 7-5 7-8 4 4 6 11 6 19z"/><path fill="#FFCC4D" d="M26 26c0 4.4-3.6 8-8 8s-8-3.6-8-8c0-6 6-10 7-13 2 3 2 6 1 8 2-1 4-3 4-5 3 2 4 6 4 10z"/></svg>`,
  "2b50": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFAC33" d="M18 2l4.9 10.1 11.1 1.6-8 7.8 1.9 11.1L18 27.3l-9.9 5.3L10 21.5l-8-7.8 11.1-1.6z"/></svg>`,
  "2728": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFAC33" d="M19 2l3.2 9.8L32 15l-9.8 3.2L19 28l-3.2-9.8L6 15l9.8-3.2z"/><path fill="#FFCC4D" d="M8 23l1.5 4.5L14 29l-4.5 1.5L8 35l-1.5-4.5L2 29l4.5-1.5z"/></svg>`,
  "1f319": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFCC4D" d="M23 32c-8.3 0-15-6.7-15-15 0-6.5 4.1-12 9.9-14.1C16.6 2.3 15.3 2 14 2 6.8 2 1 7.8 1 15s5.8 13 13 13c5.6 0 10.4-3.5 12.2-8.5-1 .3-2.1.5-3.2.5z"/></svg>`,
  "1f355": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFCC4D" d="M18 3L4 31c9 3 19 3 28 0L18 3z"/><path fill="#F4900C" d="M4 31c9 3 19 3 28 0l-1.5-3c-8 2.5-17 2.5-25 0L4 31z"/><circle fill="#DD2E44" cx="18" cy="15" r="2.5"/><circle fill="#DD2E44" cx="14" cy="23" r="2.5"/><circle fill="#DD2E44" cx="22" cy="22" r="2.5"/></svg>`,
  "2615": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#CCD6DD" d="M6 14h20v11c0 5-4 9-9 9h-2c-5 0-9-4-9-9V14z"/><path fill="none" stroke="#CCD6DD" stroke-width="3" d="M26 17h3c2.2 0 4 1.8 4 4s-1.8 4-4 4h-3"/><ellipse fill="#664500" cx="16" cy="14" rx="10" ry="2.5"/></svg>`,
  "1f3ae": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#292F33" d="M28 11H8c-3.3 0-6 2.7-6 6l-1 8c-.4 3 2 5 4.8 4l5.2-2h14l5.2 2c2.8 1 5.2-1 4.8-4l-1-8c0-3.3-2.7-6-6-6z"/><path fill="#CCD6DD" d="M9 16h2v6H9zm-2 2h6v2H7z"/><circle fill="#DD2E44" cx="26" cy="17" r="1.6"/><circle fill="#55ACEE" cx="23" cy="20" r="1.6"/></svg>`,
  "1f389": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFAC33" d="M4 32l8-20 12 12z"/><circle fill="#DD2E44" cx="24" cy="8" r="2"/><circle fill="#55ACEE" cx="30" cy="14" r="2"/><circle fill="#77B255" cx="18" cy="6" r="2"/></svg>`,
  "1f512": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="none" stroke="#AAB8C2" stroke-width="4" d="M11 16v-5c0-3.9 3.1-7 7-7s7 3.1 7 7v5"/><rect fill="#FFAC33" x="6" y="15" width="24" height="19" rx="4"/><circle fill="#664500" cx="18" cy="23" r="2.5"/></svg>`,
  "1f680": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#DD2E44" d="M6 26l4-6 6 6-6 4z"/><path fill="#E1E8ED" d="M32 4C22 4 13 11 9 21l6 6c10-4 17-13 17-23z"/><circle fill="#55ACEE" cx="22" cy="14" r="3.5"/></svg>`,
  "2764": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#DD2E44" d="M35.9 11.8c0-5.4-4.4-9.9-9.9-9.9-3.3 0-6.2 1.6-8 4.1-1.8-2.5-4.7-4.1-8-4.1-5.5 0-9.9 4.4-9.9 9.9 0 .8.1 1.5.3 2.2C1.8 22.6 11.2 31.6 18 34c6.8-2.5 16.2-11.4 17.6-20 .2-.7.3-1.4.3-2.2z"/></svg>`,
  "1f49a": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#77B255" d="M35.9 11.8c0-5.4-4.4-9.9-9.9-9.9-3.3 0-6.2 1.6-8 4.1-1.8-2.5-4.7-4.1-8-4.1-5.5 0-9.9 4.4-9.9 9.9 0 .8.1 1.5.3 2.2C1.8 22.6 11.2 31.6 18 34c6.8-2.5 16.2-11.4 17.6-20 .2-.7.3-1.4.3-2.2z"/></svg>`,
  "1f4af": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><text x="2" y="24" font-family="sans-serif" font-weight="900" font-size="18" fill="#DD2E44">100</text><path fill="none" stroke="#DD2E44" stroke-width="2.5" stroke-linecap="round" d="M4 29h28M6 33h24"/></svg>`,
  "26a1": `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><path fill="#FFAC33" d="M22 2L7 20h10l-3 14 15-18H19z"/></svg>`,
};

const ALL_INLINE_SVGS: Record<string, string> = {
  ...INLINE_TWEMOJI_SVGS,
  ...EXTRA_TWEMOJI_SVGS,
};

export function emojiToTwemojiHex(emoji: string): string {
  const found = TWEMOJI_CATALOG.find((e) => e.char === emoji);
  if (found) return found.hex;

  const cps: string[] = [];
  for (const sym of Array.from(emoji)) {
    const cp = sym.codePointAt(0);
    if (!cp) continue;
    if (cp === 0xfe0f && !emoji.includes("\u200d")) continue;
    cps.push(cp.toString(16).toLowerCase());
  }
  return cps.join("-");
}

export function TwemojiImg({
  emoji,
  hexOverride,
  className = "w-6 h-6 inline-block",
}: {
  emoji: string;
  hexOverride?: string;
  className?: string;
}) {
  const baseHex = (hexOverride || emojiToTwemojiHex(emoji)).split("-").at(0) || "1f600";
  const svgMarkup =
    ALL_INLINE_SVGS[baseHex] ||
    `<svg xmlns="http://w3.org" viewBox="0 0 36 36"><circle fill="#FFCC4D" cx="18" cy="18" r="18"/><circle fill="#664500" cx="12" cy="14" r="2.5"/><circle fill="#664500" cx="24" cy="14" r="2.5"/><path fill="none" stroke="#664500" stroke-width="2.5" stroke-linecap="round" d="M11 22c2 3.5 12 3.5 14 0"/></svg>`;

  const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;

  return (
    <img
      src={dataUri}
      alt={emoji}
      draggable={false}
      className={className}
    />
  );
}

export function TwemojiMessageText({ text }: { text: string }) {
  const parts = text.split(
    /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)/gu
  );

  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (/\p{Extended_Pictographic}/u.test(part)) {
          return (
            <TwemojiImg
              key={idx}
              emoji={part}
              className="inline-block w-5 h-5 align-[-0.25em] mx-0.5 select-all"
            />
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}
const SKIN_TONES = [
  { id: "default", label: "Default", hexMod: "", charMod: "", swatch: "#facc15" },
  { id: "light", label: "Light", hexMod: "-1f3fb", charMod: "\u{1F3FB}", swatch: "#f7d7c4" },
  { id: "med-light", label: "Medium-Light", hexMod: "-1f3fc", charMod: "\u{1F3FC}", swatch: "#d8b094" },
  { id: "medium", label: "Medium", hexMod: "-1f3fd", charMod: "\u{1F3FD}", swatch: "#bb9167" },
  { id: "med-dark", label: "Medium-Dark", hexMod: "-1f3fe", charMod: "\u{1F3FE}", swatch: "#8e562e" },
  { id: "dark", label: "Dark", hexMod: "-1f3ff", charMod: "\u{1F3FF}", swatch: "#5a3825" },
];

export function TwemojiPicker({
  onSelectEmoji,
  onClose,
}: {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Smileys");
  const [skinIdx, setSkinIdx] = useState(0);
  const [hovered, setHovered] = useState<TwemojiEntry | null>(null);
  const [recent, setRecent] = useState<string[]>([
    "🌿",
    "😂",
    "🔥",
    "👍",
    "💚",
    "💀",
    "👀",
    "🥳",
  ]);

  const tone = SKIN_TONES.at(skinIdx) || SKIN_TONES.at(0)!;

  const resolveChar = (item: TwemojiEntry) =>
    item.skinTones && tone.charMod
      ? `${item.char.replace(/\uFE0F/g, "")}${tone.charMod}`
      : item.char;

  const resolveHex = (item: TwemojiEntry) =>
    item.skinTones && tone.hexMod ? `${item.hex}${tone.hexMod}` : item.hex;

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^:|:$/g, "");
    if (q) {
      return TWEMOJI_CATALOG.filter(
        (e) => e.name.includes(q) || e.shortcode.includes(q)
      );
    }
    if (activeCat === "Recent") {
      return recent.map((ch) => {
        const match = TWEMOJI_CATALOG.find((e) => e.char === ch);
        return (
          match || {
            char: ch,
            hex: emojiToTwemojiHex(ch),
            name: "recent",
            shortcode: "recent",
            cat: "Smileys" as const,
          }
        );
      });
    }
    return TWEMOJI_CATALOG.filter((e) => e.cat === activeCat);
  }, [query, activeCat, recent]);

  const navCats = [
    { id: "Recent", icon: <Clock className="w-4 h-4" /> },
    { id: "Smileys", icon: <Smile className="w-4 h-4" /> },
    { id: "People", icon: <Hand className="w-4 h-4" /> },
    { id: "Nature", icon: <Leaf className="w-4 h-4" /> },
    { id: "Food", icon: <Pizza className="w-4 h-4" /> },
    { id: "Activities", icon: <Gamepad2 className="w-4 h-4" /> },
    { id: "Objects", icon: <Lightbulb className="w-4 h-4" /> },
    { id: "Symbols", icon: <Hash className="w-4 h-4" /> },
  ];

  return (
    <div className="w-80 sm:w-96 rounded-2xl bg-[#081914] border border-emerald-500/25 shadow-2xl overflow-hidden text-emerald-50 flex flex-col">
      <div className="p-2.5 bg-[#061410] border-b border-emerald-500/15 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-emerald-400/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hovered ? `:${hovered.shortcode}:` : "Search Twemoji..."}
            autoFocus
            className="w-full pl-8 pr-6 py-1.5 rounded-lg bg-[#0d261e] border border-emerald-500/25 text-xs text-emerald-50 placeholder:text-emerald-300/45 focus:outline-none focus:border-emerald-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-300/60 hover:text-emerald-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-[#0d261e] px-1.5 py-1 rounded-lg border border-emerald-500/20">
          {SKIN_TONES.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSkinIdx(idx)}
              title={st.label}
              style={{ backgroundColor: st.swatch }}
              className={`w-3 h-3 rounded-full transition cursor-pointer ${
                skinIdx === idx
                  ? "ring-2 ring-white scale-110"
                  : "opacity-75 hover:opacity-100"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-emerald-300/60 hover:text-emerald-50 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex h-60">
        <div className="w-10 bg-[#05110d] border-r border-emerald-500/15 py-2 flex flex-col items-center gap-1 shrink-0">
          {navCats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCat(c.id);
              }}
              title={c.id}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                activeCat === c.id && !query
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-300/65 hover:text-emerald-50 hover:bg-emerald-500/15"
              }`}
            >
              {c.icon}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-7 gap-1 content-start">
          {visibleItems.map((item, idx) => {
            const ch = resolveChar(item);
            const hx = resolveHex(item);
            return (
              <button
                key={`${item.shortcode}-${idx}`}
                type="button"
                onMouseEnter={() => setHovered(item)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  onSelectEmoji(ch);
                  setRecent((prev) =>
                    [ch, ...prev.filter((x) => x !== ch)].slice(0, 21)
                  );
                }}
                className="p-1.5 rounded-lg hover:bg-emerald-500/20 hover:scale-110 transition cursor-pointer flex items-center justify-center"
              >
                <TwemojiImg
                  emoji={ch}
                  hexOverride={hx}
                  className="w-6 h-6 pointer-events-none"
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 py-1.5 bg-[#04120e] border-t border-emerald-500/15 flex items-center justify-between text-[11px] text-emerald-300/80">
        {hovered ? (
          <div className="flex items-center gap-2">
            <TwemojiImg
              emoji={resolveChar(hovered)}
              hexOverride={resolveHex(hovered)}
              className="w-5 h-5"
            />
            <span className="font-mono font-bold text-emerald-200">
              :{hovered.shortcode}:
            </span>
          </div>
        ) : (
          <span className="text-emerald-400/70">Offline Inline Twemoji Vector Set</span>
        )}
      </div>
    </div>
  );
}

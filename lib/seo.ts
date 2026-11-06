import { CATS, STATES } from "./constants";
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const slug = (s: string) => s.toLowerCase().replace(/&/g, "").replace(/[()]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
export const catFromSlug = (x: string) => CATS.find((c) => slug(c) === x);
export const stateFromSlug = (x: string) => STATES.find((s) => slug(s) === x);
export const CAT_SEO: Record<string, { noun: string; intro: string }> = {
  Vehicles: { noun: "cars, trucks and motorcycles", intro: "Find new, foreign-used (tokunbo) and Nigerian-used cars, trucks, buses and motorcycles from sellers across Nigeria. Compare prices, chat with the seller and pay safely with the Mifask wallet." },
  Property: { noun: "houses, flats and land", intro: "Browse houses, flats, apartments and plots of land to rent or buy. Contact owners and agents directly and meet only after you have inspected the property." },
  "Phones & Tablets": { noun: "phones and tablets", intro: "Buy and sell iPhones, Samsung, Tecno, Infinix and other phones and tablets, new or used. Check the price, chat with the seller and inspect before you pay." },
  Electronics: { noun: "laptops, TVs and electronics", intro: "Laptops, TVs, game consoles, cameras and other electronics from verified sellers. Compare prices and pay from your wallet so your money is held until you confirm." },
  Fashion: { noun: "clothes, shoes and bags", intro: "Shop clothes, shoes, bags and accessories, or sell your own. Ankara, native wear, sneakers and more from sellers near you." },
  "Home & Garden": { noun: "furniture and home items", intro: "Sofas, beds, generators, fridges and other home items. Buy locally and save on delivery." },
  Services: { noun: "services and artisans", intro: "Find plumbers, electricians, cleaners, mechanics, tutors and other service providers. Agree the price and scope in writing before work starts." },
  Animals: { noun: "pets and animals", intro: "Puppies, cats, birds and other pets from sellers across Nigeria. Meet the animal and check its health before you pay." },
  Jobs: { noun: "jobs and vacancies", intro: "Job vacancies and work opportunities posted by employers. A real employer never asks you to pay to get a job." },
};

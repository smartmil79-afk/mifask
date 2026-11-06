import { notFound } from "next/navigation";
import CategoryPage, { categoryMetadata } from "@/components/CategoryPage";
import { catFromSlug, stateFromSlug } from "@/lib/seo";
export const revalidate = 300;
export async function generateMetadata({ params }: { params: { cat: string; state: string } }) { const cat = catFromSlug(params.cat), st = stateFromSlug(params.state); return cat && st ? categoryMetadata(cat, st) : {}; }
export default async function Page({ params }: { params: { cat: string; state: string } }) { const cat = catFromSlug(params.cat), st = stateFromSlug(params.state); if (!cat || !st) notFound(); return <CategoryPage cat={cat} state={st} />; }

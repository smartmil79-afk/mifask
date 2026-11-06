import { notFound } from "next/navigation";
import CategoryPage, { categoryMetadata } from "@/components/CategoryPage";
import { catFromSlug } from "@/lib/seo";
export const revalidate = 300;
export async function generateMetadata({ params }: { params: { cat: string } }) { const cat = catFromSlug(params.cat); return cat ? categoryMetadata(cat) : {}; }
export default async function Page({ params }: { params: { cat: string } }) { const cat = catFromSlug(params.cat); if (!cat) notFound(); return <CategoryPage cat={cat} />; }

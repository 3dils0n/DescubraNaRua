import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function parsePagination(searchParams: URLSearchParams): { skip: number; take: number; page: number } {
  const p = paginationSchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
  const page = p.success ? p.data.page : 1;
  const pageSize = p.success ? p.data.pageSize : 20;
  return { skip: (page - 1) * pageSize, take: pageSize, page };
}

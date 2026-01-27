import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Product, Category } from '@/types';

const API_TARGET = process.env.NEXT_PUBLIC_API_TARGET || 'local';

function coerceHttps(url: string | undefined): string | undefined {
    if (!url) return url;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
        return `https://${url.slice('http://'.length)}`;
    }
    return url;
}

function pickByTarget(local?: string, docker?: string, prod?: string, fallback?: string) {
    if (API_TARGET === 'prod') {
        return prod || docker || local || fallback;
    }
    if (API_TARGET === 'docker') {
        return docker || local || prod || fallback;
    }
    return local || docker || prod || fallback;
}

const BASE_URL =
    coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL) ||
    coerceHttps(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    pickByTarget(
        coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL_LOCAL),
        coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL_DOCKER),
        coerceHttps(process.env.NEXT_PUBLIC_SHOP_API_BASE_URL_PROD),
        'https://localhost:3000/api',
    );

export const productsApi = createApi({
    reducerPath: 'productsApi',
    baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
    endpoints: (builder) => ({
        getCategories: builder.query<Category[], void>({
            query: () => '/categories',
        }),
        getProducts: builder.query<Product[], string | void>({
            query: (category) => {
                if (category && category !== 'ALL') {
                    return `/products?category=${category}`;
                }
                return '/products';
            },
        }),
        getProduct: builder.query<Product, string>({
            query: (id) => `/products/${id}`,
        }),
    }),
});

export const { useGetCategoriesQuery, useGetProductsQuery, useGetProductQuery } = productsApi;

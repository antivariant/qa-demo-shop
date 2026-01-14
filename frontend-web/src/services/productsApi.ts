import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export const productsApi = createApi({
    reducerPath: 'productsApi',
    baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
    endpoints: (builder) => ({
        getCategories: builder.query<string[], void>({
            query: () => '/categories',
        }),
        getProducts: builder.query<any[], string | void>({
            query: (category) => {
                if (category && category !== 'ALL') {
                    return `/products?category=${category}`;
                }
                return '/products';
            },
        }),
        getProduct: builder.query<any, string>({
            query: (id) => `/products/${id}`,
        }),
    }),
});

export const { useGetCategoriesQuery, useGetProductsQuery, useGetProductQuery } = productsApi;

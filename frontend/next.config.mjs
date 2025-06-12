/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    images:{
        domains:[
            "jyquznoodnlreg99.public.blob.vercel-storage.com",
            "example.com",
            "localhost",
            "app.tinnoh.me",
        ]
    }
};

export default nextConfig;

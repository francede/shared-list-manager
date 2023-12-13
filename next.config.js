/** @type {import('next').NextConfig} */
const nextConfig = {
    generateBuildId: async () => {
        return "1";
    },
    redirects: async () => {
        return [
            {
                source: '/',
                destination: '/lists',
                permanent: true
            }
        ]
    }
}

module.exports = nextConfig

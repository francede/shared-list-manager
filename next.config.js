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
    },
    webpack: (config) => {
        config.resolve.fallback = {
          "mongodb-client-encryption": false ,
          "aws4": false
        };
    
        return config;
      }
}

module.exports = nextConfig

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Exclude Tesseract.js from webpack bundling for server-side
    // Tesseract.js is browser-focused and causes build issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'tesseract.js': 'commonjs tesseract.js',
        'tesseract.js-core': 'commonjs tesseract.js-core',
      });
      
      // Ignore the .asm file require that doesn't exist (legacy fallback)
      // WebAssembly is available in Node.js, so this path won't be taken
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /tesseract-core\.asm$/,
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;

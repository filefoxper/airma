const BundleAnalyzerPlugin =
    require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const config = require('./webpack.config.js');

module.exports = function analyze(){
    const data = config();
    return {
        ...data,
        plugins: [
            ...(data.plugins||[]),
            new BundleAnalyzerPlugin()
        ]
    }
}

// Find the full example of all available configuration options at
// https://github.com/muenzpraeger/create-lwc-app/blob/main/packages/lwc-services/example/lwc-services.config.js
const srcFolder = 'src/client';
const buildFolder = './dist';

module.exports = {
    resources: [
        {
            from: 'node_modules/@salesforce-ux/design-system/assets',
            to: `${srcFolder}/resources/assets`
        },
        {
            from: 'src/client/resources', to: 'dist/resources/'
        },
        ],
        buildDir: `${buildFolder}`,
        sourceDir: './src/client',

        devServer: {
            proxy: { '/': 'http://localhost:5000' }
        }
        
};

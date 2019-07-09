module.exports = {
    norpc: true,
    copyPackages: ['@aragon/os', '@aragon/apps-shared-minime'],
    skipFiles: [
        'test',
        '@aragon/os',
        '@aragon/apps-shared-minime/contracts/MiniMeToken.sol'
    ]
}

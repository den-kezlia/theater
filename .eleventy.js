module.exports = function(config) {
    config.addPassthroughCopy('src/**/*.(gif|jpg|png|svg)');

    return {
        dir: {
            input: 'src',
            output: '_site',
        }
    }
};
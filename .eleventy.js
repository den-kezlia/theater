module.exports = function(config) {
    config.addPassthroughCopy('src/**/*.(gif|jpg|png|svg|mp4)');

    return {
        dir: {
            input: 'src',
            output: '_site',
        }
    }
};
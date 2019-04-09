module.exports = function(request, response, next) {
    var start = +new Date();
    var url = request.url;
    var method = request.method;

    response.on('finish', function() {
        var duration = +new Date() - start;
        var message = method + ' to ' + url + '\ntook ' + duration + ' ms \n';
        console.log (message);
    });
    next();
}

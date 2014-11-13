var TOKEN_LENGTH = 32;
 
exports.createToken = function(callback) {
    crypto.randomBytes(TOKEN_LENGTH, function(ex, token) {
        if (ex) callback(ex);
 
        if (token) callback(null, token.toString('hex'));
        else callback(new Error('Problem when generating token'));
    });
};

exports.setTokenWithData = function(token, data, ttl, callback) {
    if (token == null) throw new Error('Token is null');
    if (data != null && typeof data !== 'object') throw new Error('data is not an Object');
 
    var userData = data || {};
    userData._ts = new Date();
 
    var timeToLive = ttl || auth.TIME_TO_LIVE;
    if (timeToLive != null && typeof timeToLive !== 'number') throw new Error('TimeToLive is not a Number');
 
    redisClient.set(token, JSON.stringify(userData), function(err, reply) {
        if (err) callback(err);
 
        if (reply) {
            redisClient.expire(token, timeToLive, function(err, reply) {
                if (err) callback(err);
 
                if (reply) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Expiration not set on redis'));
                }
            });
        }
        else {
            callback(new Error('Token not set in redis'));
        }
    });
 
};

exports.verify = function(req, res, next) {
    var headers = req.headers;
    if (headers == null) return res.send(401);
 
    // Get token
    try {
        var token = tokenHelper.extractTokenFromHeader(headers);
    } catch (err) {
        console.log(err);
        return res.send(401);
    }
 
    //Verify it in redis, set data in req._user
    redisHelper.getDataByToken(token, function(err, data) {
        if (err) return res.send(401);
 
        req._user = data;
 
        next();
    });
};
 
exports.extractTokenFromHeader = function(headers) {
    if (headers == null) throw new Error('Header is null');
    if (headers.authorization == null) throw new Error('Authorization header is null');
 
    var authorization = headers.authorization;
    var authArr = authorization.split(' ');
    if (authArr.length != 2) throw new Error('Authorization header value is not of length 2');
 
    // retrieve token
    var token = authArr[1];
    if (token.length != TOKEN_LENGTH * 2) throw new Error('Token length is not the expected one');
 
    return token;
};
 
exports.getDataByToken = function(token, callback) {
    if (token == null) callback(new Error('Token is null'));
 
    redisClient.get(token, function(err, userData) {
        if (err) callback(err);
 
        if (userData != null) callback(null, JSON.parse(userData));
        else callback(new Error('Token Not Found'));
    });
};
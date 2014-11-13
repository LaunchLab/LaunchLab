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
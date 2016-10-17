var unirest = require('unirest');
var express = require('express');
var events = require('events');
var app = express();
app.use(express.static('public'));

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                    console.log(response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var getRelated = function(endpoint, artistId) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/artists' + artistId + '/related-artists')
            .qs(artistId)
            .end(function(response){
                if (response.ok) {
                    emitter.emit('end', response.body);
                    console.log(response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};




app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        var artist = item.artists.items[0];
        var artistId = artist.id;
        
        var relatedReq = getFromApi('artists/' + artistId + '/related-artists');
        relatedReq.on('end', function(relItem){
            artist.related = relItem.artists;
        var p = [];
        artist.related.forEach(function(art){
            p.push(new Promise(function(resolve, reject){
                var tracksReq = getFromApi('artists/' + art.id + '/top-tracks', {'country':'us'});
                tracksReq.on('end', function(topTracks){
                    art.tracks = topTracks.tracks;
                    console.log(art.tracks);
                    resolve();
                });
                tracksReq.on('error', function(code){
                        reject();
                    });
                 }));
            
        });
            Promise.all(p).then(function(){
                res.json(artist);
            });
        });
        
        relatedReq.on('error', function(code){
            res.sendStatus(code);
        });
    });
    
    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
    
    
});


app.listen(process.env.PORT || 8080);
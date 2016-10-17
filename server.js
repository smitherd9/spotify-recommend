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
                    //  var artist = response.body.artists.items[0];
                    console.log(response.body);
                    //  unirest.get('https://api.spotify.com/v1/artists' + artist.id + '/related-artists');
                    // unirest.get('https://api.spotify.com/v1/artists' + artist.id + '/related-artists');
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var getRelated = function(endpoint, artistId) {
    var emitter = new events.EventEmitter();
    // var artist = response.body;
    unirest.get('https://api.spotify.com/v1/artists' + artistId + '/related-artists')
            .qs(artistId)
            .end(function(response){
                if (response.ok) {
                    emitter.emit('end', response.body);
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
        var artistId = item.artists.id;
        res.json(artist);
        getRelated('/artists/', artistId);
        unirest.get('https://api.spotify.com/v1/artists' + artistId + '/related-artists');
        
    });
    
    // searchReq.on('end', function(item) {
    //     var artist = item.artists.items[0];
    //     var artistId = item.artists.id;
    //     res.json(artist);
    //     getRelated('/artists/', {
    //         q: artistId,
    //         limit: 5,
    //         type: 'artist'
    //     });
    //     unirest.get('https://api.spotify.com/v1/artists' + artistId + '/related-artists');
        
    // });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
    
    // app.get('/artists/', function(req, res){
    // var searchReq = getRelated('artists/:id/related-artists', {
    //     q: req.params.id,
    //     limit: 5,
    //     type: 'artist'
    // });
});



// app.get('/artists/:id', function(req, res){
//     var searchReq = getRelated('artists/:id/related-artists', {
//         q: req.params.id,
//         limit: 5,
//         type: 'artist'
//     });
    
    // searchReq.on('end', function(item) {
    //     var artist = item.artists.items;
    //     res.json(artist);
    // });

    // searchReq.on('error', function(code) {
    //     res.sendStatus(code);
    // });
// });



app.listen(process.env.PORT || 8080);
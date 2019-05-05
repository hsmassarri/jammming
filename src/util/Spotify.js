const clientId = 'e636f4fb88044998b7ec407c8a4a0c0b';
const redirectUri = 'https://riffthrone.surge.sh';
const spotifyUrl = `https://accounts.spotify.com/authorize?response_type=token&scope=playlist-modify-public&client_id=${clientId}&redirect_uri=${redirectUri}`;

let userToken;

const Spotify = {

  getAccessToken() {
      if(userToken) {
        return userToken;
      }
      const hasAccessToken = window.location.href.match(/access_token=([^&]*)/);
      const hasExpiresIn = window.location.href.match(/expires_in=([^&]*)/);

      if(hasAccessToken && hasExpiresIn) {
        userToken = hasAccessToken[1];
        const expiresIn = Number(hasExpiresIn[1]);
        window.setTimeout( () => userToken = '', expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
        return userToken;
      }
      else {
        const accessUrl = spotifyUrl;
        window.location = accessUrl;
      }
  },





  //Uses access token to return a response from the Spotify API user the search term from the SearchBar
  search(term) {
    const accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(
      response => {
        if (response.ok) {
          return response.json();
        }
        else {
          console.log('API request fail');
        }
      }).then(
          jsonResponse => {
            if(!jsonResponse.tracks) {
              return [];
            }
            return jsonResponse.tracks.items.map(track => ({
              id: track.id,
              name: track.name,
              artist: track.artists[0].name,
              album: track.album.name,
              uri: track.uri,
            }));
      });
    },





    //Gets users ID from Spotify, creates a new playlist on user account, add tracks to that playListTracks
    savePlaylist(playlistName, trackURIs) {
      if (!playlistName || !trackURIs.length) {
        return;
      }


      const accessToken = Spotify.getAccessToken();
      const headers = {
        Authorization: `Bearer ${accessToken}`
      };

      let userId;

      //Return user ID from SPOTIFY
      return fetch('https://api.spotify.com/v1/me', {
        headers: headers
      }).then(response => {
        if(response.ok) {
          return response.json();
        }
      }).then(
        jsonResponse => {
          userId = jsonResponse.id;

          //Add playlist to user accounts
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({name: playlistName})
          }).then(
              response => {
                if(response.ok) {
                  return response.json();
                }
                else {
                  console.log('API request fail');
                }
          }).then(
              jsonResponse => {
                const playlistId = jsonResponse.id;

                //Add track to NEW playlist
                return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
                  headers: headers,
                  method: 'POST',
                  body: JSON.stringify({uris: trackURIs})
                });
            });
      });
    }
}

export default Spotify;

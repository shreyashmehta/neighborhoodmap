var map;
//create a new blank array for all the lisitngs in the marker
var markers = [];

var locations = [{
        title: 'Novotel',
        location: {
            lat: 18.558765,
            lng: 73.911247
        }
    },
    {
        title: 'Inorbit Mall',
        location: {
            lat: 18.560745,
            lng: 73.920735
        }
    },
    {
        title: 'Phoenix MarketCity',
        location: {
            lat: 18.561958,
            lng: 73.916926
        }
    },
    {
        title: 'Pune Airport',
        location: {
            lat: 18.579309,
            lng: 73.908885
        }
    },
    {
        title: 'Hyatt Hotel',
        location: {
            lat: 18.555317,
            lng: 73.90503
        }
    },
    {
        title: 'Four Points, By Sheraton',
        location: {
            lat: 18.564032,
            lng: 73.923708
        }
    },
    {
        title: 'Sheraton Grand',
        location: {
            lat: 18.530098,
            lng: 73.862631
        }
    },
    {
        title: 'JW Mariott',
        location: {
            lat: 18.533481,
            lng: 73.831436
        }
    },
    {
        title: 'The Westin',
        location: {
            lat: 18.540722,
            lng: 73.901816
        }
    },
    {
        title: 'The O Hotel',
        location: {
            lat: 18.542253,
            lng: 73.888109
        }
    },
    {
        title: 'Conrad',
        location: {
            lat: 18.536456,
            lng: 73.884423
        }
    },
    {
        title: 'Sun-n-Sand Hotel',
        location: {
            lat: 18.539509,
            lng: 73.882974
        }
    },
    {
        title: 'The Central Park Hotel',
        location: {
            lat: 18.528954,
            lng: 73.879627
        }
    },
    {
        title: 'Vivanta - By Taj',
        location: {
            lat: 18.537955,
            lng: 73.887284
        }
    },
    {
        title: 'Keys-Prisma Hotel Parc Estique',
        location: {
            lat: 18.564033,
            lng: 73.920909
        }
    }
];

function googleError() {
    alert("Google Maps not responding");
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 18.52043,
            lng: 73.856744
        },
        zoom: 13
    });

    var largeInfoWindow = new google.maps.InfoWindow();
    var locationsLength = locations.length;

    for (var i = 0; i < locationsLength ; i++) {
        //get the position and title from the array locations
        var position = locations[i].location;
        var title = locations[i].title;
        //create a new marker for each arry item
        var marker = new google.maps.Marker({
            position: position,
            title: title,
            id: i,
            map: map,
            animation: google.maps.Animation.DROP
        });
        //push the created marker into the markers array
        markers.push(marker);
        //create an onClick event to open a new InfoWindow at each marker
        //and also set the animation on the clicked marker
        marker.addListener('click', function() {
            var self = this;
            self.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                self.setAnimation(null); 
            }, 2100);
            populateInfoWindow(self, largeInfoWindow);
        });
        locations[i].marker = marker;
        wikiLink(locations[i]);
    }
    function wikiLink(location) {
        location.url = '';
        var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + title + '&format=json&callback=wikiCallback';

        //If you cant get a wiki request, throw an error message.
        var wikiError = setTimeout(function() {
          location.url = 'Unable to find the request';
          alert('Unable to find the request');
        }, 4000);

        $.ajax({
          url: wikiUrl,
          dataType: "jsonp",
          jsonp: "callback",
          success: function(response) {
            var url = response[3][0];
            location.marker.wikiurl = url;
            clearTimeout(wikiError);
          }
        });
    }
}

function populateInfoWindow(marker, infoWindow) {
    if (infoWindow.marker != marker) {
        infoWindow.setContent('');
        infoWindow.marker = marker;

        infoWindow.addListener('closeclick', function() {
            infoWindow.marker = null;
        });

        //this service needs to get the panaroma image based on the closest marker location
        //and it needs to find out which way to point out the camera
        //and the heading and the pitch	
        var streetViewService = new google.maps.StreetViewService();
        //it's going to look within the radius of 50m
        var radius = 50;

        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                //in order to make sure we are looking at our image from the nearest street location 
                //we use computeHeading function
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infoWindow.setContent('<div>' + marker.title + '</div><div id="pano"></div><div><a href=' +marker.wikiurl+'>More Info</a></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
            } else {
                infoWindow.setContent('<div>' + marker.title + '</div>' + '<div>No Street View Found</div><div><a href=' +marker.wikiurl+'>More Info</a></div>');
            }
        }

        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infoWindow.open(map, marker);
    }
}

function ViewModel(markers) {
    var self = this;
    self.filter = ko.observable('');
    self.items = ko.observableArray(locations);
    self.filteredItems = ko.computed(function() {
        var filter = self.filter().toLowerCase();

        self.items().forEach(function(item) {
            if (item.marker) {
                item.marker.setVisible(true);
                item.marker.setAnimation(null);
            }
        });

        if (!filter) {
            return self.items();
        } else {
            return ko.utils.arrayFilter(self.items(), function(id) {
                var match = stringStartsWith(id.title.toLowerCase(), filter);
                id.marker.setVisible(match);
                return match;
            });
        }
    });

    var stringStartsWith = function(string, startsWith) {
        string = string || "";
        if (startsWith.length > string.length) {
            return false;
        }
        return string.substring(0, startsWith.length) === startsWith;
    };

    this.showInfoWindow = function(marker) {
        google.maps.event.trigger(marker.marker, 'click');
    };
}
ko.applyBindings(new ViewModel());

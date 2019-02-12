import React, { Component } from 'react';
import {
  Card,
  CardText,
  CardBody,
  CardTitle,
  Button,
  Input,
  Table,
} from 'reactstrap';
import './App.css';
import { getPlacesAndUpdateListings } from './api/getPlacesAndUpdateListings';
import { getCurrentLocation } from './api/getCurrentLocation';

/* global google */

// To do:
// complete code for when user doesn't select current location
// have box open when clicking marker with details and photo?. Also highlight relevant text in card
// Misc: sort rating results, incorporate number of reviews into order, say if no results so know it's working, format tables so columns are aligned, set max number of results
// format places: location, snippet, (photo?)
// add search text box to search for place to act as new center
// return highly-rated, kid friendly cafes and show markers on map
// return highly-rated playgrounds / playcentres / parks for kids and show markers on map
// Add user-journey:
//  - enter ages of children
//  - enter date/time (check weather)
//  - how close should it be (based on driving time at the date/time specified, walking time) OR where should it be
//  - suggest indoor/outdoor but give option to change
//  - list of highest rated (create method for this), open, relevant activities shown, pref with snippet/photo to explain what it is
//  - include numbered markers on map
//  - include coffee, lunch and dinner recommendations as appropriate
//  - STRETCH: ability to decline individual recommendations, which then get replaced by another
//  - ability to click on acitivty to be taken to website or detailed Google Maps listing for it
// Redesign for mobile
// Host on server
// Produce Back-end to save user searches

function loadJS(src) {
  var ref = window.document.getElementsByTagName('script')[0];
  var script = window.document.createElement('script');
  script.src = src;
  script.async = true;
  ref.parentNode.insertBefore(script, ref);
}

const CardTable = ({ cardId, cardText, tableId, placeResultsArray }) => (
  <Card id={cardId}>
    <CardBody>
      <CardText>
        <h3>{cardText}</h3>
      </CardText>
      {placeResultsArray && (
        <ResultsTable id={tableId} placeResultsArray={placeResultsArray} />
      )}
    </CardBody>
  </Card>
);

const ResultsTable = ({ placeResultsArray }) => (
  <Table borderless>
    <thead>
      <tr>
        <th>Label</th>
        <th>Place name</th>
        <th>Rating / 5</th>
      </tr>
    </thead>
    <tbody>
      {placeResultsArray.map(place => (
        <tr>
          <th scope="row">{place.label}</th>
          <td>
            <a target="_blank" rel="noopener noreferrer" href={place.url}>
              {place.name}
            </a>
          </td>
          <td>{place.rating}</td>
        </tr>
      ))}
    </tbody>
  </Table>
);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      center: {
        lat: 53.345806,
        lng: -6.259674,
      },
      map: {},
      markers: [],
      eventDate: null, // Date user wants to do activity
      cafeResults: '', // HTML to be displayed in Table
      kidsActivityResults: '', // HTML to be displayed in Table
      location: null,
      locationTextBoxValue: '',
      locationCoords: null,
    };

    this.initMap = this.initMap.bind(this);
    this.updateListings = this.updateListings.bind(this);
  }

  componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    loadJS(
      'https://maps.googleapis.com/maps/api/js?key=AIzaSyBoKmshPxsNC3n5M88_BKq2I_IJgiVx47g&libraries=places&callback=initMap',
    );
  }

  initMap() {
    const zoom = 3; // 13
    let map = {};

    let mapConfig = {
      center: {
        lat: 53.345806,
        lng: -6.259674,
      },
      zoom,
    };
    map = new google.maps.Map(this.mapElement, mapConfig);
    map.addListener('dragend', () => this.updateListings());

    this.setState({
      map: map,
      center: {
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      },
    });
  }

  async updateListings() {
    let placeMarkersArray, placeLabelsAndUrlArray;

    // clear markers
    this.state.markers.forEach(marker => {
      marker.setMap(null);
    });

    this.setState({
      center: {
        lat: this.state.map.getCenter().lat(),
        lng: this.state.map.getCenter().lng(),
      },
      markers: [],
    });
    [
      placeLabelsAndUrlArray,
      placeMarkersArray,
    ] = await getPlacesAndUpdateListings(this.state.map, {
      lat: this.state.map.getCenter().lat(),
      lng: this.state.map.getCenter().lng(),
    });

    this.setState({
      markers: [...placeMarkersArray],
      cafeResults: placeLabelsAndUrlArray.filter(
        element => element.placeType === 'cafe',
      ),
      kidsActivityResults: placeLabelsAndUrlArray.filter(
        element => element.placeType === 'kids activity',
      ),
    });
  }

  dateBtnClicked = evt => {
    this.setState({
      eventDate: evt.target.name,
    });
  };

  locationTextBoxChanged = evt => {
    if (!this.state.autoCompleteAddedToTextBox) {
      this.setState({
        autoCompleteAddedToTextBox: true,
      });
      const input = document.getElementById('locationTextBox');
      this.autocomplete = new google.maps.places.Autocomplete(input);
      this.autocomplete.addListener('place_changed', this.handlePlaceSelect);
    }
    this.setState({
      locationTextBoxValue: evt.target.value,
    });
  };

  handlePlaceSelect = () => {
    // when place selected from dropdown box, add coordinates of selected place to state
    this.setState({
      locationCoords: this.autocomplete.getPlace().geometry.location,
    });
  };

  locationBtnClicked = async evt => {
    const map = this.state.map;
    const centerCoords =
      evt.target.name === 'useCurrentLocation'
        ? await getCurrentLocation()
        : this.state.locationCoords;

    this.setState({
      location: 1,
    });
    map.panTo(centerCoords);
    map.setCenter(centerCoords);
    map.setZoom(13);

    this.updateListings();
  };

  render() {
    return (
      <div id="parent-window">
        <div
          id="map-element"
          ref={mapElement => (this.mapElement = mapElement)}
        />

        <div id="cardtable-container">
          {!this.state.eventDate && (
            <Card id="welcome-card">
              <CardBody>
                <CardTitle>
                  Welcome to <b>Everyone's Happy</b> - the app for finding days
                  out for the kids AND you!
                </CardTitle>
                <CardText>
                  When would you like to do your family activity?
                </CardText>
                <Button
                  className="button"
                  onClick={this.dateBtnClicked}
                  name="today"
                >
                  Today
                </Button>
                <Button
                  className="button"
                  onClick={this.dateBtnClicked}
                  name="tomorrow"
                >
                  Tomorrow
                </Button>
              </CardBody>
            </Card>
          )}

          {this.state.eventDate && !this.state.location && (
            <Card id="welcome-card">
              <CardBody>
                <CardText>Where should it be close to?</CardText>
                <Input
                  type="text"
                  name="location"
                  id="locationTextBox"
                  placeholder=""
                  value={this.state.locationTextBoxValue}
                  onChange={this.locationTextBoxChanged}
                />
                <Button
                  className="button"
                  onClick={this.locationBtnClicked}
                  name="useCurrentLocation"
                >
                  Use current location
                </Button>
                <Button
                  className="button"
                  onClick={this.locationBtnClicked}
                  name="location"
                >
                  Submit
                </Button>
              </CardBody>
            </Card>
          )}

          {this.state.location && (
            <div id="cardTable-container">
              <CardTable
                cardId="cafe-results-card"
                cardText="Cafe Results"
                tableId="cafe-results-table"
                placeResultsArray={this.state.cafeResults}
              />

              <CardTable
                cardId="kids-activity-results-card"
                cardText="Kids Activity Results"
                tableId="kids-activity-results-table"
                placeResultsArray={this.state.kidsActivityResults}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default App;

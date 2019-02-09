import React, { Component } from 'react'
import { Card, CardText, CardBody,
  CardTitle, Button, Input, Table, } from 'reactstrap';
import './App.css'
import { getPlacesAndUpdateListings } from './api/getPlacesAndUpdateListings'

/* global google */

// To do:
// make map full page and make results container float
// complete code for when user doesn't select current location
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
  var ref = window.document.getElementsByTagName("script")[0];
  var script = window.document.createElement("script");
  script.src = src;
  script.async = true;
  ref.parentNode.insertBefore(script, ref);
}

const CardTable = ({ cardId, cardText, tableId, placeResultsArray }) => (
  <Card id={cardId}>
    <CardBody>
      <CardText><h3>{cardText}</h3></CardText>
      {placeResultsArray && <ResultsTable id={tableId} placeResultsArray={placeResultsArray}/>}
    </CardBody>
  </Card>
)

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
      {placeResultsArray.map( place => 
        <tr>
          <th scope="row">{place.label}</th>
          <td><a target="_blank" rel="noopener noreferrer" href={place.url}>{place.name}</a></td>
          <td>{place.rating}</td>
        </tr>
      )}
    </tbody>
  </Table>
)

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      center: {
        lat: 37.774929,
        lng: -122.419416
      },
      map: {},
      markers: [],
      eventDate: null,         // Date user wants to do activity
      cafeResults: '',         // HTML to be displayed in Table
      kidsActivityResults: '', // HTML to be displayed in Table
    }

    this.initMap = this.initMap.bind(this)
    this.getCurrentLocation = this.getCurrentLocation.bind(this)
    this.updateListings = this.updateListings.bind(this)
  }

  componentDidMount() {
    // Connect the initMap() function within this class to the global window context,
    // so Google Maps can invoke it
    window.initMap = this.initMap;
    // Asynchronously load the Google Maps script, passing in the callback reference
    loadJS('https://maps.googleapis.com/maps/api/js?key=AIzaSyBoKmshPxsNC3n5M88_BKq2I_IJgiVx47g&libraries=places&callback=initMap')
  }

  initMap() {
    const zoom = 3 // 13
    let map = {}

    let mapConfig = {
      center: { 
        lat: 53.345806,
        lng: -6.259674,
      },
      zoom
    } 
    map = new google.maps.Map(this.mapElement, mapConfig)
    map.addListener('dragend', () => this.updateListings() )

    this.setState({ 
      map: map,
      center: { 
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng()  
      },
    })
    //.catch((error) => { console.log(error) })
  }

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error('Get User Location error'))
      else {
        return Promise.resolve(navigator.geolocation.getCurrentPosition((position) => {
          let currentCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          this.setState({ center: currentCoordinates })
          console.log('1) getCurrentLocation() complete')
          resolve(currentCoordinates)
        }))
      }
    })
  }

  async updateListings() {
    let placeMarkersArray, placeLabelsAndUrlArray
    
    // clear markers
    this.state.markers.forEach( marker => {
      marker.setMap(null)
    })

    this.setState({ 
      center: { 
        lat: this.state.map.getCenter().lat(),
        lng: this.state.map.getCenter().lng(),
      },
      markers: [],
    })

    ;[ placeLabelsAndUrlArray, placeMarkersArray ] = await getPlacesAndUpdateListings(this.state.map, this.state.center)

    this.setState({
      markers: [...placeMarkersArray],
      cafeResults: placeLabelsAndUrlArray.filter( element => element.placeType === 'cafe'),
      kidsActivityResults: placeLabelsAndUrlArray.filter( element => element.placeType === 'kids activity'),
    })
  }

  dateBtnClicked = (evt) => {
    this.setState({
      eventDate: evt.target.name
    })
  }

  locationBtnClicked = async (evt) => {
    if (evt.target.name === 'useCurrentLocation') {
      const map = this.state.map
      const centerCoords = await this.getCurrentLocation()

      map.setCenter(centerCoords)
      map.setZoom(13)
      this.setState({
        location: 1,
      })
    } else {
      // get coords for place search in google maps and center
    }
    this.updateListings()
  }

  render() {
    return (
      <div id='parent-window'>
        <div id='map-element' ref={ mapElement => (this.mapElement = mapElement) }/>

        { !this.state.eventDate ?
          <Card id='welcome-card'>
            <CardBody>
              <CardTitle>Welcome to <b>Everyone's Happy</b> - the app for finding days out for the kids AND you!</CardTitle>
              <CardText>When would you like to do your family activity?</CardText>
              <Button className="button" onClick={this.dateBtnClicked} name="today">Today</Button>
              <Button className="button" onClick={this.dateBtnClicked} name="tomorrow">Tomorrow</Button>
            </CardBody>
          </Card> : null 
        }

        { this.state.eventDate && !this.state.location ?
          <Card id='welcome-card'>
            <CardBody>
              <CardText>Where should it be close to?</CardText>
              <Input type="text" name="location" id="locationTextBox" placeholder="" />
              <Button className="button" onClick={this.locationBtnClicked} name="useCurrentLocation">Use current location</Button>
              <Button className="button" onClick={this.locationBtnClicked} name="location">Submit</Button>
            </CardBody>
          </Card> : null 
        }

        <div id="cardtable-container">
          <CardTable 
            cardId='cafe-results-card'
            cardText='Cafe Results'
            tableId='cafe-results-table'
            placeResultsArray={this.state.cafeResults}
          />

          <CardTable 
            cardId='kids-activity-results-card'
            cardText='Kids Activity Results'
            tableId='kids-activity-results-table'
            placeResultsArray={this.state.kidsActivityResults}
          />
        </div>

      </div>
    )
  }
}

export default App

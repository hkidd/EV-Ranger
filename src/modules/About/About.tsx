import { Link } from 'react-router-dom'
import RangerHeader from '../Buyer/RangerHeader'
import RangerFooter from '../Buyer/RangerFooter'
import RangeExample from './RangeExample'
import '../Buyer/buyer.css'

export default function About() {
  return (
    <main className="buyer-app">
      <RangerHeader />
      <article className="buyer-explainer">
        <h1>How it works</h1>
        <p className="buyer-explainer-lead">
          Pick a few EVs and see how they compare on the same trip. Change the
          charge, temperature or driving mix to see what makes a difference.
        </p>
        <Link className="buyer-text-link" to="/compare">
          Compare cars
        </Link>
        <RangeExample />
        <nav className="buyer-explainer-nav" aria-label="Page sections">
          <a href="#read-the-map">The map</a>
          <a href="#comparison-conditions">Conditions</a>
          <a href="#terrain-estimates">Elevation</a>
          <a href="#estimate-sources">Data sources</a>
        </nav>
        <section>
          <h2>Pick your cars</h2>
          <p>
            You can compare three cars at a time. Each card groups the
            configurations for a model and year. Pick the trim and wheels that
            match the car you’re looking at.
          </p>
          <p>
            The names come from EPA records, so they won’t always match a
            dealer’s trim names. Older EVs are included where records are
            available. Missing specifications stay marked as missing.
          </p>
        </section>
        <section id="read-the-map">
          <h2>See where you could go</h2>
          <p>
            Start in Explore to compare your cars’ approximate range areas.
            Filter parks, attractions, museums and campsites, then pan or zoom
            to discover places. Groups expand as you zoom closer; results are
            drawn from the provider’s directory and are not exhaustive.
          </p>
          <p>
            Each selected car has a color. In one-way mode, the shaded areas
            show their estimated reach. The boundary uses a distance budget; it
            does not include our elevation adjustment. Individual trip checks
            can include elevation.
          </p>
          <p>
            When you have narrowed down your cars, open Trips to compare a drive
            you know. Choose There & back to check the actual return route too,
            rather than cutting the one-way range in half.
          </p>
        </section>
        <section id="comparison-conditions">
          <h2>Change the conditions</h2>
          <p>
            Charge, reserve and temperature apply to all the cars. Reserve is
            the charge you want left when you arrive. Choose city, highway or
            combined EPA range as the starting reference. If city or highway
            data is missing, we use combined range.
          </p>
          <p>
            Route weather shows forecasts for the current hour at a few points
            along the drive. You can apply the sampled average temperature or
            set your own. Wind and rain are shown for context but don’t change
            the estimate yet.
          </p>
          <p>
            The temperature adjustment is a general model, not a measured result
            for every car. City and highway references don’t classify each road
            segment or predict your driving style.
          </p>
        </section>
        <section id="terrain-estimates">
          <h2>Account for hills</h2>
          <p>
            Climbing uses energy. Descending can recover some of it. Enter
            usable battery capacity and vehicle weight, including passengers and
            luggage, to try the experimental elevation estimate.
          </p>
          <p>
            Elevation currently covers part of Colorado’s Front Range and nearby
            mountains. It does not cover the whole state or country. If a route
            leaves that coverage, we use the EPA and temperature estimate
            without adding a made-up terrain adjustment.
          </p>
        </section>
        <section>
          <h2>What’s not included</h2>
          <p>
            Charging stops, battery aging, live traffic, closures and individual
            driving habits aren’t modeled yet. Weather may also change before
            you arrive. Use the results to compare cars and plan further, rather
            than treating an arrival estimate as a guarantee.
          </p>
          <p>
            Cars, saved trips and manual settings stay in this browser. Start
            fresh clears them. Weather and search results are refreshed instead
            of saved.
          </p>
        </section>
        <section id="estimate-sources">
          <h2>Data sources</h2>
          <ul>
            <li>
              <a href="https://www.fueleconomy.gov/feg/epadata/vehicles.csv">
                US EPA
              </a>{' '}
              — vehicle configurations and rated range.
            </li>
            <li>
              <a href="https://www.mapbox.com/">Mapbox</a> — maps, location
              search and road routes.
            </li>
            <li>
              <a href="https://www.tomtom.com/">TomTom</a> — places and reach
              boundaries.
            </li>
            <li>
              <a href="https://www.usgs.gov/3d-elevation-program">USGS 3DEP</a>{' '}
              — elevation.
            </li>
            <li>
              <a href="https://www.weather.gov/">National Weather Service</a> —
              hourly forecasts.
            </li>
          </ul>
          <p>
            You can also open each vehicle’s source record from the comparison.
          </p>
        </section>
      </article>
      <RangerFooter />
    </main>
  )
}

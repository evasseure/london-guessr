# LondonGuessr

A little game to learn the London boroughs.

### More maps

This could easily be adapted to use other maps, but I decided to focus on London.

### Routes

- `/` the "game"
- `/render` helper route to transform the geojson to a svg. I could also have rendered the geojson directly, but using a simple svg was nicer.

### Running the project

- `npm install`
- `npm start`

### Data files

- `london-map.svg` the London boroughs svg map
- `boroughs.json` contains the questions data
- `london-boroughs-geojson.json` the complete London boroughs geo-json

### Todo

- [ ] Fix zone hint labels centering
- [ ] Code cleanup
- [ ] Responsivity?
- [x] When click correct on last life, should be yellow
- [x] End state
- [x] Timer
- [x] Tries counter display
- [x] Change dataset
- [x] Don't redraw everything at every render

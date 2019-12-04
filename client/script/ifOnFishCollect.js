/* eslint-disable guard-for-in */
import {hitTestRectangle} from './PIXIutils'
import {stage} from './game'
import {Text} from 'pixi.js'

export const ifOnFishCollect = (boat, fishes) => {
  fishes.forEach(fish => {
    if (hitTestRectangle(boat.sprite, fish.sprite)) {
      let boatCurrentFishes = 0
      for (let key in boat.fishes) {
        boatCurrentFishes += boat.fishes[key]
      }
      const boatMaxIntake = boat.maxFishes - boatCurrentFishes
      const fishToDeplete = Math.min(
        fish.population,
        Math.min(boatMaxIntake, boat.fishPerTurn)
      )
      fish.population -= fishToDeplete
      if (fish.population <= 0) {
        stage.removeChild(fish.sprite)
      }

      boatCurrentFishes += fishToDeplete
      boat.fishes[fish.fishType] += fishToDeplete

      if (boatCurrentFishes === boat.maxFishes && !boat.maxFishesText) {
        const textStyle = {
          fontFamily: 'Arial',
          fontSize: 12,
          fill: 'red',
          align: 'center',
          anchor: 0.5
        }
        const fishesMaxWarning = new Text('🐟 MAX', textStyle)
        fishesMaxWarning.x += 0
        fishesMaxWarning.y += 40
        boat.sprite.addChild(fishesMaxWarning)
        boat.maxFishesText = fishesMaxWarning
      }
    }
  })
}

import {hitTestRectangle} from './PIXIutils'
import {stage} from './game'

export const ifOnFishCollect = (boat, fishes) => {
  fishes.forEach(fish => {
    if (hitTestRectangle(boat.sprite, fish.sprite)) {
      const fishToDeplete = Math.min(fish.population, boat.fishPerTurn)
      fish.population -= fishToDeplete
      if (fish.population <= 0) {
        stage.removeChild(fish.sprite)
      }
      boat.fishes[fish.fishType] += fishToDeplete
    }
  })
}

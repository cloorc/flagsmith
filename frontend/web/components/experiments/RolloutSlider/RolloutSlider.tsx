import { ChangeEvent, FC } from 'react'
import './RolloutSlider.scss'

type RolloutSliderProps = {
  value: number
  onChange: (value: number) => void
}

const RolloutSlider: FC<RolloutSliderProps> = ({ onChange, value }) => {
  return (
    <div className='rollout-slider'>
      <div className='rollout-slider__readout'>{value}%</div>
      <input
        type='range'
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(Number(e.target.value))
        }
        className='rollout-slider__input'
        aria-label='Rollout percentage'
      />
      <div className='rollout-slider__scale'>
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

export default RolloutSlider
